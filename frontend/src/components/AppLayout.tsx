import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../stores/useAppStore';

export function AppLayout() {
  const { toggleSidebar } = useAppStore();

  return (
    <>
      <Sidebar />
      <main className="main-content">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
          className="mobile-menu-btn"
        />
        <Outlet />
      </main>
    </>
  );
}
