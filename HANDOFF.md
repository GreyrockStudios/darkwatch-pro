# DarkWatch Pro — HANDOFF

## Project Status
**Phase 3 Complete** — Full-stack app with auth flow, API integration, Stripe billing, Celery tasks, support tickets, and deployment config.

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
- **Billing**: Stripe Checkout + Webhooks
- **Deploy**: Docker + Nginx

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

## Next Steps
- Domain intel pages (wire to search API)
- Report PDF generation
- Team invite email flow
- Production deploy testing
- CI/CD pipeline
- E2E tests