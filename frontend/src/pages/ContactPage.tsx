import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
              <div className="contact-item">
                <i className="fas fa-phone" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', marginRight: '1rem', width: '30px' }}></i>
                <div><h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Phone</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>+1 (555) 123-4567</p></div>
              </div>
              <div className="contact-item">
                <i className="fas fa-map-marker-alt" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', marginRight: '1rem', width: '30px' }}></i>
                <div><h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Office</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>123 Security Ave, San Francisco, CA</p></div>
              </div>
            </div>

            {submitted ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '1rem' }}></i>
                <h3 style={{ marginBottom: '1rem' }}>Message Sent!</h3>
                <p style={{ color: 'var(--text-secondary)' }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form className="contact-form" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input type="text" placeholder="Your name" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select>
                    <option>General Inquiry</option>
                    <option>Sales</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea placeholder="How can we help?" rows={5}></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}