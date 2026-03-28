from django.db import models
import uuid

class Payment(models.Model):

    STATUS_CHOICES = [
        ('created',  'Created'),
        ('paid',     'Paid'),
        ('failed',   'Failed'),
        ('refunded', 'Refunded'),
    ]

    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking              = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='payment')
    razorpay_order_id    = models.CharField(max_length=100, unique=True)
    razorpay_payment_id  = models.CharField(max_length=100, blank=True, null=True, unique=True)
    razorpay_signature   = models.CharField(max_length=500, blank=True, null=True)
    amount               = models.DecimalField(max_digits=10, decimal_places=2)
    currency             = models.CharField(max_length=10, default='INR')
    status               = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    payment_method       = models.CharField(max_length=50, blank=True)
    paid_at              = models.DateTimeField(null=True, blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'

    def __str__(self):
        return f'{self.razorpay_order_id} — ₹{self.amount} — {self.status}'