from django.db import models
from django.conf import settings


class Report(models.Model):
    """Generated reports for breach analysis, compliance, etc."""

    TYPE_CHOICES = [
        ('breach', 'Breach Analysis'),
        ('executive', 'Executive Summary'),
        ('compliance', 'Compliance Report'),
        ('domain', 'Domain Security'),
        ('monitoring', 'Monitoring Summary'),
    ]

    STATUS_CHOICES = [
        ('generating', 'Generating'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=500)
    data = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reports_report'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_type_display()})"