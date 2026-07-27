import type {
  AuthTokens, AuthResponse, User, Monitor, SearchResponse, SearchResult,
  Alert, Report, Plan, Subscription, Usage, Team, TeamMember, Ticket, TicketMessage
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface RequestOptions {
  headers?: Record<string, string>;
  method?: string;
  body?: string;
  skipRefresh?: boolean;
}

// Token management
function getAccessToken(): string | null {
  return localStorage.getItem('darkwatch-access-token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('darkwatch-refresh-token');
}

function setTokens(access: string, refresh?: string): void {
  localStorage.setItem('darkwatch-access-token', access);
  if (refresh) {
    localStorage.setItem('darkwatch-refresh-token', refresh);
  }
}

function clearTokens(): void {
  localStorage.removeItem('darkwatch-access-token');
  localStorage.removeItem('darkwatch-refresh-token');
}

// Token refresh
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      window.location.href = '/login';
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        window.location.href = '/login';
        return null;
      }

      const data = await response.json();
      setTokens(data.access, data.refresh);
      return data.access;
    } catch {
      clearTokens();
      window.location.href = '/login';
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Core request function with token refresh interceptor
async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Handle 401 — try to refresh token
  if (response.status === 401 && !options?.skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData);
    } catch { /* ignore */ }

    // Handle specific status codes
    if (response.status === 401) {
      clearTokens();
      window.location.href = '/login';
    }

    throw new Error(errorDetail);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// Helper to unwrap paginated responses
function unwrapPaginated<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'results' in data) {
    return (data as PaginatedResponse<T>).results;
  }
  return data as unknown as T[];
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthTokens>('/auth/login/', { email, password }),
  register: (data: { email: string; password: string; password_confirm: string; first_name: string; last_name: string; company?: string; plan?: string }) =>
    api.post<AuthResponse>('/accounts/register/', data),
  refreshToken: (refresh: string) =>
    request<{ access: string }>('/auth/refresh/', { method: 'POST', body: JSON.stringify({ refresh }), skipRefresh: true }),
  me: () => api.get<User>('/accounts/me/'),
  updateMe: (data: Partial<User>) => api.patch<User>('/accounts/me/update/', data),
  changePassword: (old_password: string, new_password: string) =>
    api.post<{ detail: string }>('/accounts/change-password/', { old_password, new_password }),
};

// Monitors API
export const monitorsApi = {
  list: () => api.get<Monitor[] | PaginatedResponse<Monitor>>('/monitors/').then(unwrapPaginated),
  retrieve: (id: string) => api.get<Monitor>(`/monitors/${id}/`),
  create: (data: { name: string; type: string; value: string }) => api.post<Monitor>('/monitors/', data),
  update: (id: string, data: Partial<Monitor>) => api.patch<Monitor>(`/monitors/${id}/`, data),
  delete: (id: string) => api.delete(`/monitors/${id}/`),
  start: (id: string) => api.post<{ status: string }>(`/monitors/${id}/start/`),
  pause: (id: string) => api.post<{ status: string }>(`/monitors/${id}/pause/`),
};

// Search API
export const searchApi = {
  search: (query: string, type?: string) => api.post<SearchResponse>('/search/', { query, type: type || 'email' }),
  history: () => api.get<SearchResult[] | PaginatedResponse<SearchResult>>('/search/history/').then(unwrapPaginated),
};

// Alerts API
export const alertsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<Alert[] | PaginatedResponse<Alert>>(`/alerts/${query}`).then(unwrapPaginated);
  },
  retrieve: (id: string) => api.get<Alert>(`/alerts/${id}/`),
  acknowledge: (id: string) => api.post<{ status: string }>(`/alerts/${id}/acknowledge/`),
  resolve: (id: string) => api.post<{ status: string }>(`/alerts/${id}/resolve/`),
};

// Reports API
export const reportsApi = {
  list: () => api.get<Report[] | PaginatedResponse<Report>>('/reports/').then(unwrapPaginated),
  create: (data: { type: string; title: string; data?: Record<string, unknown> }) => api.post<Report>('/reports/', data),
  generate: (id: string) => api.post<Report>(`/reports/${id}/generate/`),
  download: (id: string) => api.get<Record<string, unknown>>(`/reports/${id}/download/`),
};

// Billing API
export const billingApi = {
  plans: () => api.get<Plan[] | PaginatedResponse<Plan>>('/billing/plans/').then(unwrapPaginated),
  currentSubscription: () => api.get<Subscription>('/billing/subscriptions/current/'),
  usage: () => api.get<Usage>('/billing/subscriptions/usage/'),
  createCheckout: (planId: string, successUrl?: string, cancelUrl?: string) =>
    api.post<{ checkout_url: string; session_id: string }>('/billing/subscriptions/create-checkout/', {
      plan_id: planId, success_url: successUrl, cancel_url: cancelUrl,
    }),
};

// Teams API
export const teamsApi = {
  list: () => api.get<Team[] | PaginatedResponse<Team>>('/teams/').then(unwrapPaginated),
  create: (data: { name: string }) => api.post<Team>('/teams/', data),
  members: (teamId: string) => api.get<TeamMember[]>(`/teams/${teamId}/members/`),
  invite: (teamId: string, data: { email: string; role: string }) =>
    api.post<{ message: string }>(`/teams/${teamId}/invite/`, data),
  addMember: (teamId: string, data: { email: string; role: string }) =>
    api.post<TeamMember>(`/teams/${teamId}/members/`, data),
  removeMember: (teamId: string, memberId: string) =>
    api.delete(`/teams/${teamId}/members/${memberId}/`),
};

// Support API
export const supportApi = {
  createTicket: (data: { subject: string; description: string; priority?: string }) =>
    api.post<Ticket>('/support/tickets/', data),
  listTickets: () => api.get<Ticket[] | PaginatedResponse<Ticket>>('/support/tickets/').then(unwrapPaginated),
  getTicket: (id: string) => api.get<Ticket>(`/support/tickets/${id}/`),
  addMessage: (id: string, message: string) =>
    api.post<TicketMessage>(`/support/tickets/${id}/add_message/`, { message }),
};

// Export token helpers for store
export { getAccessToken, getRefreshToken, setTokens, clearTokens };