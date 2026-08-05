from django.contrib import admin
from .models import Team, TeamInvite, TeamMember


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at']
    search_fields = ['name', 'owner__email']
    inlines = [TeamMemberInline]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['team', 'user', 'role', 'status', 'joined_at']
    list_filter = ['role', 'status']
    search_fields = ['team__name', 'user__email']


@admin.register(TeamInvite)
class TeamInviteAdmin(admin.ModelAdmin):
    list_display = ['team', 'email', 'role', 'status', 'expires_at', 'sent_at', 'accepted_at']
    list_filter = ['role', 'status']
    search_fields = ['team__name', 'email', 'invited_by__email', 'accepted_by__email']
    readonly_fields = ['token_hash', 'created_at', 'updated_at']
