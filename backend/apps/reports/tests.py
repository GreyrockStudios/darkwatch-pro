from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.reports.models import Report


class ReportApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='reports@example.com',
            password='password123',
        )
        self.client.force_authenticate(self.user)

    def test_report_generates_local_artifact_and_downloads(self):
        report = Report.objects.create(
            user=self.user,
            type='executive',
            title='Executive Summary',
            data={},
        )

        response = self.client.post(f'/api/v1/reports/{report.id}/generate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ready')
        self.assertEqual(response.data['artifact_format'], 'html')

        report.refresh_from_db()
        self.assertIn('Executive Summary', report.artifact_content)

        download = self.client.get(f'/api/v1/reports/{report.id}/download/')
        self.assertEqual(download.status_code, status.HTTP_200_OK)
        self.assertEqual(download['Content-Type'], 'text/html')
