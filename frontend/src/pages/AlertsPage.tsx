import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { alertsApi } from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import type { Alert } from '../types';

export default function AlertsPage() {
  const addToast = useAppStore((s) => s.addToast);
  const user = useAppStore((s) => s.user);
  const credits = user?.credits ?? 500;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await alertsApi.list();
      const list = Array.isArray(data) ? data : [];
      setAlerts(list.map((a: Alert) => ({
          ...a,
          monitorName: a.monitor_name || (typeof a.monitor === 'object' && a.monitor ? a.monitor.name : 'Unknown Monitor') || 'Unknown Monitor',
          monitorType: typeof a.monitor === 'object' && a.monitor ? (a.monitor as { monitor_type?: string }).monitor_type || 'General' : 'General',
          monitorId: typeof a.monitor === 'object' && a.monitor ? String((a.monitor as { id?: string | number }).id || '') : String(a.monitor || ''),
      })));
    } catch (err) {
      setAlerts([]);
      setLoadError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType !== 'all') {
      if (filterType === 'critical' && alert.severity !== 'critical') return false;
      if (filterType === 'high' && alert.severity !== 'high') return false;
      if (filterType === 'medium' && alert.severity !== 'medium') return false;
      if (filterType === 'low' && alert.severity !== 'low') return false;
    }
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    new: alerts.filter((a) => a.status === 'new').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    investigating: alerts.filter((a) => a.status === 'investigating').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  const updateStatus = async (id: string | number, status: string) => {
    try {
      if (status === 'acknowledged') await alertsApi.acknowledge(String(id));
      else if (status === 'resolved') await alertsApi.resolve(String(id));
      else {
        addToast('error', 'Investigating alerts is not available from this view');
        return;
      }
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as Alert['status'] } : a)));
      addToast('success', `Alert marked as ${status}`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : `Failed to mark alert as ${status}`);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner"></div><p>Loading alerts...</p></div>;

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-bell"></i> Alerts</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Alerts</div>
          <div className="stat-detail">{stats.critical} Critical · {stats.high} High</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.new}</div>
          <div className="stat-label">New</div>
          <div className="stat-detail">Requires attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.acknowledged + stats.investigating}</div>
          <div className="stat-label">In Progress</div>
          <div className="stat-detail">{stats.acknowledged} Ack · {stats.investigating} Inv</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
          <div className="stat-detail">Closed alerts</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Alerts</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={loadAlerts}><i className="fas fa-sync-alt"></i> Refresh</button>
          </div>
        </div>

        {/* Alert Cards */}
        <div>
          {loadError ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block', color: 'var(--danger)' }}></i>
              <p style={{ marginBottom: '1rem' }}>{loadError}</p>
              <button className="btn btn-outline btn-sm" onClick={loadAlerts}>Retry</button>
            </div>
          ) : filteredAlerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <i className="fas fa-bell-slash" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
              {alerts.length === 0 ? 'No alerts yet.' : 'No alerts matching your filters.'}
            </div>
          )}
          {!loadError && filteredAlerts.map((alert) => (
            <div key={alert.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1rem', background: 'var(--bg-secondary)', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{alert.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500, border: '1px solid var(--border-color)' }}>
                      <i className="fas fa-shield-alt"></i> {alert.monitor_name || alert.monitorName || 'Monitor'}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{alert.source}</span>
                  </div>
                </div>
                <span className={`badge badge-${alert.severity}`} style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>{alert.description}</p>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><i className="fas fa-clock"></i> {new Date(alert.created_at).toLocaleString()}</span>
                  <span className={`badge badge-${alert.status === 'new' ? 'critical' : alert.status === 'acknowledged' ? 'high' : alert.status === 'investigating' ? 'medium' : 'active'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <i className="fas fa-circle" style={{ fontSize: '0.5rem' }}></i> {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedAlert(alert)}><i className="fas fa-eye"></i> View Details</button>
                {alert.status === 'new' && (
                  <button className="btn btn-outline btn-sm" onClick={() => updateStatus(alert.id, 'acknowledged')}><i className="fas fa-check"></i> Acknowledge</button>
                )}
                {(alert.status === 'new' || alert.status === 'acknowledged') && (
                  <button className="btn btn-outline btn-sm" onClick={() => updateStatus(alert.id, 'investigating')}><i className="fas fa-search"></i> Investigate</button>
                )}
                {alert.status !== 'resolved' && (
                  <button className="btn btn-outline btn-sm" onClick={() => updateStatus(alert.id, 'resolved')}><i className="fas fa-flag-checkered"></i> Resolve</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Modal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} title="Alert Details" maxWidth="700px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Severity</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}><span className={`badge badge-${selectedAlert.severity}`}>{selectedAlert.severity.toUpperCase()}</span></div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Status</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}><span className={`badge badge-${selectedAlert.status === 'new' ? 'critical' : selectedAlert.status === 'acknowledged' ? 'high' : selectedAlert.status === 'investigating' ? 'medium' : 'active'}`}>{selectedAlert.status.charAt(0).toUpperCase() + selectedAlert.status.slice(1)}</span></div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Monitor</div>
              <div style={{ fontSize: '1rem' }}>{selectedAlert.monitor_name || selectedAlert.monitorName || 'Unknown'}</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Source</div>
              <div style={{ fontSize: '1rem' }}>{selectedAlert.source}</div>
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Description</h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedAlert.description}</p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Timeline</h4>
            <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Detected</span>
                <span style={{ fontFamily: 'monospace' }}>{new Date(selectedAlert.created_at).toLocaleString()}</span>
              </div>
              {selectedAlert.resolved_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Resolved</span>
                  <span style={{ fontFamily: 'monospace' }}>{new Date(selectedAlert.resolved_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {selectedAlert.status === 'new' && (
              <button className="btn btn-outline btn-sm" onClick={() => { updateStatus(selectedAlert.id, 'acknowledged'); setSelectedAlert(null); }}>Acknowledge</button>
            )}
            {selectedAlert.status !== 'resolved' && (
              <button className="btn btn-primary btn-sm" onClick={() => { updateStatus(selectedAlert.id, 'resolved'); setSelectedAlert(null); }}>Resolve</button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
