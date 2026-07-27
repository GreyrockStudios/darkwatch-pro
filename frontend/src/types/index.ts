// API Response Types

export interface User {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  plan: string;
  credits: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// Monitor Types
export interface Monitor {
  id: string | number;
  name: string;
  type: 'email' | 'domain' | 'username' | 'ip' | 'phone' | 'company';
  value: string;
  status: 'active' | 'paused' | 'alerting' | 'error';
  created_at: string;
  last_checked: string | null;
  breach_count: number;
}

// Alert Types
export interface Alert {
  id: string | number;
  monitor: string | number | { id: string; name: string; monitor_type: string } | null;
  monitor_name?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  affected_value?: string;
  breach_name?: string;
  // Extended fields for UI
  monitorName?: string;
  monitorType?: string;
  monitorId?: string;
  timestamp?: string;
}

// Search Types
export interface SearchResult {
  id: string;
  query: string;
  type: string;
  source: string;
  value: string;
  result_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  data_types: string[];
  description: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface SearchResponse {
  id: string;
  query: string;
  type: string;
  results: SearchResultItem[];
  total: number;
  balance: number;
  took: number;
}

export interface SearchResultItem {
  email?: string;
  domain?: string;
  username?: string;
  password?: string;
  breachName: string;
  breachDate: string;
  dataTypes: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Domain Types
export interface DomainInfo {
  domain: string;
  status: 'safe' | 'warning' | 'danger';
  whois: Record<string, string>;
  dns: Record<string, string[]>;
  ssl: Record<string, string>;
  subdomains: Subdomain[];
  threats: DomainThreat[];
}

export interface Subdomain {
  name: string;
  ip: string;
  status: string;
}

export interface DomainThreat {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Team Types
export interface Team {
  id: string | number;
  name: string;
  owner: string | number;
  member_count?: number;
  created_at: string;
}

export interface TeamMember {
  id: string | number;
  team?: string | number;
  email?: string;
  name?: string;
  user?: string | number;
  role: 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  joined_at: string;
  user_email?: string;
}

// Billing Types
export interface Plan {
  id: string | number;
  name: string;
  price: string;
  credits_per_month: number;
  features: string[] | string;
  stripe_price_id: string;
  description: string;
}

export interface Subscription {
  id: string | number;
  plan: string | number;
  plan_name: string;
  plan_price: string;
  plan_credits: number;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface Usage {
  email_searches: { used: number; limit: number };
  domain_lookups: { used: number; limit: number };
  active_monitors: { used: number; limit: number };
  api_calls: { used: number; limit: number };
}

// Report Types
export interface Report {
  id: string | number;
  type: 'breach' | 'executive' | 'compliance' | 'domain' | 'monitoring';
  title: string;
  data: Record<string, unknown>;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
}

// Support Ticket Types
export interface Ticket {
  id: string | number;
  user: string | number;
  user_email: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string | number;
  ticket: string | number;
  sender: string;
  sender_email: string;
  message: string;
  created_at: string;
}

// Invoice (frontend-only for now)
export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
  plan: string;
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface SidebarItem {
  label: string;
  icon: string;
  path: string;
}