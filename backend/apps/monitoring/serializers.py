from rest_framework import serializers
from .models import Monitor


class MonitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Monitor
        fields = ['id', 'name', 'type', 'value', 'status', 'created_at', 'last_checked', 'breach_count']
        read_only_fields = ['id', 'created_at', 'last_checked', 'breach_count']