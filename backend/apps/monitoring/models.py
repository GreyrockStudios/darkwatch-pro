from django.db import models
from django.conf import settings


class Monitor(models.Model):
    """Dark web monitor for tracking compromised data."""

    TYPE_CHOICES = [
        ('email', 'Email'),
        ('domain', 'Domain'),
        ('username', 'Username'),
        ('ip', 'IP Address'),
        ('phone', 'Phone'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('alerting', 'Alerting'),
        ('error', 'Error'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monitors')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    value = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    last_check_status = models.CharField(max_length=50, blank=True)
    last_check_message = models.TextField(blank=True)
    breach_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'monitoring_monitor'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
