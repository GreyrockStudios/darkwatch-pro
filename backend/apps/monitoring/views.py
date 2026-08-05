from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .domain_intel import DomainValidationError, analyze_domain
from .models import Monitor
from .serializers import MonitorSerializer
from .tasks import check_monitor, threat_intel_provider_configured


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

    @action(detail=False, methods=['get', 'post'], url_path='domain-intelligence')
    def domain_intelligence(self, request):
        """Run keyless local domain intelligence checks."""
        return self._domain_analysis_response(request)

    @action(detail=False, methods=['get', 'post'], url_path='domain-security')
    def domain_security(self, request):
        """Run keyless local domain security checks."""
        return self._domain_analysis_response(request)

    def _domain_analysis_response(self, request):
        domain = request.data.get('domain') if request.method == 'POST' else request.query_params.get('domain')
        domain = domain or request.query_params.get('q') or request.data.get('q')

        try:
            result = analyze_domain(domain)
        except DomainValidationError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result)

    @action(detail=True, methods=['post'])
    def check(self, request, pk=None):
        monitor = self.get_object()
        if not threat_intel_provider_configured():
            result = check_monitor(str(monitor.id))
            monitor.refresh_from_db()
            return Response(
                {
                    'status': result['status'],
                    'provider_required': True,
                    'message': monitor.last_check_message,
                    'monitor': MonitorSerializer(monitor).data,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        check_monitor.delay(str(monitor.id))
        return Response({'status': 'queued', 'provider_required': False}, status=status.HTTP_202_ACCEPTED)
