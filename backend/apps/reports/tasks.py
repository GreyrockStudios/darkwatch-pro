import logging
from datetime import timedelta
from django.conf import settings
from django.utils import timezone

from celery import shared_task

from .models import Report

logger = logging.getLogger(__name__)


@shared_task(name='reports.generate_report', bind=True, max_retries=3)
def generate_report(self, report_id):
    """Generate a report only when a report backend is configured."""
    try:
        report = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        logger.warning(f'Report {report_id} not found')
        return {'status': 'not_found'}

    if not getattr(settings, 'REPORT_GENERATION_ENABLED', False):
        report.status = 'failed'
        report.data = {
            **(report.data or {}),
            'error': 'Report generation provider is not configured',
        }
        report.save(update_fields=['status', 'data'])
        logger.warning(f'Report generation not configured for report {report_id}')
        return {'status': 'not_configured', 'report_id': str(report.id)}

    logger.error(f'Report generation backend is not implemented for report {report_id}')
    report.status = 'failed'
    report.data = {
        **(report.data or {}),
        'error': 'Report generation backend is not implemented',
    }
    report.save(update_fields=['status', 'data'])

    return {'status': 'not_implemented', 'report_id': str(report.id)}


@shared_task(name='reports.cleanup_old_reports')
def cleanup_old_reports():
    """Remove reports older than 90 days."""
    cutoff = timezone.now() - timedelta(days=90)
    old_reports = Report.objects.filter(created_at__lt=cutoff)
    count = old_reports.count()
    old_reports.delete()
    logger.info(f'Cleaned up {count} old reports')
    return {'deleted': count}
