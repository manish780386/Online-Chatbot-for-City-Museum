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
        email    = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, email=email, password=password)

        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is deactivated'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user':          UserSerializer(user).data,
            'access_token':  str(refresh.access_token),
            'refresh_token': str(refresh),
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