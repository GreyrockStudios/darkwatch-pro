from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    monitor_name = serializers.CharField(source='monitor.name', read_only=True, default=None)

    class Meta:
        model = Alert
        fields = ['id', 'severity', 'title', 'description', 'source', 'status', 'monitor', 'monitor_name', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'created_at', 'resolved_at']