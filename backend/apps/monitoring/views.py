from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Monitor
from .serializers import MonitorSerializer


class MonitorViewSet(viewsets.ModelViewSet):
    serializer_class = MonitorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Monitor.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        monitor = self.get_object()
        monitor.status = 'active'
        monitor.save()
        return Response({'status': 'active'})

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        monitor = self.get_object()
        monitor.status = 'paused'
        monitor.save()
        return Response({'status': 'paused'})