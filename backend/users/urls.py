from django.urls import path
from . import views

urlpatterns = [
    path('register/',  views.RegisterView.as_view(),  name='register'),
    path('login/',     views.LoginView.as_view(),     name='login'),
    path('logout/',    views.LogoutView.as_view(),    name='logout'),
    path('profile/',   views.profile_view,            name='profile'),
    path('analytics/', views.analytics_view,          name='analytics'),
    path('feedback/',  views.submit_feedback,         name='submit-feedback'),
    path('feedback/list/', views.get_feedback,        name='get-feedback'),
    
]