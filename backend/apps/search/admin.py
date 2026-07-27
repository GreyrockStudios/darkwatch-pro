from django.contrib import admin
from .models import SearchResult


@admin.register(SearchResult)
class SearchResultAdmin(admin.ModelAdmin):
    list_display = ['query', 'type', 'source', 'user', 'created_at']
    list_filter = ['type', 'source', 'created_at']
    search_fields = ['query', 'user__email']
    readonly_fields = ['created_at']