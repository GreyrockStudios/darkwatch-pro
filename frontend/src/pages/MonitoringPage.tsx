import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { monitorsApi } from '../services/api';
import { PageSkeleton } from '../components';
import type { Monitor } from '../types';

export default function MonitoringPage() {
  const user = useAppStore((s) => s.user);
  const credits = user?.credits ?? 1247;
  const addToast = useAppStore((s) => s.addToast);

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', value: '' });

  const loadMonitors = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await monitorsApi.list();
      const list = Array.isArray(data) ? data : [];
      setMonitors(list);
    } catch (err) {
      setMonitors([]);
      setLoadError(err instanceof Error ? err.message : 'Failed to load monitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMonitors(); }, [loadMonitors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.value) return;
    setCreating(true);
    try {
      const newMonitor = await monitorsApi.create({ name: form.name, type: form.type, value: form.value });
      setMonitors((prev) => [newMonitor, ...prev]);
      setForm({ name: '', type: 'email', value: '' });
      addToast('success', `Monitor "${form.name}" created successfully`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create monitor');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string | number, action: 'start' | 'pause') => {
    try {
      await (action === 'start' ? monitorsApi.start(String(id)) : monitorsApi.pause(String(id)));
      setMonitors((prev) => prev.map((m) => m.id == id ? { ...m, status: action === 'start' ? 'active' as const : 'paused' as const } : m));
      addToast('success', `Monitor ${action === 'start' ? 'resumed' : 'paused'}`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update monitor');
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await monitorsApi.delete(String(id));
      setMonitors((prev) => prev.filter((m) => m.id != id));
      addToast('success', 'Monitor deleted');
    } catch {
      addToast('error', 'Failed to delete monitor');
    }
  };

  const activeCount = monitors.filter((m) => m.status === 'active').length;
  const pausedCount = monitors.filter((m) => m.status === 'paused').length;
  const totalAlerts = monitors.reduce((sum, m) => sum + m.breach_count, 0);

  if (loading) return <PageSkeleton />;

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-shield-alt"></i> Monitoring</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{activeCount}</div><div className="stat-label">Active Monitors</div></div>
        <div className="stat-card"><div className="stat-number">{pausedCount}</div><div className="stat-label">Paused</div></div>
        <div className="stat-card"><div className="stat-number">{totalAlerts}</div><div className="stat-label">Total Alerts</div></div>
        <div className="stat-card"><div className="stat-number">99.2%</div><div className="stat-label">Uptime</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Add New Monitor</h2>
        </div>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group"><label>Monitor Name</label><input type="text" placeholder="e.g., Executive Email Watch" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} disabled={creating} /></div>
          <div className="form-group"><label>Monitor Type</label><select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} disabled={creating}><option value="email">Email Address</option><option value="domain">Domain</option><option value="username">Username</option><option value="ip">IP Address</option><option value="phone">Phone Number</option></select></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Query</label><input type="text" placeholder="Enter email, domain, or identifier to monitor" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} disabled={creating} /></div>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }} disabled={creating}>{creating ? 'Creating...' : 'Create Monitor'}</button>
        </form>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Active Monitors</h2><button className="btn btn-outline btn-sm">View All</button></div>
        {loadError ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block', color: 'var(--danger)' }}></i>
            <p style={{ marginBottom: '1rem' }}>{loadError}</p>
            <button className="btn btn-outline btn-sm" onClick={loadMonitors}>Retry</button>
          </div>
        ) : monitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <i className="fas fa-shield-alt" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
            <p>No monitors yet. Create your first monitor above.</p>
          </div>
        ) : (
          <div className="monitors-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {monitors.map((m) => (
            <div className="monitor-card" key={m.id}>
              <div className="monitor-header">
                <div><div className="monitor-title">{m.name}</div><span className={`badge badge-${m.type}`} style={{ marginBottom: '0.5rem' }}>{m.type}</span></div>
                <span className={`badge badge-${m.status === 'active' ? 'active' : m.status === 'paused' ? 'paused' : 'active'}`}>{m.status === 'active' ? 'Active' : m.status === 'paused' ? 'Paused' : m.status}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Monitoring: {m.value}</p>
              <div className="monitor-metrics">
                <div className="metric-item"><div className="metric-number">{m.breach_count}</div><div className="metric-label">Alerts</div></div>
                <div className="metric-item"><div className="metric-number">24h</div><div className="metric-label">Check Freq</div></div>
                <div className="metric-item"><div className="metric-number">99%</div><div className="metric-label">Uptime</div></div>
                <div className="metric-item"><div className="metric-number">30d</div><div className="metric-label">Retention</div></div>
              </div>
              <div className="monitor-actions">
                {m.status === 'paused' ? (
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggle(m.id, 'start')}>Resume</button>
                ) : (
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggle(m.id, 'pause')}>Pause</button>
                )}
                <button className="btn btn-sm" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => handleDelete(m.id)}>Delete</button>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
