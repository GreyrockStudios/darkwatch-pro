from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'type', 'title', 'data', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']