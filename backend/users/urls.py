from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import analytics_view

urlpatterns = [
    
    path('analytics/', analytics_view, name='analytics'),
    path('register/', views.RegisterView.as_view(),  name='register'),
    path('login/',    views.LoginView.as_view(),      name='login'),
    path('logout/',   views.LogoutView.as_view(),     name='logout'),
    path('refresh/',  TokenRefreshView.as_view(),     name='token_refresh'),
    path('profile/',  views.ProfileView.as_view(),    name='profile'),
]