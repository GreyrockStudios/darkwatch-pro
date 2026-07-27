import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export function useRequireAuth() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const fetchUser = useAppStore((s) => s.fetchUser);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      const next = location.pathname + location.search;
      navigate('/login?next=' + encodeURIComponent(next), { replace: true });
    } else {
      // Fetch user profile if authenticated but no user data
      fetchUser();
    }
  }, [isAuthenticated, navigate, location, fetchUser]);

  return isAuthenticated;
}

export function useRedirectIfAuth() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const from = params.get('next') || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return !isAuthenticated;
}

export function useAuth() {
  const store = useAppStore();
  return {
    isAuthenticated: store.isAuthenticated,
    user: store.user,
    authLoading: store.authLoading,
    authError: store.authError,
    login: store.login,
    register: store.register,
    logout: store.logout,
    fetchUser: store.fetchUser,
    clearAuthError: store.clearAuthError,
  };
}