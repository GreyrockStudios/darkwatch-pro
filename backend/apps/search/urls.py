from django.urls import path
from .views import SearchView, SearchHistoryView

urlpatterns = [
    path('', SearchView.as_view(), name='search'),
    path('history/', SearchHistoryView.as_view(), name='search-history'),
]