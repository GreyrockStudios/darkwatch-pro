import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const login = useAppStore((s) => s.login);
  const authLoading = useAppStore((s) => s.authLoading);
  const authError = useAppStore((s) => s.authError);
  const clearAuthError = useAppStore((s) => s.clearAuthError);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const from = searchParams.get('next') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error is stored in authError state
    }
  };

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your DarkWatch Pro account</p>
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
              <button onClick={clearAuthError} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" disabled={authLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" disabled={authLoading} />
            </div>
            <div className="form-options">
              <div className="checkbox-group">
                <input type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <label htmlFor="remember" style={{ margin: 0, fontSize: '0.9rem' }}>Remember me</label>
              </div>
              <a href="#" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>Forgot password?</a>
            </div>
            <button type="submit" className="auth-button" disabled={authLoading}>
              {authLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="divider"><span>or continue with</span></div>

            <div className="social-login">
              <button type="button" className="social-btn"><i className="fab fa-google"></i> Google</button>
              <button type="button" className="social-btn"><i className="fab fa-microsoft"></i> Microsoft</button>
            </div>

            <div className="signup-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}