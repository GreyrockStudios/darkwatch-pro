export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Enterprise Dark Web Intelligence</h1>
          <p>Protect your organization with AI-powered dark web monitoring. Detect compromised credentials, monitor threat actors, and respond to breaches in real-time with enterprise-grade security intelligence.</p>
          <div className="hero-buttons">
            <a href="/signup" className="btn btn-primary btn-lg">Start Free Trial</a>
            <a href="#demo" className="btn btn-outline btn-lg">Watch Demo</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="hero-stat-number">10B+</div><div className="hero-stat-label">Records Monitored</div></div>
            <div className="hero-stat"><div className="hero-stat-number">99.9%</div><div className="hero-stat-label">Detection Rate</div></div>
            <div className="hero-stat"><div className="hero-stat-number">24/7</div><div className="hero-stat-label">Real-time Monitoring</div></div>
            <div className="hero-stat"><div className="hero-stat-number">500+</div><div className="hero-stat-label">Enterprise Clients</div></div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <h2 className="section-title">Advanced Threat Intelligence Platform</h2>
          <p className="section-subtitle">Comprehensive dark web monitoring with AI-powered threat detection and real-time response capabilities</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-shield-alt"></i></div>
              <h3>Real-Time Threat Detection</h3>
              <p>Monitor your digital assets 24/7 with AI-powered breach detection. Get instant alerts when threats are detected.</p>
              <a href="#" className="btn btn-outline">Learn More <i className="fas fa-arrow-right"></i></a>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-search"></i></div>
              <h3>Intelligent Data Search</h3>
              <p>Search across 10+ billion compromised records with advanced AI algorithms and custom filters for precise threat hunting.</p>
              <a href="#" className="btn btn-outline">Learn More <i className="fas fa-arrow-right"></i></a>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-globe"></i></div>
              <h3>Domain Threat Intelligence</h3>
              <p>Comprehensive domain analysis including WHOIS history, subdomain enumeration, DNS monitoring, and threat attribution.</p>
              <a href="#" className="btn btn-outline">Learn More <i className="fas fa-arrow-right"></i></a>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-bell"></i></div>
              <h3>Smart Alert System</h3>
              <p>Intelligent notification routing with severity-based escalation, custom webhooks, and SIEM integration.</p>
              <a href="#" className="btn btn-outline">Learn More <i className="fas fa-arrow-right"></i></a>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-users"></i></div>
              <h3>Enterprise Team Management</h3>
              <p>Role-based access control, multi-tenant architecture, and centralized billing for security teams.</p>
              <a href="#" className="btn btn-outline">Learn More <i className="fas fa-arrow-right"></i></a>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-chart-bar"></i></div>
              <h3>Advanced Analytics & Reporting</h3>
              <p>Generate executive dashboards, compliance reports, and threat intelligence briefings with automated risk scoring.</p>
              <a href="#" className="btn btn-outline">Learn More <i className="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="container">
          <h2 className="section-title">Flexible Plans for Every Organization</h2>
          <p className="section-subtitle">Choose the right level of protection for your organization's threat intelligence needs</p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3 className="plan-name">Basic Threat Monitoring</h3>
              <p className="plan-description">Essential threat intelligence for small businesses and startups</p>
              <div className="plan-price">$250</div>
              <div className="plan-period">per month</div>
              <ul className="plan-features">
                <li>100 Email Searches Monthly</li>
                <li>5 Domain Monitoring Tasks</li>
                <li>5 Active Monitoring Tasks</li>
                <li>Email Alerts Only</li>
                <li>Basic Threat Reports</li>
                <li>Standard Support (8/5)</li>
                <li>Team Collaboration (3 users)</li>
                <li>Data Retention (6 months)</li>
              </ul>
              <a href="/signup?plan=basic" className="btn btn-outline btn-block">Start Free Trial</a>
            </div>
            <div className="pricing-card featured">
              <div className="plan-badge">Most Popular</div>
              <h3 className="plan-name">Advanced Threat Intelligence</h3>
              <p className="plan-description">Comprehensive threat intelligence for security-focused businesses</p>
              <div className="plan-price">$450</div>
              <div className="plan-period">per month</div>
              <ul className="plan-features">
                <li>300 Email Searches Monthly</li>
                <li>10 Domain Monitoring Tasks</li>
                <li>10 Active Monitoring Tasks</li>
                <li>Multi-channel Alert System</li>
                <li>Advanced Analytics & Reports</li>
                <li>WHOIS & Domain Intelligence</li>
                <li>Priority Support (24/7)</li>
                <li>Team Collaboration (10 users)</li>
                <li>SMS Notifications (Twilio)</li>
                <li>Data Retention (12 months)</li>
                <li>Compliance Reports (SOC 2, GDPR)</li>
              </ul>
              <a href="/signup?plan=advanced" className="btn btn-primary btn-block">Start Free Trial</a>
            </div>
            <div className="pricing-card">
              <h3 className="plan-name">Enterprise Security Platform</h3>
              <p className="plan-description">Custom threat intelligence solutions for large organizations</p>
              <div className="plan-price">Contact Us</div>
              <div className="plan-period">Custom Pricing</div>
              <ul className="plan-features">
                <li>Custom Email Search Limits</li>
                <li>Custom Domain Lookup Limits</li>
                <li>Unlimited Monitoring Tasks</li>
                <li>Custom Alert Integrations</li>
                <li>Executive Dashboards</li>
                <li>Full Threat Intelligence Suite</li>
                <li>Dedicated Security Engineer</li>
                <li>Full API Access & Management</li>
                <li>Unlimited Team Members</li>
                <li>Custom Integrations</li>
                <li>SLA Guarantee</li>
              </ul>
              <a href="/contact?plan=enterprise" className="btn btn-outline btn-block">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
