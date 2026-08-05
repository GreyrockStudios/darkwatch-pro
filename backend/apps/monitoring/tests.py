from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.monitoring.domain_intel import DomainValidationError, analyze_domain, normalize_domain, suggest_typosquats
from apps.monitoring.models import Monitor


class MonitoringApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='monitoring@example.com',
            password='password123',
        )
        self.client.force_authenticate(self.user)

    def test_manual_check_records_provider_required_state_without_keys(self):
        monitor = Monitor.objects.create(
            user=self.user,
            name='Primary Email',
            type='email',
            value='monitoring@example.com',
        )

        response = self.client.post(f'/api/v1/monitors/{monitor.id}/check/')

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertTrue(response.data['provider_required'])

        monitor.refresh_from_db()
        self.assertIsNotNone(monitor.last_checked)
        self.assertEqual(monitor.last_check_status, 'provider_required')


class DomainIntelApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='domain@example.com',
            password='password123',
        )
        self.client.force_authenticate(self.user)

    @patch('apps.monitoring.views.analyze_domain')
    def test_domain_intelligence_endpoint_returns_local_analysis(self, analyze_domain_mock):
        analyze_domain_mock.return_value = {
            'domain': 'example.com',
            'status': 'warning',
            'live': True,
            'provider_required': False,
            'checks': {
                'dns': {'status': 'ok', 'provider_required': False},
                'reputation': {'status': 'skipped', 'provider_required': True},
            },
            'provider_required_checks': ['reputation'],
        }

        response = self.client.post(
            '/api/v1/monitors/domain-intelligence/',
            {'domain': 'https://Example.com/path'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['domain'], 'example.com')
        self.assertFalse(response.data['provider_required'])
        self.assertTrue(response.data['checks']['reputation']['provider_required'])
        analyze_domain_mock.assert_called_once_with('https://Example.com/path')

    @patch('apps.monitoring.views.analyze_domain')
    def test_domain_security_endpoint_accepts_query_param_alias(self, analyze_domain_mock):
        analyze_domain_mock.return_value = {
            'domain': 'example.com',
            'status': 'ok',
            'live': True,
            'provider_required': False,
            'checks': {},
            'provider_required_checks': [],
        }

        response = self.client.get('/api/v1/monitors/domain-security/?q=example.com')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        analyze_domain_mock.assert_called_once_with('example.com')

    def test_domain_endpoint_rejects_invalid_domain(self):
        response = self.client.post(
            '/api/v1/monitors/domain-security/',
            {'domain': 'not a domain'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class DomainIntelServiceTests(APITestCase):
    def test_normalize_domain_strips_url_path_and_lowercases(self):
        self.assertEqual(normalize_domain('https://Example.COM/some/path'), 'example.com')

    def test_normalize_domain_rejects_ip_addresses(self):
        with self.assertRaises(DomainValidationError):
            normalize_domain('192.0.2.10')

    def test_typosquat_suggestions_are_local_and_limited(self):
        result = suggest_typosquats('example.com')

        self.assertEqual(result['status'], 'informational')
        self.assertFalse(result['provider_required'])
        self.assertLessEqual(len(result['suggestions']), 12)
        self.assertIn('exmple.com', result['suggestions'])

    @patch('apps.monitoring.domain_intel.inspect_ssl_certificate')
    @patch('apps.monitoring.domain_intel.inspect_http_security_headers')
    @patch('apps.monitoring.domain_intel.query_dns')
    def test_analysis_marks_third_party_intel_as_provider_required(
        self,
        query_dns,
        inspect_http_security_headers,
        inspect_ssl_certificate,
    ):
        query_dns.side_effect = lambda domain, record_type: {
            ('example.com', 'A'): ['93.184.216.34'],
            ('example.com', 'AAAA'): [],
            ('example.com', 'MX'): ['10 mail.example.com'],
            ('example.com', 'TXT'): ['v=spf1 include:_spf.example.com -all'],
            ('_dmarc.example.com', 'TXT'): ['v=DMARC1; p=reject'],
        }.get((domain, record_type), [])
        inspect_http_security_headers.return_value = {'status': 'ok', 'provider_required': False}
        inspect_ssl_certificate.return_value = {'status': 'ok', 'provider_required': False}

        result = analyze_domain('example.com')

        self.assertEqual(result['status'], 'ok')
        self.assertFalse(result['checks']['dns']['provider_required'])
        self.assertTrue(result['checks']['reputation']['provider_required'])
        self.assertIn('reputation', result['provider_required_checks'])
        self.assertTrue(result['checks']['email_authentication']['spf']['present'])
        self.assertTrue(result['checks']['email_authentication']['dmarc']['present'])
