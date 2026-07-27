import logging
from celery import shared_task

from .models import Alert

logger = logging.getLogger(__name__)


@shared_task(name='alerts.process_new_alerts')
def process_new_alerts():
    """Process unprocessed alerts and send notifications."""
    new_alerts = Alert.objects.filter(status='new')
    count = 0
    for alert in new_alerts.iterator():
        try:
            send_alert_notification.delay(str(alert.id))
            count += 1
        except Exception as e:
            logger.error(f'Error processing alert {alert.id}: {e}')
    logger.info(f'Processed {count} new alerts')
    return {'processed': count}


@shared_task(name='alerts.send_alert_notification', bind=True, max_retries=3)
def send_alert_notification(self, alert_id):
    """Send email notification for critical/high alerts (stub)."""
    try:
        alert = Alert.objects.get(id=alert_id)
    except Alert.DoesNotExist:
        logger.warning(f'Alert {alert_id} not found')
        return {'status': 'not_found'}

    # Only send notifications for critical and high severity alerts
    if alert.severity in ('critical', 'high'):
        logger.info(f'Sending notification for {alert.severity} alert: {alert.title}')
        # Stub: In production, send email via Django's email backend
        # from django.core.mail import send_mail
        # send_mail(
        #     subject=f'[DarkWatch Pro] {alert.severity.upper()} Alert: {alert.title}',
        #     message=alert.description,
        #     from_email='alerts@darkwatchpro.com',
        #     recipient_list=[alert.user.email],
        # )
        return {'status': 'notification_sent', 'alert_id': str(alert.id)}

    return {'status': 'skipped', 'severity': alert.severity}