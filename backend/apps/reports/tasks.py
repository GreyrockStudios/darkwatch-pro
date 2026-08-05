import logging
from datetime import timedelta
from html import escape
from django.conf import settings
from django.db.models import Count
from django.utils import timezone

from celery import shared_task

from .models import Report

logger = logging.getLogger(__name__)


def local_report_generation_enabled():
    return getattr(settings, 'LOCAL_REPORT_GENERATION_ENABLED', True)


def _render_local_report(report):
    from apps.alerts.models import Alert
    from apps.monitoring.models import Monitor
    from apps.search.models import SearchResult

    monitor_summary = list(
        Monitor.objects.filter(user=report.user)
        .values('status')
        .annotate(count=Count('id'))
        .order_by('status')
    )
    alert_summary = list(
        Alert.objects.filter(user=report.user)
        .values('severity')
        .annotate(count=Count('id'))
        .order_by('severity')
    )
    recent_searches = list(
        SearchResult.objects.filter(user=report.user)
        .values('query', 'type', 'source', 'created_at')[:10]
    )

    generated_at = timezone.now()
    rows = []
    for item in recent_searches:
        rows.append(
            '<tr>'
            f'<td>{escape(item["query"])}</td>'
            f'<td>{escape(item["type"])}</td>'
            f'<td>{escape(item["source"])}</td>'
            f'<td>{item["created_at"].isoformat()}</td>'
            '</tr>'
        )

    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>{escape(report.title)}</title>
  <style>
    body {{ font-family: Arial, sans-serif; color: #121826; margin: 32px; }}
    h1 {{ margin-bottom: 4px; }}
    .muted {{ color: #667085; }}
    .section {{ margin-top: 28px; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ border-bottom: 1px solid #e4e7ec; padding: 8px; text-align: left; }}
  </style>
</head>
<body>
  <h1>{escape(report.title)}</h1>
  <p class="muted">Generated {generated_at.isoformat()} for {escape(report.user.email)}</p>
  <div class="section">
    <h2>Summary</h2>
    <p>This local report is generated from Darkwatch Pro database records. Third-party threat intelligence sections remain provider-required until API keys are configured.</p>
  </div>
  <div class="section">
    <h2>Monitor Status</h2>
    <pre>{escape(str(monitor_summary))}</pre>
  </div>
  <div class="section">
    <h2>Alert Severity</h2>
    <pre>{escape(str(alert_summary))}</pre>
  </div>
  <div class="section">
    <h2>Recent Searches</h2>
    <table><thead><tr><th>Query</th><th>Type</th><th>Source</th><th>Date</th></tr></thead><tbody>{''.join(rows) or '<tr><td colspan="4">No searches recorded.</td></tr>'}</tbody></table>
  </div>
</body>
</html>
"""
    report.status = 'ready'
    report.artifact_format = 'html'
    report.artifact_content = html
    report.generated_at = generated_at
    report.data = {
        **(report.data or {}),
        'generated_by': 'local',
        'provider_required': True,
        'provider_message': 'Live threat intelligence and PDF rendering are not configured in this environment.',
        'monitor_summary': monitor_summary,
        'alert_summary': alert_summary,
        'recent_search_count': len(recent_searches),
    }
    report.save(update_fields=['status', 'artifact_format', 'artifact_content', 'generated_at', 'data'])
    return report


@shared_task(name='reports.generate_report', bind=True, max_retries=3)
def generate_report(self, report_id):
    """Generate a report using local data when provider-backed PDF is unavailable."""
    try:
        report = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        logger.warning(f'Report {report_id} not found')
        return {'status': 'not_found'}

    if local_report_generation_enabled():
        _render_local_report(report)
        return {'status': 'ready', 'report_id': str(report.id), 'format': report.artifact_format}

    if not getattr(settings, 'REPORT_GENERATION_ENABLED', False):
        logger.warning(f'Report generation not configured for report {report_id}')
        error = 'Report generation is disabled and no local generator is enabled.'
    else:
        logger.error(f'Report generation backend is not implemented for report {report_id}')
        error = 'Report generation backend is not implemented.'

    report.status = 'failed'
    report.data = {
        **(report.data or {}),
        'error': error,
    }
    report.save(update_fields=['status', 'data'])

    return {'status': 'failed', 'report_id': str(report.id)}


@shared_task(name='reports.cleanup_old_reports')
def cleanup_old_reports():
    """Remove reports older than 90 days."""
    cutoff = timezone.now() - timedelta(days=90)
    old_reports = Report.objects.filter(created_at__lt=cutoff)
    count = old_reports.count()
    old_reports.delete()
    logger.info(f'Cleaned up {count} old reports')
    return {'deleted': count}
