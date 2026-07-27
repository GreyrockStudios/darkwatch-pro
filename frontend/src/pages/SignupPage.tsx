import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export default function SignupPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    password: '',
    password_confirm: '',
    plan: 'professional',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const register = useAppStore((s) => s.register);
  const authLoading = useAppStore((s) => s.authLoading);
  const authError = useAppStore((s) => s.authError);
  const clearAuthError = useAppStore((s) => s.clearAuthError);
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.password_confirm) errs.password_confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch {
      // Error stored in authError state
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <section className="auth-section" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="signup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-header">
              <h1>Create Account</h1>
              <p>Start your 14-day free trial</p>
            </div>

            {authError && (
              <div style={{
                background: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                color: '#ff6b6b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>{authError}</span>
                <button type="button" onClick={clearAuthError} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" placeholder="John" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required disabled={authLoading} />
                {errors.first_name && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.first_name}</span>}
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" placeholder="Doe" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required disabled={authLoading} />
                {errors.last_name && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.last_name}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="john@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} required disabled={authLoading} />
              {errors.email && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>Company (Optional)</label>
              <input type="text" placeholder="Company name" value={form.company} onChange={(e) => update('company', e.target.value)} disabled={authLoading} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Create password" value={form.password} onChange={(e) => update('password', e.target.value)} required disabled={authLoading} />
                {errors.password && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.password}</span>}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" placeholder="Confirm password" value={form.password_confirm} onChange={(e) => update('password_confirm', e.target.value)} required disabled={authLoading} />
                {errors.password_confirm && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.password_confirm}</span>}
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={authLoading}>
              {authLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="divider" style={{ margin: '1.5rem 0', position: 'relative', color: 'var(--text-muted)', textAlign: 'center' }}>
              <span style={{ background: 'var(--bg-secondary)', padding: '0 1rem' }}>or continue with</span>
            </div>

            <div className="social-login" style={{ display: 'grid', gap: '1rem' }}>
              <button type="button" className="social-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                <i className="fab fa-google"></i> Google
              </button>
              <button type="button" className="social-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                <i className="fab fa-microsoft"></i> Microsoft
              </button>
            </div>

            <div className="signup-link" style={{ marginTop: '1.5rem' }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>

          <div style={{ background: 'var(--bg-quaternary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Choose Your Plan</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select the plan that fits your needs</p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { id: 'starter', name: 'Starter', price: '$29/mo', features: '100 credits, 5 monitors' },
                { id: 'professional', name: 'Professional', price: '$79/mo', features: '500 credits, 25 monitors' },
                { id: 'enterprise', name: 'Enterprise', price: '$199/mo', features: 'Unlimited, custom integrations' },
              ].map((plan) => (
                <label key={plan.id} style={{
                  display: 'flex', alignItems: 'center', padding: '1rem', border: `1px solid ${form.plan === plan.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: '8px', cursor: 'pointer', background: form.plan === plan.id ? 'rgba(111,66,193,0.1)' : 'transparent',
                }}>
                  <input type="radio" name="plan" checked={form.plan === plan.id} onChange={() => update('plan', plan.id)} style={{ marginRight: '1rem', accentColor: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{plan.name}</div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{plan.price}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{plan.features}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}