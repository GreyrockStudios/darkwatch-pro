import logging
from celery import shared_task
from django.utils import timezone

from .models import Monitor

logger = logging.getLogger(__name__)


@shared_task(name='monitoring.check_all_monitors')
def check_all_monitors():
    """Iterate all active monitors and check for new breaches."""
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
    """Check a single monitor for new breaches (stub for threat intel API integration)."""
    try:
        monitor = Monitor.objects.get(id=monitor_id)
    except Monitor.DoesNotExist:
        logger.warning(f'Monitor {monitor_id} not found')
        return {'status': 'not_found'}

    logger.info(f'Checking monitor: {monitor.name} ({monitor.type}: {monitor.value})')

    # Stub: In production, this would call threat intelligence APIs
    # (Dehashed, Have I Been Pwned, etc.) and create alerts for new breaches
    monitor.last_checked = timezone.now()
    monitor.save(update_fields=['last_checked'])

    # Return mock result for now
    return {
        'monitor_id': str(monitor.id),
        'name': monitor.name,
        'type': monitor.type,
        'value': monitor.value,
        'breaches_found': 0,
        'status': 'checked',
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