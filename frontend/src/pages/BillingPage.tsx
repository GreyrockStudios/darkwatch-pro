import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { billingApi } from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import type { Plan, Subscription, Usage } from '../types';

const defaultUsage: Usage = {
  email_searches: { used: 0, limit: 100 },
  domain_lookups: { used: 0, limit: 100 },
  active_monitors: { used: 0, limit: 50 },
  api_calls: { used: 0, limit: 10000 },
};

const invoices = [
  { id: 'INV-2024-001', date: 'Jul 1, 2026', amount: '$79.00', status: 'paid' as const, plan: 'Professional' },
];

export default function BillingPage() {
  const addToast = useAppStore((s) => s.addToast);
  const user = useAppStore((s) => s.user);
  const credits = user?.credits ?? 0;
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage>(defaultUsage);

  const loadData = useCallback(async () => {
    try {
      const [plansData, subData, usageData] = await Promise.allSettled([
        billingApi.plans(),
        billingApi.currentSubscription(),
        billingApi.usage(),
      ]);
      if (plansData.status === 'fulfilled') {
        const p = plansData.value;
        setPlans(Array.isArray(p) ? p : (p as { results?: Plan[] })?.results || []);
      }
      if (subData.status === 'fulfilled') setSubscription(subData.value);
      if (usageData.status === 'fulfilled') setUsage(usageData.value);
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const planName = subscription?.plan_name || user?.plan || 'Professional';
  const planPrice = subscription?.plan_price || '79';
  const planCredits = subscription?.plan_credits || 500;

  const usageItems = [
    { title: 'Email Searches', value: usage.email_searches.used.toLocaleString(), limit: `of ${usage.email_searches.limit.toLocaleString()} searches`, pct: Math.min(100, Math.round((usage.email_searches.used / usage.email_searches.limit) * 100)) },
    { title: 'Domain Lookups', value: usage.domain_lookups.used.toLocaleString(), limit: `of ${usage.domain_lookups.limit.toLocaleString()} lookups`, pct: Math.min(100, Math.round((usage.domain_lookups.used / usage.domain_lookups.limit) * 100)), warn: usage.domain_lookups.used > usage.domain_lookups.limit * 0.8 },
    { title: 'Active Monitors', value: usage.active_monitors.used.toLocaleString(), limit: `of ${usage.active_monitors.limit.toLocaleString()} monitors`, pct: Math.min(100, Math.round((usage.active_monitors.used / usage.active_monitors.limit) * 100)) },
    { title: 'API Calls', value: usage.api_calls.used.toLocaleString(), limit: `of ${usage.api_calls.limit.toLocaleString()} calls`, pct: Math.min(100, Math.round((usage.api_calls.used / usage.api_calls.limit) * 100)) },
  ];

  const displayPlans = plans.length > 0 ? plans : [
    { id: '1', name: 'Starter', price: '29.00', credits_per_month: 100, features: ['100 credits per month', '5 monitors', 'Email alerts', 'Basic reporting'], stripe_price_id: '', description: 'For individuals' },
    { id: '2', name: 'Professional', price: '79.00', credits_per_month: 500, features: ['500 credits per month', '25 monitors', 'Email & SMS alerts', 'Advanced reporting'], stripe_price_id: '', description: 'For teams' },
    { id: '3', name: 'Enterprise', price: '199.00', credits_per_month: 2000, features: ['2000 credits per month', 'Unlimited monitors', 'All alert types', 'API access', 'Priority support'], stripe_price_id: '', description: 'For organizations' },
  ];

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-credit-card"></i> Billing & Subscription</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">${planPrice}</div><div className="stat-label">Monthly Cost</div></div>
        <div className="stat-card"><div className="stat-number">{planCredits}</div><div className="stat-label">Credits/Month</div></div>
        <div className="stat-card"><div className="stat-number">{credits.toLocaleString()}</div><div className="stat-label">Remaining Credits</div></div>
      </div>

      {/* Current Plan */}
      <div className="current-plan">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>{planName} Plan</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>${planPrice}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/month</span></div>
            {subscription && <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Status: <span className={`badge badge-${subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'active' : 'paused'}`}>{subscription.status}</span>
              {subscription.current_period_end && <> · Renews {new Date(subscription.current_period_end).toLocaleDateString()}</>}
            </div>}
          </div>
          <button className="btn btn-outline" onClick={() => setShowChangePlan(true)}>Change Plan</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {((): string[] => {
            const p = displayPlans.find((p) => p.name.toLowerCase() === planName.toLowerCase()) || displayPlans[1];
            const f = p?.features;
            if (!f) return [];
            if (typeof f === 'string') return f.split(',');
            return f as string[];
          })().map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-check" style={{ color: 'var(--success)' }}></i>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Usage This Month</h3>
        </div>
        <div className="usage-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {usageItems.map((u) => (
            <div key={u.title} style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 500 }}>{u.title}</div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{u.value}</div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{u.limit}</div>
              <div className="progress-bar">
                <div className={`progress-fill ${u.warn ? 'warning' : 'accent'}`} style={{ width: `${u.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Payment Methods</h3>
          <button className="btn btn-primary" onClick={() => setShowAddPayment(true)}><i className="fas fa-plus"></i> Add Payment Method</button>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ marginBottom: '0.25rem' }}>Demo Card ending in 4242</h4>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Expires 12/26</div>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'inline-block' }}>Default</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm">Edit</button>
              <button className="btn btn-danger btn-sm" style={{ background: 'var(--danger)', color: 'var(--bg-primary)' }}>Remove</button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invoice History</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-tertiary)', fontWeight: 600 }}>Invoice</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-tertiary)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-tertiary)', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-tertiary)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{inv.id}</td>
                  <td style={{ padding: '1rem' }}>{inv.date}</td>
                  <td style={{ padding: '1rem' }}>{inv.amount}</td>
                  <td style={{ padding: '1rem' }}><span className="badge badge-active">{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Plan Modal */}
      <Modal isOpen={showChangePlan} onClose={() => setShowChangePlan(false)} title="Change Plan">
        <div style={{ display: 'grid', gap: '1rem' }}>
          {displayPlans.map((plan) => (
            <div key={plan.id} style={{ padding: '1.5rem', border: `2px solid ${plan.name.toLowerCase() === planName.toLowerCase() ? 'var(--accent-primary)' : 'var(--border-color)'}`, borderRadius: '12px', cursor: 'pointer' }}
              className={plan.name.toLowerCase() === planName.toLowerCase() ? 'pricing-card featured' : 'pricing-card'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{plan.name}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>${plan.price}<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/mo</span></div>
                </div>
                <button className={`btn ${plan.name.toLowerCase() === planName.toLowerCase() ? 'btn-primary' : 'btn-outline'}`}>
                  {plan.name.toLowerCase() === planName.toLowerCase() ? 'Current Plan' : 'Select'}
                </button>
              </div>
              <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
                {(typeof plan.features === 'string' ? plan.features.split(',') : plan.features)?.map((f) => <li key={typeof f === 'string' ? f : String(f)} style={{ padding: '0.25rem 0', color: 'var(--text-secondary)' }}>✓ {typeof f === 'string' ? f : String(f)}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal isOpen={showAddPayment} onClose={() => setShowAddPayment(false)} title="Add Payment Method" maxWidth="600px">
        <form onSubmit={(e) => { e.preventDefault(); addToast('info', 'Payment method integration coming soon'); setShowAddPayment(false); }}>
          <div className="form-group"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" /></div>
          <div className="form-row">
            <div className="form-group"><label>Expiry Date</label><input type="text" placeholder="MM/YY" /></div>
            <div className="form-group"><label>CVC</label><input type="text" placeholder="123" /></div>
          </div>
          <div className="form-group"><label>Cardholder Name</label><input type="text" placeholder="John Smith" /></div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Payment Method</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowAddPayment(false)} style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}