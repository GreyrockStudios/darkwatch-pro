import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { searchApi } from '../services/api';

interface SearchHit {
  id: string;
  value: string;
  type: string;
  source: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  data_types: string[];
  description: string;
  created_at: string;
}

const mockResults: Record<string, SearchHit[]> = {
  email: [
    { id: '1', value: 'admin@company.com', type: 'email', source: 'BreachDB-2024', severity: 'critical', data_types: ['email', 'password', 'name'], description: 'Found in major credential breach database (2M records)', created_at: '2024-12-15T10:30:00Z' },
    { id: '2', value: 'user@company.com', type: 'email', source: 'DarkNet-Forums', severity: 'high', data_types: ['email', 'username'], description: 'Appeared in dark web forum post', created_at: '2024-12-14T08:15:00Z' },
    { id: '3', value: 'dev@company.com', type: 'email', source: 'Paste-Sites', severity: 'medium', data_types: ['email', 'api_key'], description: 'Found in public paste site with API keys', created_at: '2024-12-13T14:22:00Z' },
  ],
  domain: [
    { id: '4', value: 'company.com', type: 'domain', source: 'DNS-Monitor', severity: 'high', data_types: ['domain', 'dns_records'], description: 'Suspicious DNS changes detected', created_at: '2024-12-15T12:00:00Z' },
    { id: '5', value: 'comp4ny.com', type: 'domain', source: 'Typosquat-DB', severity: 'critical', data_types: ['domain', 'phishing'], description: 'Known typosquat domain — active phishing kit detected', created_at: '2024-12-14T16:30:00Z' },
  ],
  username: [
    { id: '6', value: 'ceo_john', type: 'username', source: 'Credential-DB', severity: 'critical', data_types: ['username', 'password', 'email'], description: 'Found in credential breach dump', created_at: '2024-12-15T09:00:00Z' },
  ],
  ip: [
    { id: '7', value: '203.0.113.42', type: 'ip', source: 'Tor-Exit-Nodes', severity: 'high', data_types: ['ip', 'tor_exit_node'], description: 'IP found on Tor exit node list', created_at: '2024-12-15T11:00:00Z' },
  ],
};

export default function SearchPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);
  const credits = user?.credits ?? 500;
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('email');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchInfo, setSearchInfo] = useState<{ total: number; balance: number; took: number } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchApi.search(query, searchType);
      const apiResults = data.results || [];
      if (apiResults.length > 0) {
        // Real results from API — map them
        setResults(apiResults.map((r: { email?: string; domain?: string; username?: string; password?: string; breachName?: string; breachDate?: string; dataTypes?: string[]; severity?: string }, i: number) => ({
          id: String(i + 1),
          value: r.email || r.domain || r.username || query,
          type: searchType,
          source: r.breachName || 'BreachDB',
          severity: (r.severity as SearchHit['severity']) || 'medium',
          data_types: r.dataTypes || ['email'],
          description: `Found in ${r.breachName || 'breach database'}`,
          created_at: r.breachDate || new Date().toISOString(),
        })));
        setSearchInfo({ total: data.total || apiResults.length, balance: data.balance ?? credits - 1, took: data.took ?? 0.15 });
        addToast('info', `Search completed — ${data.total || apiResults.length} results`);
      } else {
        // No real results — use demo data
        const typeKey = searchType === 'phone' ? 'email' : searchType;
        const demoResults = mockResults[typeKey] || mockResults.email;
        setResults(demoResults);
        setSearchInfo({ total: demoResults.length, balance: data.balance ?? credits - 1, took: data.took ?? 0.15 });
        addToast('info', `Search completed — ${demoResults.length} demo results (no live data)`);
      }
    } catch {
      // Use mock data on error
      const typeKey = searchType === 'phone' ? 'email' : searchType;
      const demoResults = mockResults[typeKey] || mockResults.email;
      setResults(demoResults);
      setSearchInfo({ total: demoResults.length, balance: credits - 1, took: 0.15 });
      addToast('warning', 'Using demo results (API unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const severityBadge = (s: string) => {
    const map: Record<string, string> = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
    return map[s] || 'badge-medium';
  };

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-search"></i> Search</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      <div className="search-container">
        <div className="search-header">
          <h2 className="search-title">Intelligent Data Search</h2>
          <p className="search-subtitle">Search across 10+ billion compromised records with advanced filters</p>
        </div>
        <form className="search-form" onSubmit={handleSearch}>
          <input type="text" className="search-input" placeholder="Search emails, domains, usernames, passwords..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
            <option value="email">Email</option>
            <option value="domain">Domain</option>
            <option value="username">Username</option>
            <option value="ip">IP Address</option>
            <option value="phone">Phone</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Searching...' : <><i className="fas fa-search"></i> Search</>}</button>
        </form>

        <div className="search-options">
          <div className="option-group"><input type="checkbox" id="regex" /><label htmlFor="regex">Regex</label></div>
          <div className="option-group"><input type="checkbox" id="wildcard" /><label htmlFor="wildcard">Wildcard</label></div>
          <div className="option-group"><input type="checkbox" id="fuzzy" /><label htmlFor="fuzzy">Fuzzy Match</label></div>
          <div className="option-group"><input type="checkbox" id="dedupe" defaultChecked /><label htmlFor="dedupe">Deduplicate</label></div>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner"></div><p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Searching breach databases...</p></div>}

      {!loading && searchInfo && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1rem 1.5rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Found <strong style={{ color: 'var(--text-primary)' }}>{searchInfo.total}</strong> results</span>
          <span style={{ color: 'var(--text-secondary)' }}>Credits remaining: <strong style={{ color: 'var(--accent-primary)' }}>{searchInfo.balance}</strong> · Response time: <strong>{searchInfo.took}s</strong></span>
        </div>
      )}

      {!loading && searched && results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Search Results ({results.length})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Value</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Source</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Severity</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Data Types</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{r.value}</td>
                    <td style={{ padding: '0.75rem' }}>{r.source}</td>
                    <td style={{ padding: '0.75rem' }}><span className={`badge ${severityBadge(r.severity)}`}>{r.severity}</span></td>
                    <td style={{ padding: '0.75rem' }}>{r.data_types?.map((t) => <span key={t} className="badge" style={{ marginRight: '0.25rem', fontSize: '0.75rem' }}>{t}</span>)}</td>
                    <td style={{ padding: '0.75rem' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!searched && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <i className="fas fa-search" style={{ fontSize: '4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5, display: 'block' }}></i>
          <h3 style={{ marginBottom: '1rem' }}>Enter a search query to begin</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Search by email, domain, username, IP address, or phone number</p>
        </div>
      )}
    </>
  );
}