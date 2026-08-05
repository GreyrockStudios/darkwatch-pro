from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.search.models import SearchResult


class SearchApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='search@example.com',
            password='password123',
            credits=2,
        )
        self.client.force_authenticate(self.user)

    def test_search_spends_credit_and_records_provider_state(self):
        response = self.client.post('/api/v1/search/', {'query': 'test@example.com', 'type': 'email'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['balance'], 1)
        self.assertFalse(response.data['live'])
        self.assertEqual(SearchResult.objects.filter(user=self.user, query='test@example.com').count(), 1)

        self.user.refresh_from_db()
        self.assertEqual(self.user.credits, 1)

    def test_search_returns_payment_required_when_no_credits_remain(self):
        self.user.credits = 0
        self.user.save(update_fields=['credits'])

        response = self.client.post('/api/v1/search/', {'query': 'test@example.com', 'type': 'email'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_402_PAYMENT_REQUIRED)
        self.assertEqual(SearchResult.objects.filter(user=self.user).count(), 0)
