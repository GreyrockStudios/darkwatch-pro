import logging

from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)

LOCAL_EMAIL_BACKENDS = (
    'django.core.mail.backends.console.EmailBackend',
    'django.core.mail.backends.filebased.EmailBackend',
    'django.core.mail.backends.locmem.EmailBackend',
)


def email_provider_configured():
    backend = getattr(settings, 'EMAIL_BACKEND', '')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')

    if backend in LOCAL_EMAIL_BACKENDS:
        return bool(from_email)

    if not backend.endswith('.smtp.EmailBackend'):
        return bool(from_email)

    host = getattr(settings, 'EMAIL_HOST', '')
    if not host or host == 'localhost' or not from_email:
        return False

    if getattr(settings, 'TEAM_INVITE_REQUIRE_SMTP_AUTH', True):
        return bool(getattr(settings, 'EMAIL_HOST_USER', '') and getattr(settings, 'EMAIL_HOST_PASSWORD', ''))

    return True


def can_expose_invite_token():
    return getattr(settings, 'DEBUG', False) and getattr(settings, 'EMAIL_BACKEND', '') in LOCAL_EMAIL_BACKENDS


def build_accept_url(token):
    frontend_url = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    return f'{frontend_url}/team/invites/accept?token={token}' if frontend_url else ''


def send_team_invite_email(invite, token):
    if not email_provider_configured():
        return {
            'sent': False,
            'not_configured': True,
            'detail': 'Email provider is not configured for team invites.',
        }

    accept_url = build_accept_url(token)
    message = (
        f'{invite.invited_by.email if invite.invited_by else "A DarkWatch Pro admin"} invited you '
        f'to join {invite.team.name} as {invite.get_role_display()}.\n\n'
        f'Accept the invite: {accept_url}\n\n'
        f'This invite expires at {invite.expires_at.isoformat()}.'
    )
    email = EmailMessage(
        subject=f'Invitation to join {invite.team.name}',
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[invite.email],
    )
    try:
        sent = email.send(fail_silently=False)
    except Exception as exc:
        logger.warning('Team invite email delivery failed for invite %s: %s', invite.id, exc)
        return {
            'sent': False,
            'not_configured': False,
            'detail': 'Invitation email delivery failed.',
        }

    return {
        'sent': sent == 1,
        'not_configured': False,
        'detail': 'Invitation email sent.' if sent == 1 else 'Invitation email was not sent.',
    }
