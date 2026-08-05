from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings

from .email import can_expose_invite_token, send_team_invite_email
from .models import Team, TeamInvite, TeamMember
from .serializers import (
    TeamInviteAcceptSerializer,
    TeamInviteCreateSerializer,
    TeamInvitePublicSerializer,
    TeamInviteSerializer,
    TeamMemberSerializer,
    TeamSerializer,
)
from .services import accept_invite_for_user


class IsTeamOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Team):
            return obj.owner == request.user or obj.members.filter(user=request.user, role__in=['owner', 'admin']).exists()
        return obj.team.owner == request.user or obj.team.members.filter(user=request.user, role__in=['owner', 'admin']).exists()


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (Team.objects.filter(owner=self.request.user) | Team.objects.filter(members__user=self.request.user)).distinct()

    def perform_create(self, serializer):
        team = serializer.save(owner=self.request.user)
        TeamMember.objects.create(team=team, user=self.request.user, role='owner')

    def _can_manage_team(self, team):
        return (
            team.owner == self.request.user
            or team.members.filter(user=self.request.user, role__in=['owner', 'admin'], status='active').exists()
        )

    @action(detail=True, methods=['get', 'post'])
    def members(self, request, pk=None):
        team = self.get_object()
        if request.method == 'GET':
            members = team.members.all()
            serializer = TeamMemberSerializer(members, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            email = request.data.get('email')
            role = request.data.get('role', 'viewer')
            User = get_user_model()
            try:
                user = User.objects.get(email=email)
                member, created = TeamMember.objects.get_or_create(team=team, user=user, defaults={'role': role, 'status': 'invited'})
                serializer = TeamMemberSerializer(member)
                return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        team = self.get_object()
        if not self._can_manage_team(team):
            return Response({'detail': 'You do not have permission to invite team members.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TeamInviteCreateSerializer(data=request.data, context={'request': request, 'team': team})
        serializer.is_valid(raise_exception=True)

        token, token_hash = TeamInvite.issue_token()
        expires_at = timezone.now() + settings.TEAM_INVITE_EXPIRY
        invite = TeamInvite.objects.create(
            team=team,
            email=serializer.validated_data['email'],
            role=serializer.validated_data['role'],
            token_hash=token_hash,
            invited_by=request.user,
            expires_at=expires_at,
        )

        delivery = send_team_invite_email(invite, token)
        if delivery['sent']:
            invite.sent_at = timezone.now()
            invite.save(update_fields=['sent_at', 'updated_at'])

        response_serializer = TeamInviteSerializer(invite, context={'token': token if can_expose_invite_token() else None})
        data = response_serializer.data
        data['delivery'] = delivery
        if can_expose_invite_token():
            data['token'] = token
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def invites(self, request, pk=None):
        team = self.get_object()
        if not self._can_manage_team(team):
            return Response({'detail': 'You do not have permission to list team invites.'}, status=status.HTTP_403_FORBIDDEN)

        invites = team.invites.select_related('team', 'invited_by', 'accepted_by')
        serializer = TeamInviteSerializer(invites, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='invites/(?P<invite_id>[^/.]+)/resend')
    def resend_invite(self, request, pk=None, invite_id=None):
        team = self.get_object()
        if not self._can_manage_team(team):
            return Response({'detail': 'You do not have permission to resend team invites.'}, status=status.HTTP_403_FORBIDDEN)

        invite = team.invites.filter(pk=invite_id).first()
        if not invite:
            return Response({'detail': 'Invite not found.'}, status=status.HTTP_404_NOT_FOUND)
        if invite.status != TeamInvite.STATUS_PENDING:
            return Response({'detail': f'Invite is {invite.status} and cannot be resent.'}, status=status.HTTP_400_BAD_REQUEST)

        token, token_hash = TeamInvite.issue_token()
        invite.token_hash = token_hash
        invite.expires_at = timezone.now() + settings.TEAM_INVITE_EXPIRY
        invite.save(update_fields=['token_hash', 'expires_at', 'updated_at'])

        delivery = send_team_invite_email(invite, token)
        if delivery['sent']:
            invite.sent_at = timezone.now()
            invite.save(update_fields=['sent_at', 'updated_at'])

        serializer = TeamInviteSerializer(invite, context={'token': token if can_expose_invite_token() else None})
        data = serializer.data
        data['delivery'] = delivery
        if can_expose_invite_token():
            data['token'] = token
        return Response(data)

    @action(detail=True, methods=['post'], url_path='invites/(?P<invite_id>[^/.]+)/cancel')
    def cancel_invite(self, request, pk=None, invite_id=None):
        team = self.get_object()
        if not self._can_manage_team(team):
            return Response({'detail': 'You do not have permission to cancel team invites.'}, status=status.HTTP_403_FORBIDDEN)

        invite = team.invites.filter(pk=invite_id).first()
        if not invite:
            return Response({'detail': 'Invite not found.'}, status=status.HTTP_404_NOT_FOUND)
        if invite.status != TeamInvite.STATUS_PENDING:
            return Response({'detail': f'Invite is {invite.status} and cannot be canceled.'}, status=status.HTTP_400_BAD_REQUEST)

        invite.status = TeamInvite.STATUS_CANCELED
        invite.canceled_at = timezone.now()
        invite.save(update_fields=['status', 'canceled_at', 'updated_at'])
        return Response(TeamInviteSerializer(invite).data)


class TeamMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (TeamMember.objects.filter(user=self.request.user) | TeamMember.objects.filter(team__owner=self.request.user)).distinct()


class TeamInviteViewSet(viewsets.GenericViewSet):
    queryset = TeamInvite.objects.select_related('team', 'invited_by', 'accepted_by')
    serializer_class = TeamInviteSerializer

    def get_permissions(self):
        if self.action == 'validate':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='validate')
    def validate(self, request):
        serializer = TeamInviteAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite = serializer.context['invite']
        return Response(TeamInvitePublicSerializer(invite).data)

    @action(detail=False, methods=['post'], url_path='accept')
    @transaction.atomic
    def accept(self, request):
        serializer = TeamInviteAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite = serializer.context['invite']

        if request.user.email.lower() != invite.email.lower():
            return Response({'detail': 'Invite email does not match the authenticated user.'}, status=status.HTTP_403_FORBIDDEN)

        invite, member = accept_invite_for_user(request.data['token'], request.user)

        return Response({
            'invite': TeamInviteSerializer(invite).data,
            'member': TeamMemberSerializer(member).data,
        })
