import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { SidebarItem } from '../types';

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: 'fas fa-tachometer-alt', path: '/dashboard' },
  { label: 'Search', icon: 'fas fa-search', path: '/search' },
  { label: 'Monitoring', icon: 'fas fa-shield-alt', path: '/monitoring' },
  { label: 'Domain Intel', icon: 'fas fa-globe', path: '/domains' },
  { label: 'Domain Security', icon: 'fas fa-lock', path: '/domain-security' },
  { label: 'Reports', icon: 'fas fa-file-alt', path: '/reports' },
  { label: 'Alerts', icon: 'fas fa-bell', path: '/alerts' },
  { label: 'Team', icon: 'fas fa-users', path: '/team' },
  { label: 'Billing', icon: 'fas fa-credit-card', path: '/billing' },
  { label: 'Settings', icon: 'fas fa-cog', path: '/settings' },
  { label: 'Help', icon: 'fas fa-question-circle', path: '/help' },
  { label: 'Logout', icon: 'fas fa-sign-out-alt', path: '/logout' },
];

export function Sidebar() {
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const credits = user?.credits ?? 1247;
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <nav className="sidebar" style={sidebarOpen ? { transform: 'translateX(0)' } : undefined}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="logo" style={{ textDecoration: 'none' }}>
            <i className="fas fa-shield-alt"></i>
            DarkWatch Pro
          </Link>
        </div>
        <ul className="sidebar-nav">
          {sidebarItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => setSidebarOpen(false)}
              >
                <i className={item.icon}></i>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-credit" style={{ padding: '1rem 1.5rem', borderTop: '2px solid var(--border-color)', marginTop: '1rem', textAlign: 'center' }}>
          <div className="credit-balance" style={{ display: 'inline-flex' }}>
            Credits: <span style={{ marginLeft: '0.25rem' }}>{credits.toLocaleString()}</span>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              marginTop: '1rem',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </nav>
    </>
  );
}