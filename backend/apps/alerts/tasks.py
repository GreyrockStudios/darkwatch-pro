import logging
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

from .models import Alert

logger = logging.getLogger(__name__)


def email_provider_configured():
    backend = getattr(settings, 'EMAIL_BACKEND', '')
    host = getattr(settings, 'EMAIL_HOST', '')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
    if backend.endswith('.locmem.EmailBackend') or backend.endswith('.console.EmailBackend'):
        return False
    return bool(host and host != 'localhost' and from_email)


@shared_task(name='alerts.process_new_alerts')
def process_new_alerts():
    """Process unprocessed alerts and send notifications."""
    if not email_provider_configured():
        logger.warning('Alert notifications not configured; no notifications queued')
        return {'status': 'not_configured', 'queued': 0}

    new_alerts = Alert.objects.filter(status='new')
    queued = 0
    for alert in new_alerts.iterator():
        try:
            send_alert_notification.delay(str(alert.id))
            queued += 1
        except Exception as e:
            logger.error(f'Error processing alert {alert.id}: {e}')
    logger.info(f'Queued {queued} new alerts for notification')
    return {'queued': queued}


@shared_task(name='alerts.send_alert_notification', bind=True, max_retries=3)
def send_alert_notification(self, alert_id):
    """Send email notification for critical/high alerts."""
    try:
        alert = Alert.objects.get(id=alert_id)
    except Alert.DoesNotExist:
        logger.warning(f'Alert {alert_id} not found')
        return {'status': 'not_found'}

    # Only send notifications for critical and high severity alerts
    if alert.severity in ('critical', 'high'):
        if not email_provider_configured():
            logger.warning(f'Alert notification not configured for alert {alert.id}')
            return {'status': 'not_configured', 'alert_id': str(alert.id)}

        logger.info(f'Sending notification for {alert.severity} alert: {alert.title}')
        sent = send_mail(
            subject=f'[DarkWatch Pro] {alert.severity.upper()} Alert: {alert.title}',
            message=alert.description,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[alert.user.email],
            fail_silently=False,
        )
        if sent != 1:
            logger.error(f'Alert notification was not sent for alert {alert.id}')
            return {'status': 'send_failed', 'alert_id': str(alert.id)}
        return {'status': 'notification_sent', 'alert_id': str(alert.id)}

    return {'status': 'skipped', 'severity': alert.severity}
