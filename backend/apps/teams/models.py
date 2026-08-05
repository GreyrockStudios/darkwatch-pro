import hashlib
import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


class Team(models.Model):
    """Organization team."""

    name = models.CharField(max_length=255)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_teams')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teams_team'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    """Team membership with roles."""

    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('analyst', 'Analyst'),
        ('viewer', 'Viewer'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('invited', 'Invited'),
        ('suspended', 'Suspended'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teams_teammember'
        unique_together = ('team', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.get_role_display()} in {self.team.name}"


class TeamInvite(models.Model):
    """Email invitation to join a team."""

    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_CANCELED = 'canceled'
    STATUS_EXPIRED = 'expired'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_CANCELED, 'Canceled'),
        (STATUS_EXPIRED, 'Expired'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invites')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=TeamMember.ROLE_CHOICES, default='viewer')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_team_invites',
    )
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_team_invites',
    )
    message_id = models.CharField(max_length=255, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    canceled_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teams_teaminvite'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['team', 'email'],
                condition=models.Q(status='pending'),
                name='unique_pending_team_invite_email',
            ),
        ]

    def __str__(self):
        return f"{self.email} invited to {self.team.name}"

    @staticmethod
    def hash_token(token):
        return hashlib.sha256(token.encode('utf-8')).hexdigest()

    @classmethod
    def issue_token(cls):
        token = secrets.token_urlsafe(32)
        return token, cls.hash_token(token)

    @property
    def is_expired(self):
        return self.expires_at <= timezone.now()

    def mark_expired(self, save=True):
        self.status = self.STATUS_EXPIRED
        if save:
            self.save(update_fields=['status', 'updated_at'])
