# DarkWatch Pro — HANDOFF

## Project Status
**Phase 3 Complete / Dev-Ready** — Full-stack app with auth flow, API integration, Stripe billing endpoints, Celery tasks, support tickets, seeded demo data, and deployment config. Production still depends on real Stripe keys/price IDs/webhook testing, email/SMS/webhook providers, threat-intel/search providers, SSL, CI/CD, and E2E coverage.

## Quick Start
```bash
# Backend
cd backend && source venv/bin/activate
python manage.py migrate
python manage.py seed_plans
python manage.py seed_demo_data
python manage.py runserver

# Frontend
cd frontend && npm run dev

# Demo credentials
email: demo@darkwatchpro.com
password: demo123
```

## Architecture
- **Backend**: Django 5.x + DRF + Celery + PostgreSQL
- **Frontend**: React 19 + TypeScript + Zustand + Vite
- **Billing**: Stripe Checkout + webhook code; requires configured keys, price IDs, and webhook endpoint validation
- **Deploy**: Docker + Nginx; production compose uses `config.settings.prod`

## Key Files
| Area | Path | Purpose |
|------|------|---------|
| Backend settings | `backend/config/settings/dev.py` | Dev config with all apps, Celery, Stripe |
| Prod settings | `backend/config/settings/prod.py` | Production security config |
| Frontend API | `frontend/src/services/api.ts` | All API calls with token refresh |
| Auth store | `frontend/src/stores/useAppStore.ts` | Zustand store (auth, user, toasts) |
| Auth hook | `frontend/src/hooks/useAuth.ts` | useRequireAuth, useRedirectIfAuth |
| Loading UI | `frontend/src/components/LoadingSpinner.tsx` | Spinner, Skeleton, Toast, ErrorMessage |
| Celery tasks | `backend/apps/{monitoring,alerts,reports}/tasks.py` | Background tasks |
| Support app | `backend/apps/support/` | Ticket system |
| Seed commands | `backend/apps/{accounts,billing}/management/commands/` | Demo data |

## Phase History
- **Phase 1**: Original HTML → React components, pixel-perfect
- **Phase 2**: Backend API (Django + DRF, all models/views/serializers)
- **Phase 3**: Auth flow, API integration, Stripe, Celery, deployment prep

## Known Demo/Mock Areas
- Search stores history, decrements credits, and reports missing provider configuration instead of showing fake hits
- Monitor checks report missing provider configuration until live threat intelligence is wired
- Domain Intel and Domain Security pages show provider-required unavailable states until analysis is wired
- Team invite and alert notification endpoints require a configured email provider before they return success
- SMS tests and webhook tests are unavailable until provider-backed implementations exist
- Report generation/download is unavailable until a report backend is configured
- Billing plan data is seeded locally; real subscription changes require Stripe configuration and webhook testing

## Next Steps
- Domain intel pages (wire to real backend/provider data)
- Report PDF generation
- Team invite email flow
- Production deploy testing
- CI/CD pipeline
- E2E tests
