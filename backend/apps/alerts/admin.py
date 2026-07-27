from django.contrib import admin
from .models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'severity', 'status', 'user', 'monitor', 'created_at']
    list_filter = ['severity', 'status', 'created_at']
    search_fields = ['title', 'source', 'user__email']
    readonly_fields = ['created_at', 'resolved_at']