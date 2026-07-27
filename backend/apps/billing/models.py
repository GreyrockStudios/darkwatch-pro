from django.db import models
from django.conf import settings


class Plan(models.Model):
    """Subscription plan definitions."""

    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    credits_per_month = models.PositiveIntegerField(default=0)
    features = models.JSONField(default=list)
    stripe_price_id = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'billing_plan'

    def __str__(self):
        return self.name


class Customer(models.Model):
    """Stripe customer linked to a user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='billing_customer',
    )
    stripe_customer_id = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'billing_customer'

    def __str__(self):
        return f"Customer: {self.user.email}"


class Subscription(models.Model):
    """User subscription to a plan."""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('trialing', 'Trialing'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_period_start = models.DateTimeField(auto_now_add=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, default='')
    cancel_at_period_end = models.BooleanField(default=False)

    class Meta:
        db_table = 'billing_subscription'

    def __str__(self):
        return f"{self.user.email} - {self.plan}"