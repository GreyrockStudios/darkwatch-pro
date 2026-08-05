import { expect, type Page, test } from '@playwright/test';

const testUser = {
  id: 'e2e-user',
  email: 'e2e@darkwatchpro.test',
  first_name: 'E2E',
  last_name: 'User',
  company: 'DarkWatch QA',
  plan: 'Professional',
  credits: 500,
};

async function mockBackend(page: Page) {
  await page.route('**/api/v1/accounts/me/', async (route) => {
    await route.fulfill({ json: testUser });
  });
  await page.route('**/api/v1/accounts/security-score/', async (route) => {
    await route.fulfill({
      json: {
        score: 0,
        grade: 'Unavailable',
        provider_required: true,
        message: 'Security scoring provider is not configured.',
        reasons: [],
      },
    });
  });
  await page.route('**/api/v1/alerts/**', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/v1/monitors/', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({
      status: 503,
      json: { detail: 'Threat intelligence provider is not configured.' },
    });
  });
  await page.route('**/api/v1/search/', async (route) => {
    await route.fulfill({
      json: {
        id: 'search-e2e',
        query: 'security@example.com',
        type: 'email',
        results: [],
        total: 0,
        balance: 499,
        took: 0.01,
        live: false,
        message: 'Search provider is not configured.',
      },
    });
  });
  await page.route('**/api/v1/billing/plans/', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/v1/billing/subscriptions/current/', async (route) => {
    await route.fulfill({
      status: 404,
      json: { detail: 'No active subscription.' },
    });
  });
  await page.route('**/api/v1/billing/subscriptions/usage/', async (route) => {
    await route.fulfill({
      json: {
        email_searches: { used: 1, limit: 100 },
        domain_lookups: { used: 0, limit: 100 },
        active_monitors: { used: 0, limit: 50 },
        api_calls: { used: 3, limit: 10000 },
      },
    });
  });
  await page.route('**/api/v1/reports/', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [] });
      return;
    }
    await route.fulfill({
      status: 503,
      json: { detail: 'Report backend is not configured.' },
    });
  });
  await page.route('**/api/v1/teams/', async (route) => {
    await route.fulfill({
      json: [
        {
          id: 'team-e2e',
          name: 'DarkWatch QA',
          owner: testUser.id,
          member_count: 1,
          created_at: '2026-08-05T00:00:00Z',
        },
      ],
    });
  });
  await page.route('**/api/v1/teams/team-e2e/members/', async (route) => {
    await route.fulfill({
      json: [
        {
          id: 'member-e2e',
          email: testUser.email,
          name: 'E2E User',
          role: 'owner',
          status: 'active',
          joined_at: '2026-08-05T00:00:00Z',
        },
      ],
    });
  });
}

async function authenticate(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('darkwatch-access-token', 'e2e-access-token');
    window.localStorage.setItem('darkwatch-refresh-token', 'e2e-refresh-token');
  });
}

test.describe('public and protected routes', () => {
  test('renders public marketing and auth routes without backend access', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Enterprise Dark Web Intelligence' })).toBeVisible();

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });

  test('redirects anonymous users from protected routes to login with next path', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('renders core protected routes with mocked authenticated backend state', async ({ page }) => {
    await mockBackend(page);
    await authenticate(page);

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible();
    await expect(page.getByText('Credits:').first()).toBeVisible();

    await page.goto('/monitoring');
    await expect(page.getByRole('heading', { name: /Monitoring/ })).toBeVisible();
    await expect(page.getByText('No monitors yet. Create your first monitor above.')).toBeVisible();

    await page.goto('/team');
    await expect(page.getByRole('heading', { name: /Team Management/ })).toBeVisible();
    await expect(page.getByText('E2E User')).toBeVisible();
  });
});

test.describe('provider-required frontend states', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await authenticate(page);
  });

  test('shows an honest provider-missing search result state', async ({ page }) => {
    await page.goto('/search');
    await page.getByPlaceholder('Search emails, domains, usernames, passwords...').fill('security@example.com');
    await page.getByRole('button', { name: /Search/ }).click();

    await expect(page.getByText('Found 0 results')).toBeVisible();
    await expect(page.getByText('no threat intelligence provider is configured')).toBeVisible();
  });

  test('keeps domain intelligence and assessment provider-gated', async ({ page }) => {
    await page.goto('/domains');
    await page.getByPlaceholder('Enter domain (e.g., example.com)').fill('example.com');
    await page.getByRole('button', { name: 'Analyze Domain' }).click();

    await expect(page.getByText('Provider Required')).toBeVisible();
    await expect(page.getByText('No analysis was run.')).toBeVisible();

    await page.goto('/domain-security');
    await expect(page.getByText('Domain security assessment unavailable')).toBeVisible();
    await expect(page.getByPlaceholder('Provider required before domains can be analyzed')).toBeDisabled();
  });

  test('keeps billing actions unavailable until a payment provider is configured', async ({ page }) => {
    await page.goto('/billing');

    await expect(page.getByRole('heading', { name: /Billing & Subscription/ })).toBeVisible();
    await expect(page.getByText('Payment provider not configured')).toBeVisible();
    await expect(page.getByRole('button', { name: /Provider Required/ })).toBeDisabled();
  });
});
