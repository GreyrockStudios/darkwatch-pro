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
