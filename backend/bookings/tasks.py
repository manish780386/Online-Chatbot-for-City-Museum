import qrcode
from io import BytesIO
from django.core.files import File


def generate_qr_and_send_ticket(booking_id):
    from .models import Booking

    try:
        booking = Booking.objects.select_related('show').get(id=booking_id)

        # ── QR Code generate karo ─────────────────────────────────────
        qr_data = (
            f"BOOKING:{booking.booking_ref}|"
            f"SHOW:{booking.show.name}|"
            f"DATE:{booking.show.date}|"
            f"TICKETS:{booking.total_tickets}|"
            f"NAME:{booking.visitor_name}"
        )

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img    = qr.make_image(fill_color="black", back_color="white")
        img_io = BytesIO()
        img.save(img_io, format='PNG')
        img_io.seek(0)

        filename = f"qr_{booking.booking_ref}.png"
        booking.qr_code.save(filename, File(img_io), save=True)

        print(f"QR saved: media/qr_codes/{filename}")

        # ── Email send karo ───────────────────────────────────────────
        _send_ticket_email(booking)

        return True

    except Exception as e:
        print(f"QR generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def _send_ticket_email(booking):
    try:
        from django.core.mail import EmailMultiAlternatives
        import os

        subject = f"Your Museum Ticket — {booking.booking_ref}"

        text_content = (
            f"Hello {booking.visitor_name},\n\n"
            f"Your booking is confirmed!\n\n"
            f"Booking Ref : {booking.booking_ref}\n"
            f"Show        : {booking.show.name}\n"
            f"Date        : {booking.show.date}\n"
            f"Tickets     : {booking.total_tickets}\n"
            f"Amount      : Rs.{booking.total_amount}\n\n"
            f"Please show the QR code at the museum gate.\n\n"
            f"Thank you for visiting City Museum!"
        )

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; }}
    .header h1 {{ color: white; margin: 0; font-size: 24px; }}
    .header p {{ color: rgba(255,255,255,0.8); margin: 5px 0 0; }}
    .body {{ padding: 30px; }}
    .row {{ display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }}
    .row:last-child {{ border-bottom: none; }}
    .label {{ color: #888; font-size: 14px; }}
    .value {{ color: #111; font-weight: bold; font-size: 14px; }}
    .amount {{ font-size: 28px; color: #4f46e5; font-weight: 900; text-align: center; padding: 20px; }}
    .footer {{ background: #f8f8f8; padding: 20px; text-align: center; color: #888; font-size: 12px; }}
    .badge {{ display: inline-block; background: #dcfce7; color: #16a34a; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin-bottom: 20px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>City Museum</h1>
      <p>Official Entry Ticket</p>
    </div>
    <div class="body">
      <p>Hello <strong>{booking.visitor_name}</strong>,</p>
      <span class="badge">✓ Booking Confirmed</span>
      <div class="row">
        <span class="label">Booking Ref</span>
        <span class="value">{booking.booking_ref}</span>
      </div>
      <div class="row">
        <span class="label">Show</span>
        <span class="value">{booking.show.name}</span>
      </div>
      <div class="row">
        <span class="label">Date</span>
        <span class="value">{booking.show.date}</span>
      </div>
      <div class="row">
        <span class="label">Time</span>
        <span class="value">{booking.show.start_time}</span>
      </div>
      <div class="row">
        <span class="label">Tickets</span>
        <span class="value">{booking.total_tickets}</span>
      </div>
      <div class="amount">₹{booking.total_amount}</div>
      <p style="text-align:center; color:#888; font-size:13px;">
        Show QR code at museum entry gate
      </p>
    </div>
    <div class="footer">
      City Museum • AI-Powered Ticketing • support@museum.com
    </div>
  </div>
</body>
</html>
        """

        from_email = os.getenv('EMAIL_HOST_USER', 'noreply@museum.com')
        to_email   = booking.visitor_email

        if not to_email or to_email == 'guest@museum.com':
            print("No valid email — skipping email send")
            return

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email],
        )
        email.attach_alternative(html_content, "text/html")

        # QR image attach karo
        if booking.qr_code:
            try:
                booking.qr_code.open('rb')
                email.attach(
                    f"qr_{booking.booking_ref}.png",
                    booking.qr_code.read(),
                    'image/png'
                )
                booking.qr_code.close()
            except Exception as e:
                print(f"QR attach error: {e}")

        email.send(fail_silently=True)
        print(f"Email sent to {to_email}")

    except Exception as e:
        print(f"Email error: {e}")


def send_sms_confirmation(booking_id):
    try:
        from .models import Booking
        import os

        booking = Booking.objects.get(id=booking_id)

        # Twilio configure hone ke baad kaam karega
        twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        if not twilio_sid:
            print(f"SMS skipped — Twilio not configured (would send to {booking.visitor_phone})")
            return True

        from twilio.rest import Client as TwilioClient
        client = TwilioClient(
            twilio_sid,
            os.getenv('TWILIO_AUTH_TOKEN'),
        )

        message = (
            f"Booking Confirmed! {booking.booking_ref} | "
            f"{booking.show.name} | {booking.show.date} | "
            f"{booking.total_tickets} tickets | Rs.{booking.total_amount} | "
            f"City Museum"
        )

        client.messages.create(
            body=message,
            from_=os.getenv('TWILIO_PHONE_NUMBER'),
            to=f"+91{booking.visitor_phone}",
        )

        print(f"SMS sent to {booking.visitor_phone}")
        return True

    except Exception as e:
        print(f"SMS Error: {e}")
        return False