from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import TeamInvite, TeamMember


def get_pending_invite_for_token(token):
    try:
        invite = TeamInvite.objects.select_related('team').get(token_hash=TeamInvite.hash_token(token))
    except TeamInvite.DoesNotExist:
        raise serializers.ValidationError({'invite_token': 'Invite token is invalid.'})

    if invite.status == TeamInvite.STATUS_PENDING and invite.is_expired:
        invite.mark_expired()

    if invite.status != TeamInvite.STATUS_PENDING:
        raise serializers.ValidationError({'invite_token': f'Invite is {invite.status}.'})

    return invite


@transaction.atomic
def accept_invite_for_user(token, user):
    invite = get_pending_invite_for_token(token)

    if user.email.lower() != invite.email.lower():
        raise serializers.ValidationError({'invite_token': 'Invite email does not match this user.'})

    member, _created = TeamMember.objects.update_or_create(
        team=invite.team,
        user=user,
        defaults={'role': invite.role, 'status': 'active'},
    )
    invite.status = TeamInvite.STATUS_ACCEPTED
    invite.accepted_by = user
    invite.accepted_at = timezone.now()
    invite.save(update_fields=['status', 'accepted_by', 'accepted_at', 'updated_at'])
    return invite, member
