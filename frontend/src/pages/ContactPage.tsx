export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <section className="hero" style={{ padding: '120px 0 80px' }}>
        <div className="container">
          <h1>Contact Us</h1>
          <p>Get in touch with our team for support, sales inquiries, or partnership opportunities.</p>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem', fontSize: '1.5rem' }}>Get in Touch</h3>
              <div className="contact-item">
                <i className="fas fa-envelope" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', marginRight: '1rem', width: '30px' }}></i>
                <div><h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Email</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>support@darkwatchpro.com</p></div>
              </div>
            </div>

            <form className="contact-form" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: '0.75rem' }}>Contact form unavailable</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Message delivery is not connected yet. Email support directly for now.</p>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" placeholder="Your name" disabled />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="your@email.com" disabled />
                </div>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select disabled>
                  <option>Unavailable</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea placeholder="Message delivery is not configured" rows={5} disabled></textarea>
              </div>
              <a href="mailto:support@darkwatchpro.com" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>Email Support</a>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
