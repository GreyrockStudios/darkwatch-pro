import logging
import os
from celery import shared_task

from .models import Monitor

logger = logging.getLogger(__name__)


def threat_intel_provider_configured():
    provider_keys = [
        'HIBP_API_KEY',
        'DEHASHED_API_KEY',
        'INTELX_API_KEY',
        'THREAT_INTEL_API_KEY',
    ]
    return any(os.environ.get(key) for key in provider_keys)


@shared_task(name='monitoring.check_all_monitors')
def check_all_monitors():
    """Iterate all active monitors and check for new breaches."""
    if not threat_intel_provider_configured():
        logger.warning('Threat intelligence provider not configured; no monitors queued')
        return {'status': 'not_configured', 'queued': 0}

    active_monitors = Monitor.objects.filter(status='active')
    count = 0
    for monitor in active_monitors.iterator():
        try:
            check_monitor.delay(str(monitor.id))
            count += 1
        except Exception as e:
            logger.error(f'Error queuing monitor {monitor.id}: {e}')
    logger.info(f'Queued {count} monitors for checking')
    return {'queued': count}


@shared_task(name='monitoring.check_monitor', bind=True, max_retries=3)
def check_monitor(self, monitor_id):
    """Check a single monitor for new breaches."""
    try:
        monitor = Monitor.objects.get(id=monitor_id)
    except Monitor.DoesNotExist:
        logger.warning(f'Monitor {monitor_id} not found')
        return {'status': 'not_found'}

    if not threat_intel_provider_configured():
        logger.warning(f'Threat intelligence provider not configured for monitor {monitor_id}')
        return {
            'monitor_id': str(monitor.id),
            'status': 'not_configured',
        }

    logger.error(f'Threat intelligence check backend is not implemented for monitor {monitor_id}')
    return {
        'monitor_id': str(monitor.id),
        'status': 'not_implemented',
    }


@shared_task(name='monitoring.send_monitor_alert')
def send_monitor_alert(monitor_id, alert_data):
    """Create an Alert record when a breach is found by a monitor."""
    from apps.alerts.models import Alert

    try:
        monitor = Monitor.objects.get(id=monitor_id)
    except Monitor.DoesNotExist:
        logger.warning(f'Monitor {monitor_id} not found for alert')
        return {'status': 'not_found'}

    alert = Alert.objects.create(
        user=monitor.user,
        monitor=monitor,
        severity=alert_data.get('severity', 'medium'),
        title=alert_data.get('title', f'Breach detected for {monitor.value}'),
        description=alert_data.get('description', ''),
        source=alert_data.get('source', 'monitor'),
        status='new',
    )

    monitor.breach_count += 1
    monitor.save(update_fields=['breach_count'])

    logger.info(f'Alert created: {alert.id} for monitor {monitor.name}')
    return {'alert_id': str(alert.id), 'status': 'created'}
