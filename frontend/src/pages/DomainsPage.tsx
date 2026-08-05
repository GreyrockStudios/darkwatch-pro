import { useState } from 'react';

export default function DomainsPage() {
  const [domainInput, setDomainInput] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');
  const [providerRequested, setProviderRequested] = useState(false);

  const analyzeDomain = (domain: string) => {
    if (!domain.trim()) return;
    setCurrentDomain(domain.trim());
    setProviderRequested(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeDomain(domainInput);
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
          <button className="btn btn-outline btn-sm" disabled>Sample domains unavailable</button>
        </div>
      </div>

      {/* Domain Results */}
      {providerRequested && (
        <div className="domain-results" style={{ display: 'block', padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>{currentDomain}</h3>
          <span className="badge badge-paused" style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>Provider Required</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: 0 }}>
            Domain intelligence is unavailable until a WHOIS, DNS, and threat-intelligence provider is connected. No analysis was run.
          </p>
        </div>
      )}
    </>
  );
}
