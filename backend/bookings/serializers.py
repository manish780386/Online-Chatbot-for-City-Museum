from rest_framework import serializers
from .models import Booking
from shows.serializers import ShowSerializer
from decimal import Decimal, ROUND_HALF_UP


class BookingCreateSerializer(serializers.ModelSerializer):
    coupon_code    = serializers.CharField(required=False, allow_blank=True, write_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True)

    class Meta:
        model  = Booking
        fields = (
            'show', 'visitor_name', 'visitor_email',
            'visitor_phone', 'quantity_adult', 'quantity_child',
            'dialogflow_session', 'coupon_code', 'discount_amount',
        )

    def validate(self, data):
        show      = data['show']
        total_qty = data.get('quantity_adult', 1) + data.get('quantity_child', 0)

        if total_qty > show.available_seats:
            raise serializers.ValidationError(
                f'Only {show.available_seats} seats available'
            )
        if not show.is_active:
            raise serializers.ValidationError('This show is not available for booking')

        return data

    def create(self, validated_data):
        # ── Extra fields remove karo jo model mein nahi hain ──────────
        coupon_code     = validated_data.pop('coupon_code', '')
        discount_amount = validated_data.pop('discount_amount', Decimal('0'))

        show  = validated_data['show']
        adult = validated_data.get('quantity_adult', 1)
        child = validated_data.get('quantity_child', 0)

        # ── Decimal type safe calculation ─────────────────────────────
        price_adult = Decimal(str(show.price_adult))
        price_child = Decimal(str(show.price_child))
        adult_dec   = Decimal(str(adult))
        child_dec   = Decimal(str(child))

        subtotal = (adult_dec * price_adult) + (child_dec * price_child)

        # ── GST 5% ────────────────────────────────────────────────────
        gst = (subtotal * Decimal('0.05')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # ── Coupon discount ───────────────────────────────────────────
        COUPONS = {
            'MUSEUM10':  Decimal('0.10'),
            'WELCOME20': Decimal('0.20'),
            'STUDENT15': Decimal('0.15'),
        }
        discount = Decimal('0')
        if coupon_code and coupon_code.upper() in COUPONS:
            discount = (subtotal * COUPONS[coupon_code.upper()]).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )

        # ── Grand total ───────────────────────────────────────────────
        total = subtotal + gst - discount

        print(f"✅ BOOKING CALC:")
        print(f"   adult={adult} × ₹{price_adult} = ₹{adult_dec * price_adult}")
        print(f"   child={child} × ₹{price_child} = ₹{child_dec * price_child}")
        print(f"   subtotal = ₹{subtotal}")
        print(f"   GST(5%)  = ₹{gst}")
        print(f"   discount = ₹{discount} (coupon: {coupon_code})")
        print(f"   TOTAL    = ₹{total}")
        print(f"   PAISE    = {int(total * 100)}")

        validated_data['total_amount'] = total

        # ── User set karo ─────────────────────────────────────────────
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
                'razorpay_order_id': p.razorpay_order_id,
                'status':            p.status,
                'amount':            str(p.amount),
                'payment_method':    p.payment_method,
            }
        except Exception:
            return None