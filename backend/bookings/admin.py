from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ('booking_ref', 'visitor_name', 'show', 'total_tickets', 'total_amount', 'status', 'created_at')
    list_filter   = ('status', 'created_at')
    search_fields = ('booking_ref', 'visitor_name', 'visitor_email', 'visitor_phone')
    ordering      = ('-created_at',)
    readonly_fields = ('booking_ref', 'created_at', 'updated_at')