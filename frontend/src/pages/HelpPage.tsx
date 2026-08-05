import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { supportApi } from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import type { Ticket } from '../types';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: Record<string, FAQItem[]> = {
  'getting-started': [
    { question: 'How do I start using DarkWatch Pro?', answer: 'Welcome to DarkWatch Pro! To get started: 1) Complete your profile in Settings, 2) Set up your first domain monitoring, 3) Configure alert preferences, 4) Start searching for compromised data.' },
    { question: 'What are credits and how do they work?', answer: 'Credits are the currency used for searches and API calls. Each search costs 1 credit. Your plan includes a monthly allocation of credits. Additional credits can be purchased as needed.' },
    { question: 'How do I set up my first monitor?', answer: 'Go to the Monitoring page, click "Add Monitor", select the type (Email, Domain, Username, IP, Phone), enter the value you want to monitor, and configure alert preferences. The monitor will begin scanning immediately.' },
  ],
  'search-guide': [
    { question: 'How do I perform a basic search?', answer: 'Navigate to the Search page, enter your query in the search bar, select the data types you want to search (email, password, username, etc.), and click Search. Results will appear below with detailed information.' },
    { question: 'What search operators are available?', answer: 'You can use: exact match (quotes), wildcard (*), regex patterns, AND/OR operators. Example: "john.doe@company.com" for exact match, john* for wildcard.' },
    { question: 'How are search results displayed?', answer: 'Results show email, username, password (if available), breach source, and data types. Each result includes a severity rating and recommended actions.' },
  ],
  'monitoring': [
    { question: 'What types of monitors can I set up?', answer: 'DarkWatch Pro supports: Email Monitoring (track email addresses across breaches), Domain Monitoring (track domain changes and subdomains), Username Monitoring (track username appearances), IP Monitoring (track IP addresses), Phone Monitoring (track phone numbers).' },
    { question: 'How often do monitors check for new breaches?', answer: 'Monitors check every 15 minutes for new breach data. Critical alerts are sent immediately, while lower priority alerts are batched and sent hourly.' },
    { question: 'Can I pause or disable a monitor?', answer: 'Yes! Go to the Monitoring page, find the monitor you want to pause, and click the pause button. You can resume it at any time. Paused monitors do not consume credits.' },
  ],
  'alerts': [
    { question: 'How are alert severities determined?', answer: 'Critical: Immediate breach with plaintext passwords. High: Credential compromise with hashed passwords. Medium: Data exposure without direct credential threat. Low: Minor information disclosure or monitoring update.' },
    { question: 'Can I customize alert notifications?', answer: 'Yes! Go to Settings > Notification Preferences to configure email, SMS, and webhook notifications for each severity level.' },
    { question: 'How do I acknowledge or resolve alerts?', answer: 'Click on an alert to view details, then use the action buttons: Acknowledge (mark as seen), Investigate (mark as being reviewed), or Resolve (mark as handled).' },
  ],
  'billing': [
    { question: 'What plans are available?', answer: 'Basic ($49/mo): 500 searches, 5 monitors. Advanced ($149/mo): 2,000 searches, 25 monitors. Enterprise ($299/mo): Unlimited searches, unlimited monitors, API access, team collaboration.' },
    { question: 'How do I cancel my subscription?', answer: 'Go to Billing > Change Plan and select "Cancel". Your access will continue until the end of your current billing period. No refunds for partial months.' },
    { question: 'Can I get a refund?', answer: 'We offer a 30-day money-back guarantee for new subscriptions. After that, no refunds for partial months. Contact support for special circumstances.' },
  ],
  'api': [
    { question: 'How do I access the API?', answer: 'API access is available on Enterprise plans. Go to Settings > API Management to generate API keys. Full documentation is available at docs.darkwatch.pro/api.' },
    { question: 'What are the API rate limits?', answer: 'Enterprise plan: 100 requests/minute, 10,000 requests/day. Rate limit headers are included in responses: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.' },
    { question: 'What authentication method does the API use?', answer: 'The API uses Bearer token authentication. Include your API key in the Authorization header: Authorization: Bearer dw_live_xxxxxxxx' },
  ],
};

