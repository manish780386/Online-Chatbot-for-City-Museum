from django.urls import path
from . import views

urlpatterns = [
    path('',           views.ShowListView.as_view(),   name='show-list'),
    path('create/',    views.ShowCreateView.as_view(), name='show-create'),
    path('<uuid:pk>/', views.ShowUpdateView.as_view(), name='show-detail'),
]