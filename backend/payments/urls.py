from django.urls import path
from . import views

urlpatterns = [
    path('verify/',  views.PaymentVerifyView.as_view(),  name='payment-verify'),
    path('webhook/', views.PaymentWebhookView.as_view(), name='payment-webhook'),
    path('refund/',  views.RefundView.as_view(),         name='payment-refund'),
]