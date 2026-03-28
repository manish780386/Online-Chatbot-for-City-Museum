from django.db import models
import uuid

class Show(models.Model):

    CATEGORY_CHOICES = [
        ('general',    'General Entry'),
        ('exhibition', 'Exhibition'),
        ('night_show', 'Night Show'),
        ('special',    'Special Show'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name           = models.CharField(max_length=200)
    category       = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description    = models.TextField(blank=True)
    date           = models.DateField(db_index=True)
    start_time     = models.TimeField()
    end_time       = models.TimeField()
    total_capacity = models.PositiveIntegerField()
    booked_count   = models.PositiveIntegerField(default=0)
    price_adult    = models.DecimalField(max_digits=8, decimal_places=2)
    price_child    = models.DecimalField(max_digits=8, decimal_places=2)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'shows'
        ordering  = ['date', 'start_time']
        verbose_name = 'Show'

    def __str__(self):
        return f'{self.name} — {self.date}'

    @property
    def available_seats(self):
        return self.total_capacity - self.booked_count

    @property
    def is_available(self):
        return self.is_active and self.available_seats > 0