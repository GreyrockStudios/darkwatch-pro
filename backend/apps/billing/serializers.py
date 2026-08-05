from rest_framework import serializers
from .models import Plan, Customer, Subscription


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'name', 'price', 'credits_per_month', 'features', 'stripe_price_id', 'description']
        read_only_fields = ['id']


class CustomerSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'user', 'email', 'stripe_customer_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True, default=None)
    plan_price = serializers.CharField(source='plan.price', read_only=True, default=None)
    plan_credits = serializers.IntegerField(source='plan.credits_per_month', read_only=True, default=None)

    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'plan_name', 'plan_price', 'plan_credits', 'status', 'current_period_start', 'current_period_end', 'cancel_at_period_end']
        read_only_fields = fields
