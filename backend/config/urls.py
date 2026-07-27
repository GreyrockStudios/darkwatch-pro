"""
URL Configuration for DarkWatch Pro API.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App endpoints
    path('api/v1/monitors/', include('apps.monitoring.urls')),
    path('api/v1/search/', include('apps.search.urls')),
    path('api/v1/alerts/', include('apps.alerts.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/teams/', include('apps.teams.urls')),
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/support/', include('apps.support.urls')),
]