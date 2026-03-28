from rest_framework import serializers
from .models import Show


class ShowSerializer(serializers.ModelSerializer):
    available_seats = serializers.ReadOnlyField()
    is_available    = serializers.ReadOnlyField()

    class Meta:
        model  = Show
        fields = '__all__'
        read_only_fields = ['id', 'booked_count', 'created_at']