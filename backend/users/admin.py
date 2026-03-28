from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ('email', 'full_name', 'phone', 'role', 'is_active', 'created_at')
    list_filter    = ('role', 'is_active')
    search_fields  = ('email', 'full_name', 'phone')
    ordering       = ('-created_at',)
    fieldsets      = (
        (None,          {'fields': ('email', 'password')}),
        ('Personal',    {'fields': ('full_name', 'phone', 'preferred_language')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets  = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'full_name', 'phone', 'password1', 'password2', 'role'),
        }),
    )