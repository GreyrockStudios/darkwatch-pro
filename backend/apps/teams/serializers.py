from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Team, TeamInvite, TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'email', 'name', 'role', 'status', 'joined_at']
        read_only_fields = ['id', 'joined_at']

    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class TeamSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'owner', 'member_count', 'created_at']
        read_only_fields = ['id', 'owner', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()


class TeamInviteSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)
    accepted_by_email = serializers.EmailField(source='accepted_by.email', read_only=True)
    accept_url = serializers.SerializerMethodField()
    token = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = TeamInvite
        fields = [
            'id',
            'team',
            'team_name',
            'email',
            'role',
            'status',
            'invited_by_email',
            'accepted_by_email',
            'sent_at',
            'accepted_at',
            'canceled_at',
            'expires_at',
            'created_at',
            'accept_url',
            'token',
        ]
        read_only_fields = [
            'id',
            'team',
            'team_name',
            'status',
            'invited_by_email',
            'accepted_by_email',
            'sent_at',
            'accepted_at',
            'canceled_at',
            'expires_at',
            'created_at',
            'accept_url',
        ]

    def get_accept_url(self, obj):
        token = self.context.get('token')
        if not token:
            return None
        frontend_url = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
        return f'{frontend_url}/team/invites/accept?token={token}' if frontend_url else None


class TeamInviteCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=[choice for choice in TeamMember.ROLE_CHOICES if choice[0] != 'owner'], default='viewer')

    def validate_email(self, value):
        return get_user_model().objects.normalize_email(value).lower()

    def validate(self, attrs):
        team = self.context['team']
        request = self.context['request']
        email = attrs['email']

        if request.user.email.lower() == email:
            raise serializers.ValidationError({'email': 'You are already a member of this team.'})

        existing_user = get_user_model().objects.filter(email__iexact=email).first()
        if existing_user and TeamMember.objects.filter(team=team, user=existing_user, status='active').exists():
            raise serializers.ValidationError({'email': 'This user is already an active team member.'})

        if TeamInvite.objects.filter(team=team, email__iexact=email, status=TeamInvite.STATUS_PENDING).exists():
            raise serializers.ValidationError({'email': 'A pending invite already exists for this email.'})

        return attrs


class TeamInviteAcceptSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        token_hash = TeamInvite.hash_token(value)
        try:
            invite = TeamInvite.objects.select_related('team').get(token_hash=token_hash)
        except TeamInvite.DoesNotExist:
            raise serializers.ValidationError('Invite token is invalid.')

        if invite.status == TeamInvite.STATUS_PENDING and invite.is_expired:
            invite.mark_expired()

        if invite.status != TeamInvite.STATUS_PENDING:
            raise serializers.ValidationError(f'Invite is {invite.status}.')

        self.context['invite'] = invite
        return value


class TeamInvitePublicSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    expired = serializers.SerializerMethodField()

    class Meta:
        model = TeamInvite
        fields = ['email', 'team_name', 'role', 'status', 'expires_at', 'expired']

    def get_expired(self, obj):
        return obj.expires_at <= timezone.now()
