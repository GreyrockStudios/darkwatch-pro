from django.conf import settings
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer
from .tasks import generate_report


def report_generation_configured():
    return bool(getattr(settings, 'REPORT_GENERATION_ENABLED', False) or getattr(settings, 'LOCAL_REPORT_GENERATION_ENABLED', True))


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        report = self.get_object()
        if not report_generation_configured():
            report.status = 'failed'
            report.data = {
                **(report.data or {}),
                'error': 'Report generation provider is not configured',
            }
            report.save(update_fields=['status', 'data'])
            return Response(
                {'error': 'Report generation is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if getattr(settings, 'LOCAL_REPORT_GENERATION_ENABLED', True):
            generate_report(str(report.id))
            report.refresh_from_db()
            return Response(ReportSerializer(report).data)

        generate_report.delay(str(report.id))
        return Response({'status': 'generating'}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        if report.status != 'ready':
            return Response({'error': 'Report not ready'}, status=status.HTTP_400_BAD_REQUEST)
        if not report.artifact_content:
            return Response(
                {'error': 'Report artifact is missing'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        filename = f'darkwatch-report-{report.id}.{report.artifact_format or "html"}'
        content_type = 'text/html' if report.artifact_format == 'html' else 'application/octet-stream'
        response = HttpResponse(report.artifact_content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
