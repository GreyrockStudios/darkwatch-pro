from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer


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
        report.status = 'ready'
        report.save()
        return Response({'status': 'ready'})

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        if report.status != 'ready':
            return Response({'error': 'Report not ready'}, status=status.HTTP_400_BAD_REQUEST)
        # Return report data (in production, this would generate a PDF)
        return Response({
            'id': str(report.id),
            'title': report.title,
            'type': report.type,
            'data': report.data,
            'generated_at': report.created_at.isoformat(),
        })