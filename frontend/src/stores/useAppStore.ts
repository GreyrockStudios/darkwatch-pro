import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setTokens, clearTokens, getAccessToken } from '../services/api';
import type { User, Toast, ToastType } from '../types';

type Theme = 'dark' | 'light';

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Auth
  isAuthenticated: boolean;
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; password_confirm: string; first_name: string; last_name: string; company?: string; plan?: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearAuthError: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Toasts
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

let toastIdCounter = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      toggleTheme: () => {
        const current = get().theme;
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },

      // Auth
      isAuthenticated: !!getAccessToken(),
      user: null,
      authLoading: false,
      authError: null,

      login: async (email, password) => {
        set({ authLoading: true, authError: null });
        try {
          const tokens = await authApi.login(email, password);
          setTokens(tokens.access, tokens.refresh);
          set({ isAuthenticated: true });
          // Fetch user profile after login
          const user = await authApi.me();
          set({ user, authLoading: false });
          get().addToast('success', `Welcome back, ${user.first_name || user.email}!`);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed';
          set({ authError: message, authLoading: false, isAuthenticated: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ authLoading: true, authError: null });
        try {
          const response = await authApi.register(data);
          setTokens(response.access, response.refresh);
          set({ isAuthenticated: true, user: response.user, authLoading: false });
          get().addToast('success', 'Account created successfully!');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Registration failed';
          set({ authError: message, authLoading: false });
          throw err;
        }
      },

      logout: () => {
        clearTokens();
        set({ isAuthenticated: false, user: null, authError: null });
        window.location.href = '/';
      },

      fetchUser: async () => {
        if (!getAccessToken()) return;
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true });
        } catch {
          // Token might be expired — the interceptor handles redirect
          set({ user: null, isAuthenticated: false });
        }
      },

      clearAuthError: () => set({ authError: null }),

      // Sidebar
      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Toasts
      toasts: [],
      addToast: (type, message, duration = 4000) => {
        const id = `toast-${++toastIdCounter}`;
        set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
        if (duration > 0) {
          setTimeout(() => get().removeToast(id), duration);
        }
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'darkwatch-pro-store',
      partialize: (state) => ({
        theme: state.theme,
        // Don't persist user object or auth state to localStorage
        // Tokens are handled separately via localStorage directly
      }),
    }
  )
);