from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'status', 'user', 'created_at']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['title', 'user__email']
    readonly_fields = ['created_at']