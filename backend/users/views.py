from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer
from .models import User

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    from bookings.models import Booking
    from payments.models import Payment
    from django.db.models import Sum
    from django.utils import timezone
    from datetime import timedelta

    today    = timezone.now().date()
    week_ago = today - timedelta(days=7)

    total_bookings = Booking.objects.filter(status='confirmed').count()
    today_bookings = Booking.objects.filter(status='confirmed', created_at__date=today).count()
    today_revenue  = Payment.objects.filter(
        status='paid', paid_at__date=today
    ).aggregate(total=Sum('amount'))['total'] or 0

    weekly = []
    for i in range(6, -1, -1):
        d        = today - timedelta(days=i)
        revenue  = Payment.objects.filter(status='paid', paid_at__date=d).aggregate(total=Sum('amount'))['total'] or 0
        bookings = Booking.objects.filter(status='confirmed', created_at__date=d).count()
        weekly.append({
            'day':      d.strftime('%a'),
            'date':     str(d),
            'revenue':  float(revenue),
            'bookings': bookings,
        })

    return Response({
        'total_bookings': total_bookings,
        'today_bookings': today_bookings,
        'today_revenue':  float(today_revenue),
        'weekly':         weekly,
    })

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':          UserSerializer(user).data,
            'access_token':  str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()

        if not email or not password:
            return Response(
                {'error': 'Email aur password required hai'},
                status=status.HTTP_400_BAD_REQUEST
            )

        User = get_user_model()

        # Email ya phone se dhundho
        user = None
        try:
            if '@' in email:
                user = User.objects.get(email=email)
            else:
                phone = email.replace(' ', '').replace('+91', '').replace('91', '')
                user  = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found. Please register first.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Wrong password. Please try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account deactivated. Contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            # ── Dono format mein bhejo — frontend safe ─────────────────
            'access':        str(refresh.access_token),
            'refresh':       str(refresh),
            'access_token':  str(refresh.access_token),   # ← legacy
            'refresh_token': str(refresh),                 # ← legacy
            'user': {
                'id':        str(user.id),
                'email':     user.email,
                'full_name': getattr(user, 'full_name', '') or '',
                'phone':     getattr(user, 'phone', '') or '',
            }
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh = request.data.get('refresh_token')
            token   = RefreshToken(refresh)
            token.blacklist()
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
# Feedback aur Profile ke liye views add karo
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import models
import uuid


# ── Feedback Model (users/models.py mein add karo) ────────────────────────
# class Feedback(models.Model):
#     id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
#     name       = models.CharField(max_length=200)
#     email      = models.EmailField(blank=True)
#     rating     = models.IntegerField(default=5)
#     message    = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     class Meta:
#         db_table = 'feedback'
#         ordering = ['-created_at']


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_feedback(request):
    from .models import Feedback
    name    = request.data.get('name', '').strip()
    email   = request.data.get('email', '').strip()
    rating  = request.data.get('rating', 5)
    message = request.data.get('message', '').strip()

    if not name or not message:
        return Response({'error': 'Name and message are required'}, status=400)

    if not (1 <= int(rating) <= 5):
        return Response({'error': 'Rating must be 1-5'}, status=400)

    fb = Feedback.objects.create(
        name=name, email=email, rating=int(rating), message=message
    )
    return Response({'message': 'Feedback submitted! Thank you 🙏', 'id': str(fb.id)})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_feedback(request):
    from .models import Feedback
    feedbacks = Feedback.objects.all()[:20]
    data = [{
        'id':         str(f.id),
        'name':       f.name,
        'rating':     f.rating,
        'message':    f.message,
        'created_at': f.created_at.strftime('%d %b %Y'),
    } for f in feedbacks]
    return Response(data)





@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user

    if request.method == 'GET':
        from bookings.models import Booking
        bookings = Booking.objects.filter(user=user)

        # ── date_joined fix — created_at ya custom field use karo ─────
        joined_date = ''
        if hasattr(user, 'date_joined') and user.date_joined:
            joined_date = user.date_joined.strftime('%d %b %Y')
        elif hasattr(user, 'created_at') and user.created_at:
            joined_date = user.created_at.strftime('%d %b %Y')
        else:
            joined_date = 'Member'

        total_spent = bookings.filter(status='confirmed').aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0

        return Response({
            'id':                  str(user.id),
            'full_name':           getattr(user, 'full_name', '') or getattr(user, 'name', ''),
            'email':               user.email,
            'phone':               getattr(user, 'phone', '') or '',
            'date_joined':         joined_date,
            'total_bookings':      bookings.count(),
            'confirmed_bookings':  bookings.filter(status='confirmed').count(),
            'total_spent':         str(total_spent),
        })

    elif request.method == 'PATCH':
        full_name = request.data.get('full_name', '').strip()
        phone     = request.data.get('phone', '').strip()

        if full_name:
            if hasattr(user, 'full_name'):
                user.full_name = full_name
            elif hasattr(user, 'name'):
                user.name = full_name

        if phone and hasattr(user, 'phone'):
            user.phone = phone

        user.save()
        return Response({
            'message':   'Profile updated!',
            'full_name': getattr(user, 'full_name', '') or getattr(user, 'name', ''),
            'phone':     getattr(user, 'phone', '') or '',
        })