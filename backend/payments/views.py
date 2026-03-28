from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from django.utils import timezone
import hmac, hashlib, os

try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

from .models import Payment
from bookings.models import Booking
from shows.models import Show
from users.permissions import IsAdminUser


class PaymentVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        order_id   = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature  = request.data.get('razorpay_signature')

        if not all([order_id, payment_id, signature]):
            return Response(
                {'error': 'Missing payment details'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Verify HMAC signature ──────────────────────────────────────
        key    = os.getenv('RAZORPAY_KEY_SECRET', '').encode()
        msg    = f'{order_id}|{payment_id}'.encode()
        digest = hmac.new(key, msg, hashlib.sha256).hexdigest()

        if digest != signature:
            return Response(
                {'error': 'Payment verification failed — invalid signature'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Get payment record ─────────────────────────────────────────
        try:
            payment = Payment.objects.get(razorpay_order_id=order_id)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Already paid check
        if payment.status == 'paid':
            return Response({
                'message':     'Payment already verified',
                'booking_ref': payment.booking.booking_ref,
            })

        with transaction.atomic():
            # ── Update payment ─────────────────────────────────────────
            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature  = signature
            payment.status              = 'paid'
            payment.paid_at             = timezone.now()
            payment.save()

            # ── Confirm booking ────────────────────────────────────────
            booking        = payment.booking
            booking.status = 'confirmed'
            booking.save()

            # ── Update show seat count with row lock ───────────────────
            show = Show.objects.select_for_update().get(pk=booking.show.pk)
            show.booked_count += booking.total_tickets
            show.save()

        # ── QR Code generate karo — direct call (Celery nahi) ─────────
        try:
            from bookings.tasks import generate_qr_and_send_ticket
            generate_qr_and_send_ticket(str(booking.id))
            print(f"QR generated for {booking.booking_ref}")
        except Exception as e:
            print(f"QR Error: {e}")

        # ── SMS — optional ─────────────────────────────────────────────
        try:
            from bookings.tasks import send_sms_confirmation
            send_sms_confirmation(str(booking.id))
        except Exception as e:
            print(f"SMS Error: {e}")

        return Response({
            'message':     'Payment verified! Booking confirmed.',
            'booking_ref': booking.booking_ref,
            'show':        booking.show.name,
            'date':        str(booking.show.date),
            'tickets':     booking.total_tickets,
            'amount':      str(booking.total_amount),
        })

class PaymentWebhookView(APIView):
    """
    Razorpay server-to-server webhook
    Yeh tab trigger hota hai jab Razorpay apne server se payment confirm karta hai
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # ── Verify Razorpay webhook signature ─────────────────────────
        webhook_secret = os.getenv('RAZORPAY_WEBHOOK_SECRET', '')
        signature      = request.headers.get('X-Razorpay-Signature', '')
        body           = request.body

        if webhook_secret:
            digest = hmac.new(
                webhook_secret.encode(),
                body,
                hashlib.sha256
            ).hexdigest()

            if digest != signature:
                return Response(
                    {'error': 'Invalid webhook signature'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        event = request.data.get('event', '')

        # ── payment.captured ──────────────────────────────────────────
        if event == 'payment.captured':
            try:
                payment_entity = request.data['payload']['payment']['entity']
                order_id       = payment_entity.get('order_id')
                payment_id     = payment_entity.get('id')
                method         = payment_entity.get('method', '')

                payment = Payment.objects.get(razorpay_order_id=order_id)

                if payment.status != 'paid':
                    with transaction.atomic():
                        payment.razorpay_payment_id = payment_id
                        payment.status              = 'paid'
                        payment.payment_method      = method
                        payment.paid_at             = timezone.now()
                        payment.save()

                        booking        = payment.booking
                        booking.status = 'confirmed'
                        booking.save()

                        show = Show.objects.select_for_update().get(pk=booking.show.pk)
                        show.booked_count += booking.total_tickets
                        show.save()

                    # Async tasks
                    try:
                        from bookings.tasks import generate_qr_and_send_ticket, send_sms_confirmation
                        generate_qr_and_send_ticket.delay(str(booking.id))
                        send_sms_confirmation.delay(str(booking.id))
                    except Exception:
                        pass

            except Payment.DoesNotExist:
                pass
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # ── payment.failed ────────────────────────────────────────────
        elif event == 'payment.failed':
            try:
                payment_entity = request.data['payload']['payment']['entity']
                order_id       = payment_entity.get('order_id')

                payment = Payment.objects.get(razorpay_order_id=order_id)
                if payment.status == 'created':
                    payment.status = 'failed'
                    payment.save()
            except Payment.DoesNotExist:
                pass

        # ── refund.processed ──────────────────────────────────────────
        elif event == 'refund.processed':
            try:
                refund_entity = request.data['payload']['refund']['entity']
                payment_id    = refund_entity.get('payment_id')

                payment = Payment.objects.get(razorpay_payment_id=payment_id)
                payment.status = 'refunded'
                payment.save()

                booking        = payment.booking
                booking.status = 'refunded'
                booking.save()
            except Payment.DoesNotExist:
                pass

        return Response({'status': 'ok'})


class RefundView(APIView):
    """
    User ki request pe refund initiate karo
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_ref = request.data.get('booking_ref')

        if not booking_ref:
            return Response(
                {'error': 'booking_ref required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            booking = Booking.objects.get(
                booking_ref=booking_ref,
                user=request.user
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.status != 'confirmed':
            return Response(
                {'error': f'Cannot refund — booking is {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 24 hour policy check
        from datetime import date
        days_left = (booking.show.date - date.today()).days
        if days_left < 1:
            return Response(
                {'error': 'Refund not allowed within 24 hours of visit'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = booking.payment
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment record not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ── Razorpay refund initiate ───────────────────────────────────
        if RAZORPAY_AVAILABLE and payment.razorpay_payment_id:
            try:
                client = razorpay.Client(
                    auth=(
                        os.getenv('RAZORPAY_KEY_ID'),
                        os.getenv('RAZORPAY_KEY_SECRET')
                    )
                )
                refund = client.payment.refund(
                    payment.razorpay_payment_id,
                    {'amount': int(payment.amount * 100)}
                )
                refund_id = refund.get('id', '')
            except Exception as e:
                return Response(
                    {'error': f'Razorpay refund failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            refund_id = f'refund_dummy_{booking_ref}'

        with transaction.atomic():
            # Update booking + payment
            booking.status = 'cancelled'
            booking.save()

            payment.status = 'refunded'
            payment.save()

            # Return seats
            show = Show.objects.select_for_update().get(pk=booking.show.pk)
            show.booked_count -= booking.total_tickets
            show.save()

        return Response({
            'message':   'Refund initiated successfully',
            'refund_id': refund_id,
            'amount':    str(payment.amount),
        })