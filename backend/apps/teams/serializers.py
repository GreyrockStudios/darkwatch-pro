from rest_framework import serializers
from .models import Team, TeamMember


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