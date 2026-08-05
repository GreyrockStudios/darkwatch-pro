import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { monitorsApi, alertsApi, billingApi } from '../services/api';

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const credits = user?.credits ?? 0;
  const navigate = useNavigate();

  const [stats, setStats] = useState<{ monitors: number; alerts: number; searches: number; score: number | null }>({ monitors: 0, alerts: 0, searches: 0, score: null });
  const [activities, setActivities] = useState<Array<{ icon: string; iconBg: string; iconColor: string; title: string; desc: string; time: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [monitorsRes, alertsRes, usageRes] = await Promise.allSettled([
          monitorsApi.list(),
          alertsApi.list(),
          billingApi.usage(),
        ]);

        const monitors = monitorsRes.status === 'fulfilled' ? monitorsRes.value : [];
        const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value : [];
        const searches = usageRes.status === 'fulfilled' ? usageRes.value.email_searches.used : 0;

        const activeMonitors = monitors.filter((m: { status?: string }) => m.status === 'active').length;
        const newAlerts = alerts.filter((a: { status?: string }) => a.status === 'new' || a.status === 'investigating').length;

        setStats({
          monitors: activeMonitors,
          alerts: newAlerts,
          searches,
          score: null,
        });

        // Build activity list from real data
        const acts: typeof activities = [];
        alerts.slice(0, 3).forEach((a: { severity?: string; title?: string; created_at?: string; description?: string }) => {
          acts.push({
            icon: 'fas fa-exclamation-triangle',
            iconBg: 'rgba(255,107,107,0.2)',
            iconColor: a.severity === 'critical' ? '#ff4444' : a.severity === 'high' ? '#ff8800' : '#ffcc00',
            title: a.title || 'Breach Alert',
            desc: a.description || `Severity: ${a.severity}`,
            time: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent',
          });
        });
        monitors.slice(0, 2).forEach((m: { name?: string; created_at?: string }) => {
          acts.push({
            icon: 'fas fa-plus',
            iconBg: 'rgba(111,66,193,0.2)',
            iconColor: 'var(--accent-primary)',
            title: 'Monitor Added',
            desc: m.name || 'New monitor',
            time: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent',
          });
        });

        if (acts.length === 0) {
          acts.push(
            { icon: 'fas fa-shield-alt', iconBg: 'rgba(0,204,255,0.2)', iconColor: 'var(--info)', title: 'Welcome to DarkWatch Pro', desc: 'Start by adding monitors or running a search', time: 'Now' },
          );
        }
        setActivities(acts);
      } catch {
        setActivities([
          { icon: 'fas fa-shield-alt', iconBg: 'rgba(0,204,255,0.2)', iconColor: 'var(--info)', title: 'Welcome to DarkWatch Pro', desc: 'Start by adding monitors or running a search', time: 'Now' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const [quickSearch, setQuickSearch] = useState('');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner"></div><p>Loading dashboard...</p></div>;

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-tachometer-alt"></i> Dashboard</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{stats.monitors}</div><div className="stat-label">Active Monitors</div></div>
        <div className="stat-card"><div className="stat-number">{stats.alerts}</div><div className="stat-label">Breach Alerts</div></div>
        <div className="stat-card"><div className="stat-number">{stats.searches}</div><div className="stat-label">Searches This Month</div></div>
        <div className="stat-card"><div className="stat-number">{stats.score === null ? '—' : `${stats.score}%`}</div><div className="stat-label">Security Score</div></div>
      </div>

      <div className="dashboard-grid">
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <div className="card-header"><h2 className="card-title">Quick Search</h2></div>
          <form onSubmit={handleQuickSearch} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
            <input type="text" className="search-input" placeholder="Search emails, domains, usernames, passwords..." value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Activity</h3><a href="/alerts" className="btn btn-outline btn-sm">View All</a></div>
          <ul className="activity-list">
            {activities.map((activity, i) => (
              <li key={i} className="activity-item">
                <div className="activity-icon" style={{ background: activity.iconBg, color: activity.iconColor }}><i className={activity.icon}></i></div>
                <div className="activity-content"><h4>{activity.title}</h4><p>{activity.desc}</p><div className="activity-time">{activity.time}</div></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
