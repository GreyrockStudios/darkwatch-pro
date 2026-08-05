from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamInviteViewSet, TeamMemberViewSet, TeamViewSet

router = DefaultRouter()
router.register(r'members', TeamMemberViewSet, basename='team-member')
router.register(r'invites', TeamInviteViewSet, basename='team-invite')
router.register(r'', TeamViewSet, basename='team')

urlpatterns = [
    path('', include(router.urls)),
]
