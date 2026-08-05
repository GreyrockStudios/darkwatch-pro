import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useAppStore } from '../stores/useAppStore';
import { authApi } from '../services/api';

export default function SettingsPage() {
  const user = useAppStore((s) => s.user);
  const fetchUser = useAppStore((s) => s.fetchUser);
  const addToast = useAppStore((s) => s.addToast);
  const [show2FA, setShow2FA] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    company: user?.company || '',
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [notifications, setNotifications] = useState({
    email_critical: true, email_high: true, email_medium: true, email_low: false,
    sms_critical: false, sms_high: false, sms_medium: false, sms_low: false,
    webhook_critical: false, webhook_high: false, webhook_medium: false, webhook_low: false,
    weekly_report: true, marketing: false,
  });

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        company: user.company || '',
      });
    }
  }, [user]);

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateMe(profile);
      await fetchUser();
      addToast('success', 'Profile saved successfully');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      addToast('error', 'Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(passwordForm.old_password, passwordForm.new_password);
      addToast('success', 'Password changed successfully');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const credits = user?.credits ?? 1247;
  const customerId = `DW-${(user?.plan || 'basic').toUpperCase()}-2024-${String(user?.id ?? '001').padStart(3, '0').substring(0, 3)}`;

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-cog"></i> Settings</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="settings-section">
        <h3 className="section-title">Account Settings</h3>
        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Customer ID:</span> <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{customerId}</span></div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(customerId)}><i className="fas fa-copy"></i> Copy</button>
          </div>
          <div className="form-row">
            <div className="form-group"><label>First Name</label><input type="text" value={profile.first_name} onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))} /></div>
            <div className="form-group"><label>Last Name</label><input type="text" value={profile.last_name} onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>Email Address</label><input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></div>
          <div className="form-group"><label>Company</label><input type="text" value={profile.company} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} /></div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      {/* Change Password */}
      <div className="settings-section">
        <h3 className="section-title">Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group"><label>Current Password</label><input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm((p) => ({ ...p, old_password: e.target.value }))} required /></div>
          <div className="form-row">
            <div className="form-group"><label>New Password</label><input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))} required minLength={8} /></div>
            <div className="form-group"><label>Confirm New Password</label><input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm_password: e.target.value }))} required /></div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingPassword}>{savingPassword ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>

      {/* Security Settings */}
      <div className="settings-section">
        <h3 className="section-title">Security Settings</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { icon: 'fa-lock', title: 'Two-Factor Authentication', desc: 'Requires backend authenticator enrollment before it can be enabled', action: 'Unavailable', disabled: true, onClick: () => setShow2FA(true) },
            { icon: 'fa-history', title: 'Session Management', desc: 'Requires a session management endpoint before active sessions can be shown', action: 'Unavailable', disabled: true, onClick: () => {} },
          ].map((item) => (
            <div key={item.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>{item.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={item.onClick} disabled={item.disabled}>{item.action}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="settings-section">
        <h3 className="section-title">Notification Preferences</h3>
        <h4 style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fas fa-envelope"></i> Email Notifications</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { key: 'email_critical' as const, label: 'Critical Alerts', desc: 'Immediate breach notifications' },
            { key: 'email_high' as const, label: 'High Priority', desc: 'Important security findings' },
            { key: 'email_medium' as const, label: 'Medium Priority', desc: 'Security updates' },
            { key: 'email_low' as const, label: 'Low Priority', desc: 'General notifications' },
          ].map((n) => (
            <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div><div style={{ fontWeight: 500 }}>{n.label}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{n.desc}</div></div>
              <label style={{ position: 'relative', width: '44px', height: '24px' }}>
                <input type="checkbox" checked={notifications[n.key]} onChange={() => toggle(n.key)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: notifications[n.key] ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '12px', transition: '0.3s' }}></span>
                <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications[n.key] ? '24px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></span>
              </label>
            </div>
          ))}
        </div>
        <h4 style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fas fa-sms"></i> SMS Notifications</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { key: 'sms_critical' as const, label: 'Critical Alerts', desc: 'Immediate SMS notifications' },
            { key: 'sms_high' as const, label: 'High Priority', desc: 'Important SMS alerts' },
            { key: 'sms_medium' as const, label: 'Medium Priority', desc: 'SMS updates' },
            { key: 'sms_low' as const, label: 'Low Priority', desc: 'General SMS' },
          ].map((n) => (
            <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: 0.7 }}>
              <div><div style={{ fontWeight: 500 }}>{n.label}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{n.desc} - provider required</div></div>
              <label style={{ position: 'relative', width: '44px', height: '24px' }}>
                <input type="checkbox" checked={notifications[n.key]} disabled style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                <span style={{ position: 'absolute', cursor: 'not-allowed', inset: 0, background: notifications[n.key] ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '12px', transition: '0.3s' }}></span>
                <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications[n.key] ? '24px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></span>
              </label>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ color: 'var(--info)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fas fa-globe"></i> Webhook Notifications</h4>
            {[
              { key: 'webhook_critical' as const, label: 'Critical Webhooks' },
              { key: 'webhook_high' as const, label: 'High Priority Webhooks' },
            ].map((n) => (
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '0.5rem', opacity: 0.7 }}>
                <span>{n.label} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>provider required</span></span>
                <label style={{ position: 'relative', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications[n.key]} disabled style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  <span style={{ position: 'absolute', cursor: 'not-allowed', inset: 0, background: notifications[n.key] ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '12px', transition: '0.3s' }}></span>
                  <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications[n.key] ? '24px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></span>
                </label>
              </div>
            ))}
          </div>
          <div>
            <h4 style={{ color: 'var(--success)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fas fa-chart-bar"></i> Reports</h4>
            {[
              { key: 'weekly_report' as const, label: 'Weekly Reports' },
              { key: 'marketing' as const, label: 'Marketing Emails' },
            ].map((n) => (
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                <span>{n.label}</span>
                <label style={{ position: 'relative', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications[n.key]} onChange={() => toggle(n.key)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: notifications[n.key] ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '12px', transition: '0.3s' }}></span>
                  <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications[n.key] ? '24px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" disabled title="Notification preference API is not configured">Save Notification Preferences</button>
      </div>

      {/* SMS & Webhook Config */}
      <div className="settings-section">
        <h3 className="section-title">SMS Configuration</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>SMS alerts are unavailable until an SMS provider is connected.</p>
        <div className="form-group"><label>SMS Provider</label><select disabled defaultValue=""><option value="">Not configured</option></select></div>
        <div className="form-group"><label>Phone Number</label><input type="tel" disabled placeholder="Unavailable until SMS provider is configured" /></div>
        <div style={{ display: 'flex', gap: '1rem' }}><button className="btn btn-primary btn-sm" disabled>Test SMS</button><button className="btn btn-outline btn-sm" disabled>Save Configuration</button></div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Webhook Configuration</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Webhook delivery is unavailable until webhook storage and delivery endpoints are connected.</p>
        <div className="form-group"><label>Webhook URL</label><input type="url" disabled placeholder="Unavailable until webhook provider is configured" /></div>
        <div className="form-group"><label>Webhook Secret</label><input type="text" disabled placeholder="Not configured" /></div>
        <div style={{ display: 'flex', gap: '1rem' }}><button className="btn btn-primary btn-sm" disabled>Test Webhook</button><button className="btn btn-outline btn-sm" disabled>Save Configuration</button></div>
      </div>

      {/* API Management */}
      <div className="settings-section">
        <h3 className="section-title">API Management <span style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>(Enterprise Only)</span></h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>Enterprise Feature</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>API access requires an Enterprise plan. Upgrade to get full API access with dedicated endpoints.</p>
            <div style={{ display: 'flex', gap: '1rem' }}><button className="btn btn-primary" disabled>Contact Enterprise</button><button className="btn btn-outline" disabled>Upgrade to Enterprise</button></div>
          </div>
          <div style={{ padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '1rem' }}>API Keys</h4>
            <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
              API keys are unavailable until API key management is implemented.
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      <Modal isOpen={show2FA} onClose={() => setShow2FA(false)} title="Configure Two-Factor Authentication" maxWidth="500px">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '150px', height: '150px', background: 'var(--bg-tertiary)', margin: '0 auto 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--accent-primary)' }}>
            <i className="fas fa-lock"></i>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Two-factor authentication is unavailable until authenticator enrollment is implemented on the backend.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShow2FA(false)}>Close</button>
        </div>
      </Modal>
    </>
  );
}
