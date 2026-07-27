# DarkWatch Pro

Dark web monitoring & breach detection platform. React + Django application.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Zustand
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

- ✅ Phase 1: Scaffolding + Design System Extraction
- ⬜ Phase 2: Component implementation (real React components matching original HTML)
- ⬜ Phase 3: Backend API implementation
- ⬜ Phase 4: Integration, auth, real data