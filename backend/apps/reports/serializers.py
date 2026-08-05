from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'type', 'title', 'data', 'status', 'artifact_format', 'generated_at', 'created_at']
        read_only_fields = ['id', 'status', 'artifact_format', 'generated_at', 'created_at']
