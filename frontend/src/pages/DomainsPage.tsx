import { useState } from 'react';

interface DomainData {
  status: string;
  whois: { registrar: string; creationDate: string; expirationDate: string; status: string };
  dns: { aRecord: string; mxRecords: string; nsRecords: string; txtRecords: string };
  security: { ssl: string; dnssec: string; spf: string; dmarc: string };
  threats: { type: string; description: string; severity: string }[];
  subdomains: { name: string; status: string }[];
}

const domainDatabase: Record<string, DomainData> = {
  'example.com': {
    status: 'Safe',
    whois: { registrar: 'Example Registrar', creationDate: '2020-01-15', expirationDate: '2025-01-15', status: 'Active' },
    dns: { aRecord: '93.184.216.34', mxRecords: 'mail.example.com', nsRecords: 'ns1.example.com', txtRecords: 'v=spf1 include:_spf.example.com' },
    security: { ssl: 'Valid', dnssec: 'Enabled', spf: 'Present', dmarc: 'Configured' },
    threats: [
      { type: 'Phishing Detection', description: 'Domain has been flagged in phishing campaigns', severity: 'medium' },
      { type: 'Malware Distribution', description: 'Associated with malware distribution networks', severity: 'low' },
    ],
    subdomains: [
      { name: 'www.example.com', status: 'Active' },
      { name: 'mail.example.com', status: 'Active' },
      { name: 'api.example.com', status: 'Active' },
      { name: 'admin.example.com', status: 'Inactive' },
      { name: 'test.example.com', status: 'Active' },
      { name: 'dev.example.com', status: 'Active' },
    ],
  },
  'google.com': {
    status: 'Safe',
    whois: { registrar: 'MarkMonitor Inc.', creationDate: '1997-09-15', expirationDate: '2028-09-13', status: 'Active' },
    dns: { aRecord: '142.250.191.78', mxRecords: 'aspmx.l.google.com', nsRecords: 'ns1.google.com', txtRecords: 'v=spf1 include:_spf.google.com' },
    security: { ssl: 'Valid', dnssec: 'Enabled', spf: 'Present', dmarc: 'Configured' },
    threats: [],
    subdomains: [
      { name: 'www.google.com', status: 'Active' },
      { name: 'mail.google.com', status: 'Active' },
      { name: 'drive.google.com', status: 'Active' },
      { name: 'docs.google.com', status: 'Active' },
    ],
  },
  'microsoft.com': {
    status: 'Warning',
    whois: { registrar: 'MarkMonitor Inc.', creationDate: '1991-05-02', expirationDate: '2025-05-03', status: 'Active' },
    dns: { aRecord: '20.112.52.29', mxRecords: 'microsoft-com.mail.protection.outlook.com', nsRecords: 'ns1.msft.net', txtRecords: 'v=spf1 include:spf.protection.outlook.com' },
    security: { ssl: 'Valid', dnssec: 'Enabled', spf: 'Present', dmarc: 'Configured' },
    threats: [{ type: 'Brand Impersonation', description: 'Multiple lookalike domains detected', severity: 'high' }],
    subdomains: [
      { name: 'www.microsoft.com', status: 'Active' },
      { name: 'office.microsoft.com', status: 'Active' },
      { name: 'azure.microsoft.com', status: 'Active' },
      { name: 'support.microsoft.com', status: 'Active' },
    ],
  },
};

