from django.db import models
from django.conf import settings


class SearchResult(models.Model):
    """Stores search query results from threat intelligence APIs."""

    TYPE_CHOICES = [
        ('email', 'Email'),
        ('domain', 'Domain'),
        ('username', 'Username'),
        ('ip', 'IP Address'),
        ('phone', 'Phone'),
    ]

    SOURCE_CHOICES = [
        ('dehashed', 'Dehashed'),
        ('hibp', 'Have I Been Pwned'),
        ('internal', 'Internal'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='search_results')
    query = models.CharField(max_length=500)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='dehashed')
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'search_searchresult'
        ordering = ['-created_at']

    def __str__(self):
        return f"Search: {self.query} ({self.get_type_display()})"