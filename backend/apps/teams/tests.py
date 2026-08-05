from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.teams.models import Team, TeamInvite, TeamMember


class TeamInviteApiTests(APITestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(
            email='owner@example.com',
            password='password123',
        )
        self.team = Team.objects.create(name='Security', owner=self.owner)
        TeamMember.objects.create(team=self.team, user=self.owner, role='owner', status='active')
        self.client.force_authenticate(self.owner)

    @override_settings(
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
        DEFAULT_FROM_EMAIL='alerts@example.com',
        FRONTEND_URL='http://localhost:3000',
        DEBUG=True,
    )
    def test_invite_creates_record_sends_local_email_and_exposes_dev_token(self):
        response = self.client.post(
            f'/api/v1/teams/{self.team.id}/invite/',
            {'email': 'Analyst@Example.com', 'role': 'analyst'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'analyst@example.com')
        self.assertEqual(response.data['status'], TeamInvite.STATUS_PENDING)
        self.assertTrue(response.data['delivery']['sent'])
        self.assertFalse(response.data['delivery']['not_configured'])
        self.assertIn('token', response.data)
        self.assertIn(response.data['token'], response.data['accept_url'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(response.data['token'], mail.outbox[0].body)

        invite = TeamInvite.objects.get(email='analyst@example.com')
        self.assertNotEqual(invite.token_hash, response.data['token'])
        self.assertIsNotNone(invite.sent_at)

    @override_settings(
        EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
        EMAIL_HOST='',
        EMAIL_HOST_USER='',
        EMAIL_HOST_PASSWORD='',
        DEFAULT_FROM_EMAIL='alerts@example.com',
        TEAM_INVITE_REQUIRE_SMTP_AUTH=True,
        DEBUG=False,
    )
    def test_invite_persists_with_not_configured_delivery_when_smtp_missing(self):
        response = self.client.post(
            f'/api/v1/teams/{self.team.id}/invite/',
            {'email': 'viewer@example.com', 'role': 'viewer'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['delivery']['not_configured'])
        self.assertFalse(response.data['delivery']['sent'])
        self.assertNotIn('token', response.data)
        invite = TeamInvite.objects.get(email='viewer@example.com')
        self.assertIsNone(invite.sent_at)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', DEFAULT_FROM_EMAIL='alerts@example.com', DEBUG=True)
    def test_invite_validate_and_authenticated_accept_create_active_member(self):
        invite_response = self.client.post(
            f'/api/v1/teams/{self.team.id}/invite/',
            {'email': 'new-user@example.com', 'role': 'admin'},
            format='json',
        )
        token = invite_response.data['token']

        self.client.force_authenticate(None)
        validate_response = self.client.post('/api/v1/teams/invites/validate/', {'token': token}, format='json')
        self.assertEqual(validate_response.status_code, status.HTTP_200_OK)
        self.assertEqual(validate_response.data['email'], 'new-user@example.com')
        self.assertEqual(validate_response.data['team_name'], self.team.name)

        invited_user = get_user_model().objects.create_user(email='new-user@example.com', password='password123')
        self.client.force_authenticate(invited_user)
        accept_response = self.client.post('/api/v1/teams/invites/accept/', {'token': token}, format='json')

        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_response.data['member']['role'], 'admin')
        invite = TeamInvite.objects.get(email='new-user@example.com')
        self.assertEqual(invite.status, TeamInvite.STATUS_ACCEPTED)
        self.assertEqual(invite.accepted_by, invited_user)
        self.assertTrue(TeamMember.objects.filter(team=self.team, user=invited_user, status='active').exists())

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', DEFAULT_FROM_EMAIL='alerts@example.com', DEBUG=True)
    def test_resend_rotates_token_and_cancel_blocks_accept(self):
        invite_response = self.client.post(
            f'/api/v1/teams/{self.team.id}/invite/',
            {'email': 'rotate@example.com', 'role': 'viewer'},
            format='json',
        )
        invite_id = invite_response.data['id']
        first_token = invite_response.data['token']

        resend_response = self.client.post(f'/api/v1/teams/{self.team.id}/invites/{invite_id}/resend/')
        self.assertEqual(resend_response.status_code, status.HTTP_200_OK)
        second_token = resend_response.data['token']
        self.assertNotEqual(first_token, second_token)

        self.client.force_authenticate(None)
        old_token_response = self.client.post('/api/v1/teams/invites/validate/', {'token': first_token}, format='json')
        self.assertEqual(old_token_response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.owner)
        cancel_response = self.client.post(f'/api/v1/teams/{self.team.id}/invites/{invite_id}/cancel/')
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_response.data['status'], TeamInvite.STATUS_CANCELED)

        invited_user = get_user_model().objects.create_user(email='rotate@example.com', password='password123')
        self.client.force_authenticate(invited_user)
        accept_response = self.client.post('/api/v1/teams/invites/accept/', {'token': second_token}, format='json')
        self.assertEqual(accept_response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', DEFAULT_FROM_EMAIL='alerts@example.com', DEBUG=True)
    def test_registration_with_invite_token_accepts_membership(self):
        invite_response = self.client.post(
            f'/api/v1/teams/{self.team.id}/invite/',
            {'email': 'signup@example.com', 'role': 'analyst'},
            format='json',
        )
        token = invite_response.data['token']

        self.client.force_authenticate(None)
        register_response = self.client.post(
            '/api/v1/accounts/register/',
            {
                'email': 'signup@example.com',
                'password': 'password123',
                'password_confirm': 'password123',
                'invite_token': token,
            },
            format='json',
        )

        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email='signup@example.com')
        self.assertTrue(TeamMember.objects.filter(team=self.team, user=user, role='analyst', status='active').exists())
        self.assertEqual(TeamInvite.objects.get(email='signup@example.com').status, TeamInvite.STATUS_ACCEPTED)
