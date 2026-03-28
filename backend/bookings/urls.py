from django.urls import path
from . import views

urlpatterns = [
    path('',                        views.BookingCreateView.as_view(),  name='booking-create'),
    path('my/',                     views.MyBookingsView.as_view(),      name='my-bookings'),
    path('admin/',                  views.AdminBookingsView.as_view(),   name='admin-bookings'),
    path('<str:booking_ref>/',      views.BookingDetailView.as_view(),   name='booking-detail'),
    path('<str:booking_ref>/cancel/', views.CancelBookingView.as_view(), name='booking-cancel'),
]