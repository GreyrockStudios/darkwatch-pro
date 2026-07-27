from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Team, TeamMember
from .serializers import TeamSerializer, TeamMemberSerializer


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
            from django.contrib.auth import get_user_model
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
        email = request.data.get('email')
        role = request.data.get('role', 'viewer')
        # In production, this would send an invitation email
        return Response({'message': f'Invitation sent to {email}', 'team': team.name, 'role': role})


class TeamMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (TeamMember.objects.filter(user=self.request.user) | TeamMember.objects.filter(team__owner=self.request.user)).distinct()
