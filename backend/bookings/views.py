from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
import os

try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer
from shows.models import Show
from payments.models import Payment
from users.permissions import IsAdminUser


class BookingCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BookingCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            show = Show.objects.select_for_update().get(
                pk=serializer.validated_data['show'].pk
            )

            total_qty = (
                serializer.validated_data.get('quantity_adult', 1) +
                serializer.validated_data.get('quantity_child', 0)
            )

            if total_qty > show.available_seats:
                return Response(
                    {'error': f'Only {show.available_seats} seats left'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ── Booking create — serializer mein total calculate hoga ──
            booking = serializer.save()

        # ── Verify total amount ────────────────────────────────────────
        total_paise = int(booking.total_amount * 100)
        print(f"✅ RAZORPAY ORDER: booking={booking.booking_ref} amount=₹{booking.total_amount} paise={total_paise}")

        # ── Razorpay order create ──────────────────────────────────────
        if RAZORPAY_AVAILABLE:
            try:
                client = razorpay.Client(
                    auth=(
                        os.getenv('RAZORPAY_KEY_ID'),
                        os.getenv('RAZORPAY_KEY_SECRET'),
                    )
                )
                order = client.order.create({
                    'amount':   total_paise,
                    'currency': 'INR',
                    'receipt':  booking.booking_ref,
                    'notes': {
                        'booking_ref':  booking.booking_ref,
                        'visitor_name': booking.visitor_name,
                        'show':         show.name,
                    }
                })
                razorpay_order_id = order['id']
                print(f"✅ Razorpay order created: {razorpay_order_id} for ₹{booking.total_amount}")
            except Exception as e:
                print(f"❌ Razorpay error: {e}")
                razorpay_order_id = f'order_dummy_{booking.booking_ref}'
        else:
            razorpay_order_id = f'order_dummy_{booking.booking_ref}'

        # ── Payment record ─────────────────────────────────────────────
        Payment.objects.create(
            booking=booking,
            razorpay_order_id=razorpay_order_id,
            amount=booking.total_amount,
            currency='INR',
            status='created',
        )

        return Response({
            'booking':           BookingSerializer(booking).data,
            'razorpay_order_id': razorpay_order_id,
            'razorpay_key_id':   os.getenv('RAZORPAY_KEY_ID', 'test_key'),
            'amount':            total_paise,   # ← GST + discount included
        }, status=status.HTTP_201_CREATED)


class BookingDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, booking_ref):
        booking = get_object_or_404(Booking, booking_ref=booking_ref)
        return Response(BookingSerializer(booking).data)


class MyBookingsView(generics.ListAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs         = Booking.objects.filter(user=self.request.user)
        status_val = self.request.query_params.get('status')
        if status_val:
            qs = qs.filter(status=status_val)
        return qs.order_by('-created_at')


class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, booking_ref):
        booking = get_object_or_404(
            Booking,
            booking_ref=booking_ref,
            user=request.user
        )

        if booking.status != 'confirmed':
            return Response(
                {'error': 'Only confirmed bookings can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from datetime import date
        days_left = (booking.show.date - date.today()).days
        if days_left < 1:
            return Response(
                {'error': 'Cannot cancel within 24 hours of visit'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'cancelled'
        booking.save()

        with transaction.atomic():
            show = Show.objects.select_for_update().get(pk=booking.show.pk)
            show.booked_count = max(0, show.booked_count - booking.total_tickets)
            show.save()

        return Response({'message': 'Booking cancelled successfully'})


class AdminBookingsView(generics.ListAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs         = Booking.objects.all()
        status_val = self.request.query_params.get('status')
        date_val   = self.request.query_params.get('date')
        if status_val:
            qs = qs.filter(status=status_val)
        if date_val:
            qs = qs.filter(show__date=date_val)
        return qs.order_by('-created_at')