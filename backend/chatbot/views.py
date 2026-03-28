from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
import json
from datetime import datetime, date

from shows.models import Show
from bookings.models import Booking


class DialogflowWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        body        = request.data
        intent_name = body.get('queryResult', {}).get('intent', {}).get('displayName', '')
        parameters  = body.get('queryResult', {}).get('parameters', {})
        session_id  = body.get('session', '').split('/')[-1]

        # Route to correct handler
        handlers = {
            'check_timings':        self.handle_timings,
            'check_availability':   self.handle_availability,
            'book_ticket':          self.handle_book_ticket,
            'book_ticket - date':   self.handle_book_ticket,
            'book_ticket - category': self.handle_book_ticket,
            'book_ticket - quantity': self.handle_book_ticket,
            'book_ticket - confirm':  self.handle_confirm,
            'cancel_booking':       self.handle_cancel,
            'check_booking_status': self.handle_status,
        }

        handler = handlers.get(intent_name, self.handle_fallback)
        return handler(parameters, session_id, body)

    # ── Check Timings ──────────────────────────────────────────────────
    def handle_timings(self, params, session_id, body):
        today = date.today()
        shows = Show.objects.filter(date=today, is_active=True)

        if not shows.exists():
            text = "No shows available today. Please check tomorrow!"
        else:
            lines = ["Today's Shows:\n"]
            for s in shows:
                lines.append(
                    f"{s.name} — {s.start_time.strftime('%I:%M %p')} to "
                    f"{s.end_time.strftime('%I:%M %p')} — Rs.{s.price_adult}/adult"
                )
            text = '\n'.join(lines)

        return Response({'fulfillmentText': text})

    # ── Check Availability ─────────────────────────────────────────────
    def handle_availability(self, params, session_id, body):
        date_param = params.get('date', '')

        try:
            if date_param:
                visit_date = datetime.fromisoformat(
                    date_param.replace('Z', '')
                ).date()
            else:
                visit_date = date.today()
        except Exception:
            visit_date = date.today()

        shows = Show.objects.filter(date=visit_date, is_active=True)

        if not shows.exists():
            text = f"No shows available on {visit_date.strftime('%d %B %Y')}."
        else:
            lines = [f"Shows on {visit_date.strftime('%d %B %Y')}:\n"]
            for s in shows:
                seats = s.available_seats
                status = f"{seats} seats left" if seats > 0 else "SOLD OUT"
                lines.append(f"{s.name} ({s.get_category_display()}) — Rs.{s.price_adult} — {status}")
            text = '\n'.join(lines)

        return Response({'fulfillmentText': text})

    # ── Book Ticket ────────────────────────────────────────────────────
    def handle_book_ticket(self, params, session_id, body):
        contexts    = body.get('queryResult', {}).get('outputContexts', [])
        booking_ctx = {}

        for ctx in contexts:
            if 'booking-context' in ctx.get('name', ''):
                booking_ctx = ctx.get('parameters', {})

        # Collect parameters from current + context
        date_param     = params.get('date') or booking_ctx.get('date', '')
        category_param = params.get('ticket_category') or booking_ctx.get('ticket_category', '')
        qty_param      = params.get('number') or booking_ctx.get('number', 0)

        missing = []
        if not date_param:     missing.append('date')
        if not category_param: missing.append('ticket category')
        if not qty_param:      missing.append('number of tickets')

        if missing:
            prompts = {
                'date':             "Which date would you like to visit?",
                'ticket category':  "Which show? General Entry, Exhibition, Night Show, or Dinosaur World?",
                'number of tickets':"How many tickets do you need?",
            }
            return Response({'fulfillmentText': prompts[missing[0]]})

        # Parse date
        try:
            visit_date = datetime.fromisoformat(
                date_param.replace('Z', '')
            ).date()
        except Exception:
            visit_date = date.today()

        # Map category
        cat_map = {
            'general entry': 'general',
            'general':       'general',
            'exhibition':    'exhibition',
            'art':           'exhibition',
            'night show':    'night_show',
            'night':         'night_show',
            'dinosaur':      'special',
            'special':       'special',
        }
        category = cat_map.get(str(category_param).lower(), 'general')

        # Find show
        try:
            show = Show.objects.get(
                date=visit_date,
                category=category,
                is_active=True
            )
        except Show.DoesNotExist:
            return Response({
                'fulfillmentText': f"Sorry, no {category_param} show on {visit_date.strftime('%d %B')}. Try another date?"
            })

        qty   = int(qty_param)
        total = qty * float(show.price_adult)

        # Build context for next turn
        output_context = [{
            'name':          f"{body.get('session')}/contexts/booking-context",
            'lifespanCount': 5,
            'parameters': {
                'show_id':         str(show.id),
                'show_name':       show.name,
                'date':            str(visit_date),
                'category':        category,
                'quantity':        qty,
                'total':           total,
                'ticket_category': category_param,
                'number':          qty,
            }
        }]

        text = (
            f"Here's your booking summary:\n\n"
            f"Show     : {show.name}\n"
            f"Date     : {visit_date.strftime('%d %B %Y')}\n"
            f"Tickets  : {qty}\n"
            f"Total    : Rs.{total:.0f}\n\n"
            f"Please share your name and mobile number to confirm."
        )

        return Response({
            'fulfillmentText': text,
            'outputContexts':  output_context,
        })

    # ── Confirm Booking ────────────────────────────────────────────────
    def handle_confirm(self, params, session_id, body):
        contexts    = body.get('queryResult', {}).get('outputContexts', [])
        booking_ctx = {}

        for ctx in contexts:
            if 'booking-context' in ctx.get('name', ''):
                booking_ctx = ctx.get('parameters', {})

        if not booking_ctx.get('show_id'):
            return Response({'fulfillmentText': "Sorry, I lost your booking details. Please start again."})

        # Frontend will handle actual booking creation + Razorpay
        text = (
            f"Your booking details are saved!\n\n"
            f"Please complete the payment on the website to confirm your tickets.\n"
            f"Booking Ref will be generated after payment."
        )

        return Response({'fulfillmentText': text})

    # ── Cancel Booking ─────────────────────────────────────────────────
    def handle_cancel(self, params, session_id, body):
        booking_id = params.get('booking_id', '')

        if not booking_id:
            return Response({
                'fulfillmentText': "Please share your Booking ID (e.g. BKG-20250322-00041) to cancel."
            })

        try:
            booking = Booking.objects.get(booking_ref=booking_id)
            if booking.status == 'confirmed':
                days_left = (booking.show.date - date.today()).days
                if days_left < 1:
                    text = "Sorry, cancellation is not allowed within 24 hours of visit."
                else:
                    text = (
                        f"Found booking: {booking.booking_ref}\n"
                        f"Show: {booking.show.name} on {booking.show.date}\n\n"
                        f"To cancel, please visit My Bookings on the website."
                    )
            else:
                text = f"Booking {booking_id} is already {booking.status}."
        except Booking.DoesNotExist:
            text = f"Booking {booking_id} not found. Please check the ID."

        return Response({'fulfillmentText': text})

    # ── Check Status ───────────────────────────────────────────────────
    def handle_status(self, params, session_id, body):
        booking_id = params.get('booking_id', '')

        if not booking_id:
            return Response({
                'fulfillmentText': "Please share your Booking ID to check status."
            })

        try:
            booking = Booking.objects.select_related('show').get(
                booking_ref=booking_id
            )
            text = (
                f"Booking Details:\n\n"
                f"Ref    : {booking.booking_ref}\n"
                f"Show   : {booking.show.name}\n"
                f"Date   : {booking.show.date}\n"
                f"Status : {booking.status.upper()}\n"
                f"Tickets: {booking.total_tickets}\n"
                f"Amount : Rs.{booking.total_amount}"
            )
        except Booking.DoesNotExist:
            text = f"Booking {booking_id} not found."

        return Response({'fulfillmentText': text})

    # ── Fallback ───────────────────────────────────────────────────────
    def handle_fallback(self, params, session_id, body):
        return Response({
            'fulfillmentText': (
                "I can help you with:\n"
                "• Book tickets\n"
                "• Check show timings\n"
                "• Check booking status\n"
                "• Cancel booking\n\n"
                "What would you like to do?"
            )
        })