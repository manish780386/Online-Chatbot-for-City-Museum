from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('is_staff',     True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role',         'superadmin')
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ('visitor',    'Visitor'),
        ('admin',      'Admin'),
        ('superadmin', 'Super Admin'),
    ]

    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
    ]

    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email              = models.EmailField(unique=True)
    full_name          = models.CharField(max_length=200)
    phone              = models.CharField(max_length=20, unique=True)
    role               = models.CharField(max_length=20, choices=ROLE_CHOICES, default='visitor')
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    is_active          = models.BooleanField(default=True)
    is_staff           = models.BooleanField(default=False)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    objects  = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['full_name', 'phone']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'

    def __str__(self):
        return f'{self.full_name} ({self.email})'

    @property
    def is_admin(self):
        return self.role in ('admin', 'superadmin')
    
# Existing User model ke baad add karo
class Feedback(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 6)]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=200)
    email      = models.EmailField(blank=True)
    rating     = models.IntegerField(choices=RATING_CHOICES, default=5)
    message    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.rating}★'