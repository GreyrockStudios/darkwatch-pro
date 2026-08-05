export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          &copy; {new Date().getFullYear()} DarkWatch Pro. All rights reserved. |{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Privacy Policy unavailable</span> |{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Terms unavailable</span>
        </p>
      </div>
    </footer>
  );
}
