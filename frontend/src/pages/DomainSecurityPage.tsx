export default function DomainSecurityPage() {
  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-lock"></i> Domain Security</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>1,247</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      <div className="domain-lookup" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem', border: '2px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Domain Security Assessment</h3>
        <form style={{ display: 'flex', gap: '1rem' }} onSubmit={(e) => e.preventDefault()}>
          <input type="text" className="lookup-input" placeholder="Provider required before domains can be analyzed" disabled style={{ flex: 1, padding: '1rem', border: '2px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '1rem' }} />
          <button type="submit" className="btn btn-primary" disabled>Analyze</button>
        </form>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <i className="fas fa-shield-alt" style={{ fontSize: '4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5, display: 'block' }}></i>
        <h3 style={{ marginBottom: '1rem' }}>Domain security assessment unavailable</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Connect security-header, DNS, and certificate providers before assessments can run.</p>
      </div>
    </>
  );
}
