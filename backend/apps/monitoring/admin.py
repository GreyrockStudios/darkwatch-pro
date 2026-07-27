from django.contrib import admin
from .models import Monitor


@admin.register(Monitor)
class MonitorAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'value', 'status', 'user', 'created_at', 'breach_count']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['name', 'value', 'user__email']
    readonly_fields = ['created_at']