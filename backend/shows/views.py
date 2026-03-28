from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Show
from .serializers import ShowSerializer


class ShowListView(generics.ListAPIView):
    serializer_class   = ShowSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Show.objects.all()
        category = self.request.query_params.get('category')

        if category:
            queryset = queryset.filter(category=category)
        else:
            queryset = queryset.filter(is_active=True)

        return queryset.order_by('date', 'start_time')


class ShowCreateView(generics.CreateAPIView):
    queryset           = Show.objects.all()
    serializer_class   = ShowSerializer
    permission_classes = [IsAuthenticated]


class ShowUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Show.objects.all()
    serializer_class   = ShowSerializer
    permission_classes = [IsAuthenticated]