from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    """Custom user model with email-based authentication."""

    username = None
    email = models.EmailField('email address', unique=True)

    objects = UserManager()
    company = models.CharField(max_length=255, blank=True)
    plan = models.CharField(
        max_length=20,
        choices=[
            ('basic', 'Basic'),
            ('advanced', 'Advanced'),
            ('enterprise', 'Enterprise'),
        ],
        default='basic',
    )
    credits = models.PositiveIntegerField(default=100)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'accounts_user'

    def __str__(self):
        return self.email