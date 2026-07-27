import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Component, type ReactNode } from 'react';
import { PublicLayout, AppLayout, ToastContainer } from './components';
import { useAppStore } from './stores/useAppStore';

// Public pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LogoutPage from './pages/LogoutPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import MonitoringPage from './pages/MonitoringPage';
import DomainsPage from './pages/DomainsPage';
import DomainSecurityPage from './pages/DomainSecurityPage';
import ReportsPage from './pages/ReportsPage';
import AlertsPage from './pages/AlertsPage';
import TeamPage from './pages/TeamPage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import NotFoundPage from './pages/NotFoundPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: '#ff6b6b', background: 'var(--bg-primary)', minHeight: '100vh' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#ff6b6b' }}>{this.state.error.message}</pre>
          <button onClick={() => window.location.href = '/dashboard'} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Dashboard</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const fetchUser = useAppStore((s) => s.fetchUser);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Auth actions */}
        <Route path="/logout" element={<LogoutPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/domains" element={<DomainsPage />} />
          <Route path="/domain-security" element={<DomainSecurityPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}