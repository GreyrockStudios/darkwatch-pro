"""Seed demo data for DarkWatch Pro development."""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from apps.accounts.models import User
from apps.billing.models import Plan, Subscription, Customer
from apps.monitoring.models import Monitor
from apps.alerts.models import Alert
from apps.search.models import SearchResult
from apps.teams.models import Team, TeamMember
from apps.reports.models import Report
from apps.support.models import Ticket, TicketMessage


class Command(BaseCommand):
    help = 'Seed the database with demo user and sample data'

    def handle(self, *args, **options):
        # Create demo user
        demo_user, created = User.objects.get_or_create(
            email='demo@darkwatchpro.com',
            defaults={
                'first_name': 'Demo',
                'last_name': 'User',
                'company': 'DarkWatch Demo Corp',
                'plan': 'advanced',
                'credits': 500,
                'is_active': True,
            }
        )
        if created:
            demo_user.set_password('demo123')
            demo_user.save()
            self.stdout.write(self.style.SUCCESS('Created demo user: demo@darkwatchpro.com / demo123'))
        else:
            self.stdout.write(self.style.WARNING('Demo user already exists'))

        # Create monitors
        monitors_data = [
            {'name': 'Company Email Monitor', 'type': 'email', 'value': 'admin@company.com', 'status': 'active', 'breach_count': 3},
            {'name': 'Domain Monitor', 'type': 'domain', 'value': 'company.com', 'status': 'active', 'breach_count': 1},
            {'name': 'CEO Username', 'type': 'username', 'value': 'ceo_john', 'status': 'active', 'breach_count': 0},
            {'name': 'IT Admin Email', 'type': 'email', 'value': 'it@company.com', 'status': 'paused', 'breach_count': 2},
            {'name': 'VPN IP Address', 'type': 'ip', 'value': '203.0.113.42', 'status': 'active', 'breach_count': 0},
        ]

        for md in monitors_data:
            monitor, created = Monitor.objects.get_or_create(
                user=demo_user,
                name=md['name'],
                defaults={
                    'type': md['type'],
                    'value': md['value'],
                    'status': md['status'],
                    'breach_count': md['breach_count'],
                    'last_checked': timezone.now() - timedelta(minutes=random.randint(5, 120)),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created monitor: {monitor.name}'))

        # Create alerts
        alerts_data = [
            {'severity': 'critical', 'title': 'Credential Breach Detected', 'description': 'admin@company.com credentials found in new data breach exposing 2M records.', 'source': 'dehashed', 'status': 'new'},
            {'severity': 'high', 'title': 'Domain Listed in Darknet', 'description': 'company.com found in darknet marketplace listing for $500.', 'source': 'internal', 'status': 'acknowledged'},
            {'severity': 'medium', 'title': 'Email Appeared in Paste', 'description': 'it@company.com found in a public paste site with leaked credentials.', 'source': 'hibp', 'status': 'investigating'},
            {'severity': 'critical', 'title': 'Database Leak Exposure', 'description': 'Employee emails found in stolen database from third-party vendor.', 'source': 'dehashed', 'status': 'new'},
            {'severity': 'low', 'title': 'Minor Credential Exposure', 'description': 'Old password hash for user found in historical breach.', 'source': 'hibp', 'status': 'resolved'},
            {'severity': 'high', 'title': 'Phishing Domain Detected', 'description': 'comp4ny.com registered — potential typosquat of company.com.', 'source': 'internal', 'status': 'new'},
            {'severity': 'medium', 'title': 'API Key Compromise', 'description': 'Internal API key found in public GitHub repository.', 'source': 'dehashed', 'status': 'acknowledged'},
            {'severity': 'critical', 'title': 'Ransomware Group Targeting', 'description': 'Company listed as target on LockBit affiliate site.', 'source': 'internal', 'status': 'new'},
            {'severity': 'low', 'title': 'Spam List Inclusion', 'description': 'Company email domain found in spam marketing list.', 'source': 'hibp', 'status': 'resolved'},
            {'severity': 'high', 'title': 'SSH Key Exposure', 'description': 'Developer SSH private key found in public code repository.', 'source': 'dehashed', 'status': 'investigating'},
        ]

        monitors = list(Monitor.objects.filter(user=demo_user))
        for i, ad in enumerate(alerts_data):
            alert, created = Alert.objects.get_or_create(
                user=demo_user,
                title=ad['title'],
                defaults={
                    'severity': ad['severity'],
                    'description': ad['description'],
                    'source': ad['source'],
                    'status': ad['status'],
                    'monitor': monitors[i % len(monitors)] if monitors else None,
                    'created_at': timezone.now() - timedelta(hours=random.randint(1, 72)),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created alert: {alert.title[:50]}...'))

        # Create search results
        searches = [
            {'query': 'admin@company.com', 'type': 'email', 'data': {'results': 23, 'breaches': ['Collection #1', 'Verifications.io']}},
            {'query': 'company.com', 'type': 'domain', 'data': {'results': 15, 'breaches': ['Cit0day']}},
            {'query': 'ceo_john', 'type': 'username', 'data': {'results': 8, 'breaches': ['MyFitnessPal']}},
        ]

        for sd in searches:
            if SearchResult.objects.filter(user=demo_user, query=sd['query']).count() == 0:
                sr = SearchResult.objects.create(
                    user=demo_user,
                    query=sd['query'],
                    type=sd['type'],
                    source='dehashed',
                    data=sd['data'],
                )
                self.stdout.write(self.style.SUCCESS(f'  Created search result: {sr.query}'))
            else:
                self.stdout.write(self.style.WARNING(f'  Search result already exists: {sd["query"]}'))

        # Create team
        team, created = Team.objects.get_or_create(
            name='Security Team',
            defaults={'owner': demo_user}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  Created team: {team.name}'))

        # Add team members
        members_data = [
            {'email': 'demo@darkwatchpro.com', 'role': 'owner'},
            {'email': 'jane@darkwatchpro.com', 'role': 'admin'},
            {'email': 'bob@darkwatchpro.com', 'role': 'analyst'},
        ]

        for md in members_data:
            try:
                user = User.objects.get(email=md['email'])
            except User.DoesNotExist:
                user = User(
                    email=md['email'],
                    first_name=md['email'].split('@')[0].capitalize(),
                    plan='basic',
                    is_active=True,
                )
                user.set_password('demo123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  Created team member user: {md["email"]}'))

            member, created = TeamMember.objects.get_or_create(
                team=team,
                user=user,
                defaults={'role': md['role'], 'status': 'active'}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Added {user.email} as {md["role"]}'))

        # Create subscription on Professional plan
        professional_plan = Plan.objects.filter(name='Professional').first()
        if professional_plan:
            sub, created = Subscription.objects.get_or_create(
                user=demo_user,
                defaults={
                    'plan': professional_plan,
                    'status': 'active',
                    'current_period_end': timezone.now() + timedelta(days=30),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created subscription: {professional_plan.name}'))

        # Create reports
        reports_data = [
            {'type': 'breach', 'title': 'Monthly Breach Summary - July 2026', 'data': {'total_breaches': 3, 'critical_alerts': 2, 'affected_monitors': 4}, 'status': 'ready'},
            {'type': 'executive', 'title': 'Executive Security Report Q2 2026', 'data': {'summary': 'Security posture improved 15% over last quarter', 'risk_level': 'Medium'}, 'status': 'ready'},
            {'type': 'compliance', 'title': 'SOC 2 Compliance Report', 'data': {'controls_passed': 42, 'controls_failed': 0, 'compliance_pct': 100}, 'status': 'ready'},
            {'type': 'domain', 'title': 'Domain Security Analysis - company.com', 'data': {'dns_score': 85, 'ssl_status': 'Valid', 'threats_found': 2}, 'status': 'ready'},
            {'type': 'monitoring', 'title': 'Weekly Monitoring Report', 'data': {'monitors_active': 4, 'alerts_generated': 12, 'uptime_pct': 99.8}, 'status': 'ready'},
        ]

        for rd in reports_data:
            report, created = Report.objects.get_or_create(
                user=demo_user,
                title=rd['title'],
                defaults={
                    'type': rd['type'],
                    'data': rd['data'],
                    'status': rd['status'],
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created report: {report.title[:60]}'))

        # Create support tickets
        tickets_data = [
            {'subject': 'Unable to access breach report', 'description': 'When I try to download the breach analysis report, I get a 404 error. This has been happening since yesterday.', 'priority': 'high', 'status': 'open'},
            {'subject': 'Question about API rate limits', 'description': 'What are the rate limits for the Professional plan? I need to integrate with our internal monitoring system.', 'priority': 'medium', 'status': 'in_progress'},
            {'subject': 'Monitor not sending alerts', 'description': 'My domain monitor for company.com has not sent any alerts in the past week despite known breaches.', 'priority': 'critical', 'status': 'open'},
        ]

        for td in tickets_data:
            ticket, created = Ticket.objects.get_or_create(
                user=demo_user,
                subject=td['subject'],
                defaults={
                    'description': td['description'],
                    'priority': td['priority'],
                    'status': td['status'],
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created ticket: {ticket.subject[:60]}'))

        self.stdout.write(self.style.SUCCESS('\n✓ Demo data seeding complete!'))