# DarkWatch Pro

Dark web monitoring & breach detection platform. React + Django application.

## Current Status

DarkWatch Pro is **Phase 3 complete and dev-ready**. The local environment supports the full React/Django flow: JWT auth, protected pages, API-backed dashboard/search/monitoring/alerts/reports/team/billing/support views, seeded demo data, Celery workers, and Docker Compose.

Production use still depends on real external services and deployment hardening:

- Stripe checkout/webhooks require live Stripe keys, real price IDs, and webhook endpoint testing.
- Email/SMS/webhook notifications and team invites are unavailable until a production provider is configured and wired.
- Threat intelligence/search/monitor checking is honest about missing provider configuration and needs real provider integration for production-grade data.
- Report generation/download is unavailable until a report backend is configured.
- Domain Intel and Domain Security are disabled until provider-backed analysis exists.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Zustand
- **Backend**: Django 5 + Django REST Framework
- **Database**: PostgreSQL
- **Cache/Queue**: Redis + Celery
- **Reverse Proxy**: Nginx (production)

## Quick Start

### Docker Compose (Recommended)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin/

Seed demo data after the backend is up:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_plans
docker compose exec backend python manage.py seed_demo_data
```

Demo login:

- Email: `demo@darkwatchpro.com`
- Password: `demo123`

### Manual Development

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_plans
python manage.py seed_demo_data
python manage.py createsuperuser
python manage.py runserver
```

#### Celery Workers

```bash
cd backend
celery -A config worker -l info
celery -A config beat -l info
```

## Project Structure

```
darkwatch-pro/
├── frontend/          # React + Vite + TypeScript + Zustand
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── pages/         # Page-level components (one per HTML page)
│   │   ├── stores/        # Zustand state management
│   │   ├── services/      # API client services
│   │   ├── styles/        # Extracted design system CSS
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx
│   └── ...
├── backend/           # Django + DRF
│   ├── config/           # Project settings
│   ├── apps/
│   │   ├── accounts/     # User auth, registration, profiles
│   │   ├── monitoring/   # Dark web monitors
│   │   ├── search/       # Search functionality
│   │   ├── alerts/       # Breach alerts
│   │   ├── billing/      # Stripe integration
│   │   ├── reports/      # Report generation
│   │   └── teams/        # Team management
│   └── ...
├── docker-compose.yml
├── .env.example
└── README.md
```

## Pages (17 routes)

| Route | Page | Type |
|-------|------|------|
| `/` | Landing (Home) | Public |
| `/about` | About | Public |
| `/contact` | Contact | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/logout` | Logout | Auth |
| `/dashboard` | Dashboard | Protected |
| `/search` | Search | Protected |
| `/monitoring` | Monitoring | Protected |
| `/domains` | Domain Intel | Protected |
| `/domain-security` | Domain Security | Protected |
| `/reports` | Reports | Protected |
| `/alerts` | Alerts | Protected |
| `/team` | Team Management | Protected |
| `/billing` | Billing | Protected |
| `/settings` | Settings | Protected |
| `/help` | Help & Support | Protected |

## Design System

The app uses CSS custom properties for theming with a dark/light mode toggle. See `frontend/src/styles/` for the full design system.

### Color Palette

**Dark Mode (default):**
- Accent: #00ff88 (green)
- Background: #000000 → #1a1a1a (layered)
- Text: #ffffff → #666666

**Light Mode:**
- Accent: #6f42c1 (purple)
- Background: #ffffff → #e8eaed (layered)
- Text: #202124 → #9aa0a6

## Phase Status

- ✅ Phase 1: Scaffolding + design system extraction
- ✅ Phase 2: React page implementation + backend models/API
- ✅ Phase 3: Auth flow, API integration, Stripe/Celery/support/deploy prep
- ⬜ Phase 4: Production integrations, hardening, CI/CD, and E2E coverage

## Known Demo/Mock Areas

- Search stores history, decrements credits, and returns an explicit provider-not-configured state until live threat intelligence is wired.
- Monitor checks return an explicit provider-not-configured state until live threat intelligence is wired.
- Domain Intel and Domain Security are frontend unavailable states until provider-backed analysis exists.
- Team invites and alert notifications require a configured email provider before they return success.
- SMS tests and webhook tests are unavailable until provider-backed implementations exist.
- Billing plans/subscriptions are persisted locally, but real plan changes require configured Stripe price IDs and live webhook testing.
- Report generation/download is unavailable until a report backend exists.
