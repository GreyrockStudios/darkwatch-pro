import os
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

import stripe

from .models import Plan, Customer, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer

logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]


class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        subscription = Subscription.objects.filter(
            user=request.user, status__in=['active', 'trialing']
        ).first()
        if not subscription:
            return Response({'error': 'No active subscription'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def usage(self, request):
        from django.utils import timezone
        from datetime import timedelta

        subscription = Subscription.objects.filter(
            user=request.user, status='active'
        ).first()

        user = request.user
        plan_credits = subscription.plan.credits_per_month if subscription and subscription.plan else 100

        # Calculate real usage from database
        from apps.search.models import SearchResult
        from apps.monitoring.models import Monitor
        from apps.alerts.models import Alert

        period_start = subscription.current_period_start if subscription else (timezone.now() - timedelta(days=30))
        searches_this_period = SearchResult.objects.filter(user=user, created_at__gte=period_start).count()
        active_monitors = Monitor.objects.filter(user=user, status='active').count()
        new_alerts = Alert.objects.filter(user=user, created_at__gte=period_start).count()

        return Response({
            'email_searches': {'used': searches_this_period, 'limit': plan_credits},
            'domain_lookups': {'used': active_monitors, 'limit': 100},
            'active_monitors': {'used': active_monitors, 'limit': 50},
            'api_calls': {'used': searches_this_period * 4, 'limit': 10000},
        })

    @action(detail=False, methods=['post'])
    def create_checkout(self, request):
        """Create a Stripe Checkout Session for a plan."""
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'error': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

        if not plan.stripe_price_id:
            return Response({'error': 'Plan not configured for Stripe'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create Stripe customer
        customer, _ = Customer.objects.get_or_create(user=request.user)

        if not customer.stripe_customer_id:
            stripe_customer = stripe.Customer.create(
                email=request.user.email,
                name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email,
                metadata={'user_id': request.user.id},
            )
            customer.stripe_customer_id = stripe_customer.id
            customer.save()

        # Determine success/cancel URLs
        base_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        success_url = request.data.get('success_url', f'{base_url}/billing?session_id={{CHECKOUT_SESSION_ID}}')
        cancel_url = request.data.get('cancel_url', f'{base_url}/billing')

        try:
            checkout_session = stripe.checkout.Session.create(
                customer=customer.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': plan.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={'user_id': request.user.id, 'plan_id': plan.id},
            )
            return Response({'checkout_url': checkout_session.url, 'session_id': checkout_session.id})
        except stripe.error.StripeError as e:
            logger.error(f'Stripe checkout error: {e}')
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    payload = request.body
    sig_header = request.headers.get('STRIPE_SIGNATURE', '')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

    if not webhook_secret:
        logger.warning('Stripe webhook secret not configured')
        return Response({'error': 'Webhook not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    event_type = event.get('type', '')
    data = event.get('data', {}).get('object', {})

    if event_type == 'checkout.session.completed':
        _handle_checkout_completed(data)
    elif event_type == 'customer.subscription.updated':
        _handle_subscription_updated(data)
    elif event_type == 'customer.subscription.deleted':
        _handle_subscription_deleted(data)
    elif event_type == 'invoice.paid':
        _handle_invoice_paid(data)
    else:
        logger.info(f'Unhandled Stripe event: {event_type}')

    return Response({'received': True})


def _handle_checkout_completed(data):
    """Handle completed checkout session."""
    from apps.accounts.models import User

    user_id = data.get('metadata', {}).get('user_id')
    plan_id = data.get('metadata', {}).get('plan_id')
    stripe_subscription_id = data.get('subscription')
    stripe_customer_id = data.get('customer')

    if not user_id or not plan_id:
        logger.error('Missing metadata in checkout session')
        return

    try:
        user = User.objects.get(id=user_id)
        plan = Plan.objects.get(id=plan_id)

        # Update or create customer
        customer, _ = Customer.objects.get_or_create(user=user, defaults={'stripe_customer_id': stripe_customer_id or ''})
        if stripe_customer_id and not customer.stripe_customer_id:
            customer.stripe_customer_id = stripe_customer_id
            customer.save()

        # Create subscription
        Subscription.objects.update_or_create(
            user=user,
            defaults={
                'plan': plan,
                'status': 'active',
                'stripe_subscription_id': stripe_subscription_id or '',
            }
        )
        # Update user plan
        user.plan = plan.name.lower()
        user.credits = plan.credits_per_month
        user.save()

        logger.info(f'Checkout completed for user {user.email}, plan {plan.name}')
    except (User.DoesNotExist, Plan.DoesNotExist) as e:
        logger.error(f'Checkout completion error: {e}')


def _handle_subscription_updated(data):
    """Handle subscription update."""
    stripe_subscription_id = data.get('id')
    stripe_status = data.get('status')

    subscription = Subscription.objects.filter(stripe_subscription_id=stripe_subscription_id).first()
    if subscription:
        subscription.status = stripe_status
        subscription.save()
        logger.info(f'Subscription updated: {stripe_subscription_id} -> {stripe_status}')


def _handle_subscription_deleted(data):
    """Handle subscription deletion."""
    stripe_subscription_id = data.get('id')
    subscription = Subscription.objects.filter(stripe_subscription_id=stripe_subscription_id).first()
    if subscription:
        subscription.status = 'canceled'
        subscription.save()
        logger.info(f'Subscription canceled: {stripe_subscription_id}')


def _handle_invoice_paid(data):
    """Handle paid invoice — renew credits."""
    stripe_customer_id = data.get('customer')
    customer = Customer.objects.filter(stripe_customer_id=stripe_customer_id).first()
    if customer:
        subscription = Subscription.objects.filter(user=customer.user, status='active').first()
        if subscription and subscription.plan:
            customer.user.credits = subscription.plan.credits_per_month
            customer.user.save()
            logger.info(f'Credits renewed for {customer.user.email}')