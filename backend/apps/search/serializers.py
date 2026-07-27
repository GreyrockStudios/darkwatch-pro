from rest_framework import serializers
from .models import SearchResult


class SearchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchResult
        fields = ['id', 'query', 'type', 'source', 'data', 'created_at']
        read_only_fields = ['id', 'created_at']