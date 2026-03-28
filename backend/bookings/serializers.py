from rest_framework import serializers
from .models import Booking
from shows.serializers import ShowSerializer


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Booking
        fields = (
            'show', 'visitor_name', 'visitor_email',
            'visitor_phone', 'quantity_adult', 'quantity_child',
            'dialogflow_session',
        )

    def validate(self, data):
        show = data['show']

        # Check availability
        total_qty = data.get('quantity_adult', 1) + data.get('quantity_child', 0)
        if total_qty > show.available_seats:
            raise serializers.ValidationError(
                f'Only {show.available_seats} seats available'
            )
        if not show.is_active:
            raise serializers.ValidationError('This show is not available for booking')
        return data

    def create(self, validated_data):
        show  = validated_data['show']
        adult = validated_data.get('quantity_adult', 1)
        child = validated_data.get('quantity_child', 0)

        # Calculate total
        total = (adult * show.price_adult) + (child * show.price_child)
        validated_data['total_amount'] = total

        # Set user if logged in
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user

        return super().create(validated_data)


class BookingSerializer(serializers.ModelSerializer):
    show    = ShowSerializer(read_only=True)
    payment = serializers.SerializerMethodField()

    class Meta:
        model  = Booking
        fields = (
            'id', 'booking_ref', 'show', 'visitor_name',
            'visitor_email', 'visitor_phone',
            'quantity_adult', 'quantity_child', 'total_tickets',
            'total_amount', 'status', 'qr_code',
            'payment', 'created_at',
        )
        read_only_fields = fields

    def get_payment(self, obj):
        try:
            p = obj.payment
            return {
                'razorpay_order_id':   p.razorpay_order_id,
                'status':              p.status,
                'amount':              p.amount,
                'payment_method':      p.payment_method,
            }
        except Exception:
            return None