export default function AboutPage() {
  return (
    <>
      <section className="hero" style={{ padding: '120px 0 80px' }}>
        <div className="container">
          <h1>About DarkWatch Pro</h1>
          <p>Enterprise-grade dark web intelligence platform protecting organizations worldwide since 2024.</p>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <h2 className="section-title">Our Mission</h2>
          <div className="section-content" style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
            <p>DarkWatch Pro was founded with a singular mission: to make dark web intelligence accessible, actionable, and affordable for organizations of all sizes. We believe every business deserves enterprise-grade threat detection.</p>
            <p style={{ marginTop: '1rem' }}>Our team of cybersecurity experts, data scientists, and engineers work around the clock to monitor the dark web, deep web, and surface web for threats targeting your organization.</p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <h2 className="section-title">Our Team</h2>
          <div className="team-grid">
            {['Sarah Chen — CEO & Co-Founder', 'Marcus Webb — CTO & Co-Founder', 'Elena Rodriguez — Head of Research', 'David Kim — Head of Engineering'].map((name) => (
              <div className="team-member" key={name}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--border-color)', margin: '0 auto 1rem' }}></div>
                <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{name.split(' — ')[0]}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{name.split(' — ')[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <h2 className="section-title">By the Numbers</h2>
          <div className="stats-grid">
            <div className="stat-item"><div className="stat-number">10B+</div><div className="stat-label">Records Monitored</div></div>
            <div className="stat-item"><div className="stat-number">500+</div><div className="stat-label">Enterprise Clients</div></div>
            <div className="stat-item"><div className="stat-number">99.9%</div><div className="stat-label">Detection Rate</div></div>
            <div className="stat-item"><div className="stat-number">24/7</div><div className="stat-label">Monitoring</div></div>
          </div>
        </div>
      </section>
    </>
  );
}