export default function HelpPage() {
  const addToast = useAppStore((s) => s.addToast);
  const user = useAppStore((s) => s.user);
  const credits = user?.credits ?? 1247;
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const data = await supportApi.listTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setTickets([]);
      setTicketsError(err instanceof Error ? err.message : 'Failed to load support tickets');
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newTicket = await supportApi.createTicket(ticketForm);
      setTickets((prev) => [newTicket, ...prev]);
      setShowCreateTicket(false);
      setTicketForm({ subject: '', description: '', priority: 'medium' });
      addToast('success', 'Support ticket created');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFAQ = (key: string) => {
    setOpenFAQ(openFAQ === key ? null : key);
  };

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-question-circle"></i> Help & Support</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '2rem', border: '1px solid var(--border-color)', marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>How can we help you?</h2>
        <div style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          <input type="text" className="search-input" placeholder="Search for help topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary"><i className="fas fa-search"></i></button>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: 'fa-rocket', label: 'Getting Started', id: 'getting-started' },
          { icon: 'fa-search', label: 'Search Guide', id: 'search-guide' },
          { icon: 'fa-shield-alt', label: 'Monitoring', id: 'monitoring' },
          { icon: 'fa-bell', label: 'Alerts', id: 'alerts' },
          { icon: 'fa-credit-card', label: 'Billing', id: 'billing' },
          { icon: 'fa-code', label: 'API Docs', id: 'api' },
          { icon: 'fa-ticket-alt', label: 'Support Tickets', id: 'tickets' },
        ].map((link) => (
          <a key={link.id} href={`#${link.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <i className={`fas ${link.icon}`} style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}></i>
            <span>{link.label}</span>
          </a>
        ))}
      </div>

      {/* FAQ Sections */}
      {Object.entries(faqData).map(([section, items]) => (
        <div key={section} className="card" id={section}>
          <div className="card-header">
            <h3 className="card-title">{section.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
          </div>
          {items.map((faq, i) => {
            const key = `${section}-${i}`;
            return (
              <div key={key} style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                <button onClick={() => toggleFAQ(key)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, textAlign: 'left' }}>
                  {faq.question}
                  <i className={`fas fa-chevron-down`} style={{ transition: 'transform 0.3s', transform: openFAQ === key ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
                </button>
                {openFAQ === key && (
                  <div style={{ padding: '0 1rem 1rem', color: 'var(--text-secondary)' }}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Support Tickets */}
      <div className="card" id="tickets">
        <div className="card-header">
          <h3 className="card-title">Support Tickets</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={loadTickets} disabled={ticketsLoading}><i className="fas fa-sync-alt"></i> Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTicket(true)}><i className="fas fa-plus"></i> Create Ticket</button>
          </div>
        </div>
        {ticketsLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div className="spinner"></div>
            <p>Loading support tickets...</p>
          </div>
        ) : ticketsError ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: 'var(--danger)', marginBottom: '1rem', display: 'block' }}></i>
            <h4>Unable to load support tickets</h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{ticketsError}</p>
            <button className="btn btn-outline btn-sm" onClick={loadTickets}>Retry</button>
          </div>
        ) : tickets.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Ticket</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Subject</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Priority</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <td style={{ padding: '0.75rem' }}>{t.id}</td>
                  <td style={{ padding: '0.75rem' }}>{t.subject}</td>
                  <td style={{ padding: '0.75rem' }}><span className={`badge badge-${t.status === 'in_progress' ? 'high' : t.status === 'resolved' ? 'active' : 'medium'}`}>{t.status.replace('_', ' ')}</span></td>
                  <td style={{ padding: '0.75rem' }}><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                  <td style={{ padding: '0.75rem' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <h4>No support tickets yet</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Create a ticket if you need help with anything.</p>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Still need help?</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { icon: 'fa-envelope', title: 'Email Support', desc: 'support@darkwatch.pro', btn: 'Send Email' },
            { icon: 'fa-comments', title: 'Live Chat', desc: 'Available 9am-5pm EST', btn: 'Start Chat' },
            { icon: 'fa-phone', title: 'Phone Support', desc: '+1 (555) 123-4567', btn: 'Call Now' },
            { icon: 'fa-book', title: 'Documentation', desc: 'Comprehensive guides', btn: 'View Docs' },
          ].map((c) => (
            <div key={c.title} style={{ padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <i className={`fas ${c.icon}`} style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', display: 'block' }}></i>
              <h4 style={{ marginBottom: '0.25rem' }}>{c.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{c.desc}</p>
              <button className={`btn ${c.title === 'Documentation' ? 'btn-outline' : 'btn-primary'} btn-sm`}>{c.btn}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal isOpen={showCreateTicket} onClose={() => setShowCreateTicket(false)} title="Create Support Ticket" maxWidth="600px">
        <form onSubmit={handleCreateTicket}>
          <div className="form-group"><label>Subject</label><input type="text" placeholder="Brief description of your issue" value={ticketForm.subject} onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))} required disabled={submitting} /></div>
          <div className="form-group"><label>Priority</label>
            <select value={ticketForm.priority} onChange={(e) => setTicketForm((p) => ({ ...p, priority: e.target.value }))} disabled={submitting}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
          </div>
          <div className="form-group"><label>Description</label><textarea placeholder="Please describe your issue in detail..." style={{ minHeight: '150px' }} value={ticketForm.description} onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))} required disabled={submitting}></textarea></div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowCreateTicket(false)} style={{ flex: 1 }} disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
