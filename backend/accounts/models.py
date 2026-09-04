from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model with role-based access control."""

    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('planner', 'Planner'),
        ('viewer', 'Viewer'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_planner(self):
        return self.role in ['admin', 'planner']

    @property
    def can_export(self):
        return self.role in ['admin', 'planner']

    @property
    def can_trigger_retraining(self):
        return self.role == 'admin'
