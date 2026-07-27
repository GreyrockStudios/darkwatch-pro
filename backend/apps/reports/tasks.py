import os
import logging
from datetime import timedelta
from django.utils import timezone

from celery import shared_task

from .models import Report

logger = logging.getLogger(__name__)


@shared_task(name='reports.generate_report', bind=True, max_retries=3)
def generate_report(self, report_id):
    """Generate a PDF report (stub for now — returns mock data)."""
    try:
        report = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        logger.warning(f'Report {report_id} not found')
        return {'status': 'not_found'}

    logger.info(f'Generating report: {report.title} (type: {report.type})')

    # Stub: In production, this would generate an actual PDF
    # using WeasyPrint, ReportLab, or a similar library
    report.status = 'ready'
    report.data = {
        'title': report.title,
        'type': report.type,
        'generated_at': timezone.now().isoformat(),
        'summary': f'Report generated for {report.type} analysis.',
        'findings': [],
        'recommendations': [],
    }
    report.save()

    logger.info(f'Report {report_id} generated successfully')
    return {'status': 'ready', 'report_id': str(report.id)}


@shared_task(name='reports.cleanup_old_reports')
def cleanup_old_reports():
    """Remove reports older than 90 days."""
    cutoff = timezone.now() - timedelta(days=90)
    old_reports = Report.objects.filter(created_at__lt=cutoff)
    count = old_reports.count()
    old_reports.delete()
    logger.info(f'Cleaned up {count} old reports')
    return {'deleted': count}