export default function DomainsPage() {
  const [domainInput, setDomainInput] = useState('');
  const [results, setResults] = useState<DomainData | null>(null);
  const [currentDomain, setCurrentDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzeDomain = (domain: string) => {
    if (!domain.trim()) return;
    setLoading(true);
    setCurrentDomain(domain);
    // Simulate API call delay
    setTimeout(() => {
      const data = domainDatabase[domain] || {
        status: 'Unknown',
        whois: { registrar: 'Unknown', creationDate: 'Unknown', expirationDate: 'Unknown', status: 'Unknown' },
        dns: { aRecord: 'Unknown', mxRecords: 'Unknown', nsRecords: 'Unknown', txtRecords: 'Unknown' },
        security: { ssl: 'Unknown', dnssec: 'Unknown', spf: 'Unknown', dmarc: 'Unknown' },
        threats: [],
        subdomains: [],
      };
      setResults(data);
      setLoading(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeDomain(domainInput);
  };

  const statusClass = (status: string) => {
    if (status === 'Safe') return 'badge-active';
    if (status === 'Warning') return 'badge-high';
    return 'badge-critical';
  };

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-globe"></i> Domain Intelligence</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>1,247</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      {/* Domain Lookup */}
      <div className="lookup-container">
        <h2 style={{ marginBottom: '1.5rem' }}>Domain Threat Intelligence</h2>
        <form className="lookup-form" onSubmit={handleSubmit}>
          <input type="text" className="lookup-input" placeholder="Enter domain (e.g., example.com)" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} required />
          <button type="submit" className="btn btn-primary">Analyze Domain</button>
        </form>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setDomainInput('example.com'); analyzeDomain('example.com'); }}>example.com</button>
          <button className="btn btn-outline btn-sm" onClick={() => { setDomainInput('google.com'); analyzeDomain('google.com'); }}>google.com</button>
          <button className="btn btn-outline btn-sm" onClick={() => { setDomainInput('microsoft.com'); analyzeDomain('microsoft.com'); }}>microsoft.com</button>
        </div>
      </div>

      {/* Domain Results */}
      {loading && (
        <div className="domain-results" style={{ display: 'block', textAlign: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing domain...</p>
        </div>
      )}

      {results && !loading && (
        <div className="domain-results" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{currentDomain}</div>
            <span className={`badge ${statusClass(results.status)}`} style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>{results.status}</span>
          </div>

          {/* Info Grid */}
          <div className="info-grid">
            <div className="info-card">
              <h4>WHOIS Information</h4>
              <div className="info-item"><span className="info-label">Registrar</span><span className="info-value">{results.whois.registrar}</span></div>
              <div className="info-item"><span className="info-label">Creation Date</span><span className="info-value">{results.whois.creationDate}</span></div>
              <div className="info-item"><span className="info-label">Expiration Date</span><span className="info-value">{results.whois.expirationDate}</span></div>
              <div className="info-item"><span className="info-label">Status</span><span className="info-value">{results.whois.status}</span></div>
            </div>
            <div className="info-card">
              <h4>DNS Information</h4>
              <div className="info-item"><span className="info-label">A Record</span><span className="info-value">{results.dns.aRecord}</span></div>
              <div className="info-item"><span className="info-label">MX Records</span><span className="info-value">{results.dns.mxRecords}</span></div>
              <div className="info-item"><span className="info-label">NS Records</span><span className="info-value">{results.dns.nsRecords}</span></div>
              <div className="info-item"><span className="info-label">TXT Records</span><span className="info-value">{results.dns.txtRecords}</span></div>
            </div>
            <div className="info-card">
              <h4>Security Analysis</h4>
              <div className="info-item"><span className="info-label">SSL Certificate</span><span className="info-value">{results.security.ssl}</span></div>
              <div className="info-item"><span className="info-label">DNSSEC</span><span className="info-value">{results.security.dnssec}</span></div>
              <div className="info-item"><span className="info-label">SPF Record</span><span className="info-value">{results.security.spf}</span></div>
              <div className="info-item"><span className="info-label">DMARC</span><span className="info-value">{results.security.dmarc}</span></div>
            </div>
          </div>

          {/* Threat Analysis */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Threat Intelligence</h4>
            {results.threats.length === 0 ? (
              <p style={{ color: 'var(--accent-primary)' }}>No threats detected for this domain.</p>
            ) : (
              results.threats.map((threat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                  <div>
                    <h5 style={{ marginBottom: '0.25rem' }}>{threat.type}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{threat.description}</p>
                  </div>
                  <span className={`badge badge-${threat.severity}`} style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{threat.severity.toUpperCase()}</span>
                </div>
              ))
            )}
          </div>

          {/* Subdomain Discovery */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Subdomain Discovery</h4>
            {results.subdomains.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No subdomains discovered.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {results.subdomains.map((sub, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{sub.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sub.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}