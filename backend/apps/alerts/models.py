from django.db import models
from django.conf import settings


class Alert(models.Model):
    """Alert triggered by monitors or manual searches."""

    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('acknowledged', 'Acknowledged'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alerts')
    monitor = models.ForeignKey('monitoring.Monitor', on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'alerts_alert'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity.upper()}] {self.title}"