from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


class AccountApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='account@example.com',
            password='password123',
        )
        self.client.force_authenticate(self.user)

    def test_2fa_enable_reports_not_configured(self):
        response = self.client.post('/api/v1/accounts/2fa/enable/')

        self.assertEqual(response.status_code, status.HTTP_501_NOT_IMPLEMENTED)
        self.assertIn('error', response.data)


class SecurityScoreApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='score@example.com',
            password='password123',
        )
        self.client.force_authenticate(self.user)

    def test_security_score_returns_local_score(self):
        response = self.client.get('/api/v1/accounts/security-score/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('score', response.data)
        self.assertTrue(response.data['provider_required'])
