from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone

from .models import User
from .serializers import UserSerializer, RegisterSerializer, ChangePasswordSerializer


class UserViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], url_path='me/update')
    def update_me(self, request):
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='register', permission_classes=[AllowAny])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed successfully'})

    @action(detail=False, methods=['post'], url_path='2fa/enable')
    def enable_2fa(self, request):
        """Report that 2FA is unavailable until a provider is wired."""
        return Response({
            'error': '2FA is not configured',
            'detail': 'Two-factor enrollment is unavailable until a 2FA provider is configured.',
        }, status=status.HTTP_501_NOT_IMPLEMENTED)

    @action(detail=False, methods=['get'], url_path='security-score')
    def security_score(self, request):
        from datetime import timedelta

        from apps.alerts.models import Alert
        from apps.monitoring.models import Monitor
        from apps.search.models import SearchResult

        now = timezone.now()
        monitors = Monitor.objects.filter(user=request.user)
        active_monitors = monitors.filter(status='active').count()
        unresolved_alerts = Alert.objects.filter(user=request.user).exclude(status='resolved')
        critical_alerts = unresolved_alerts.filter(severity='critical').count()
        high_alerts = unresolved_alerts.filter(severity='high').count()
        medium_alerts = unresolved_alerts.filter(severity='medium').count()
        stale_checks = monitors.filter(
            status='active',
            last_checked__lt=now - timedelta(days=7),
        ).count()
        never_checked = monitors.filter(status='active', last_checked__isnull=True).count()
        failed_checks = monitors.filter(status='active', last_check_status__in=['error', 'failed']).count()
        searches_30d = SearchResult.objects.filter(user=request.user, created_at__gte=now - timedelta(days=30)).count()

        score = 100
        reasons = []

        if active_monitors == 0:
            score -= 20
            reasons.append('No active monitors are configured.')
        if critical_alerts:
            penalty = min(30, critical_alerts * 15)
            score -= penalty
            reasons.append(f'{critical_alerts} critical unresolved alert(s).')
        if high_alerts:
            penalty = min(20, high_alerts * 8)
            score -= penalty
            reasons.append(f'{high_alerts} high unresolved alert(s).')
        if medium_alerts:
            penalty = min(12, medium_alerts * 3)
            score -= penalty
            reasons.append(f'{medium_alerts} medium unresolved alert(s).')
        if never_checked:
            penalty = min(15, never_checked * 3)
            score -= penalty
            reasons.append(f'{never_checked} active monitor(s) have not been checked yet.')
        if stale_checks:
            penalty = min(10, stale_checks * 2)
            score -= penalty
            reasons.append(f'{stale_checks} active monitor check(s) are stale.')
        if failed_checks:
            penalty = min(10, failed_checks * 5)
            score -= penalty
            reasons.append(f'{failed_checks} monitor check(s) failed.')
        if request.user.credits == 0:
            score -= 5
            reasons.append('Search credits are exhausted.')

        score = max(0, min(100, score))

        return Response({
            'score': score,
            'grade': 'A' if score >= 90 else 'B' if score >= 75 else 'C' if score >= 60 else 'D',
            'provider_required': True,
            'message': 'Score is based on local Darkwatch records only until threat intelligence providers are configured.',
            'reasons': reasons or ['No local risk signals found.'],
            'inputs': {
                'active_monitors': active_monitors,
                'unresolved_alerts': unresolved_alerts.count(),
                'critical_alerts': critical_alerts,
                'high_alerts': high_alerts,
                'medium_alerts': medium_alerts,
                'never_checked': never_checked,
                'stale_checks': stale_checks,
                'failed_checks': failed_checks,
                'searches_30d': searches_30d,
                'credits': request.user.credits,
            },
        })
