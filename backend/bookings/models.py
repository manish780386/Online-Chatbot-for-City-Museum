from django.db import models
from django.conf import settings
import uuid

def generate_booking_ref():
    from datetime import date
    import random, string
    today  = date.today().strftime('%Y%m%d')
    suffix = ''.join(random.choices(string.digits, k=5))
    return f'BKG-{today}-{suffix}'


class Booking(models.Model):

    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('refunded',  'Refunded'),
    ]

    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_ref          = models.CharField(max_length=30, unique=True, default=generate_booking_ref, db_index=True)
    user                 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    show                 = models.ForeignKey('shows.Show', on_delete=models.PROTECT, related_name='bookings')
    visitor_name         = models.CharField(max_length=200)
    visitor_email        = models.EmailField()
    visitor_phone        = models.CharField(max_length=20)
    quantity_adult       = models.PositiveIntegerField(default=1)
    quantity_child       = models.PositiveIntegerField(default=0)
    total_amount         = models.DecimalField(max_digits=10, decimal_places=2)
    status               = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    dialogflow_session   = models.CharField(max_length=200, blank=True, db_index=True)
    qr_code              = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        verbose_name = 'Booking'

    def __str__(self):
        return f'{self.booking_ref} — {self.visitor_name}'

    @property
    def total_tickets(self):
        return self.quantity_adult + self.quantity_child