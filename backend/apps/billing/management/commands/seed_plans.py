"""Seed billing plans for DarkWatch Pro."""
from django.core.management.base import BaseCommand
from apps.billing.models import Plan


class Command(BaseCommand):
    help = 'Seed the database with billing plans (Starter, Professional, Enterprise)'

    def handle(self, *args, **options):
        plans = [
            {
                'name': 'Starter',
                'price': 29.00,
                'credits_per_month': 100,
                'stripe_price_id': os.environ.get('STRIPE_STARTER_PRICE_ID', ''),
                'description': 'Perfect for individuals and small teams starting with dark web monitoring.',
                'features': [
                    '100 credits per month',
                    '5 monitors',
                    'Email alerts',
                    'Basic reporting',
                    'Community support',
                ],
            },
            {
                'name': 'Professional',
                'price': 79.00,
                'credits_per_month': 500,
                'stripe_price_id': os.environ.get('STRIPE_PROFESSIONAL_PRICE_ID', ''),
                'description': 'For security professionals who need comprehensive monitoring.',
                'features': [
                    '500 credits per month',
                    '25 monitors',
                    'Email & SMS alerts',
                    'Advanced reporting',
                    'API access',
                    'Priority support',
                ],
            },
            {
                'name': 'Enterprise',
                'price': 199.00,
                'credits_per_month': 999999,  # Effectively unlimited
                'stripe_price_id': os.environ.get('STRIPE_ENTERPRISE_PRICE_ID', ''),
                'description': 'For organizations requiring unlimited monitoring and custom integrations.',
                'features': [
                    'Unlimited credits',
                    'Unlimited monitors',
                    'Email, SMS & webhook alerts',
                    'Custom reporting',
                    'Full API access',
                    'Dedicated support',
                    'Custom integrations',
                ],
            },
        ]

        created_count = 0
        for plan_data in plans:
            plan, created = Plan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data,
            )
            if created:
                created_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'{"Created" if created else "Updated"} plan: {plan.name} (${plan.price})')
            )

        self.stdout.write(self.style.SUCCESS(f'\nDone! {created_count} new plans created.'))

import os