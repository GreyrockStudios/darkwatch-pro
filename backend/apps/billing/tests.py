from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.billing.models import Plan


class BillingApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='billing@example.com',
            password='password123',
        )
        self.client.force_authenticate(self.user)
        self.plan = Plan.objects.create(
            name='Starter',
            price=29,
            credits_per_month=100,
            description='Starter plan',
        )

    def test_subscription_collection_is_read_only(self):
        response = self.client.post('/api/v1/billing/subscriptions/', {'plan': self.plan.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_checkout_requires_stripe_configuration(self):
        response = self.client.post(
            '/api/v1/billing/subscriptions/create-checkout/',
            {'plan_id': self.plan.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
