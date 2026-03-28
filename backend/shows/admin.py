from django.contrib import admin
from .models import Show

@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display  = ('name', 'category', 'date', 'start_time', 'available_seats', 'price_adult', 'is_active')
    list_filter   = ('category', 'is_active', 'date')
    search_fields = ('name',)
    ordering      = ('date', 'start_time')
    readonly_fields = ('booked_count',)