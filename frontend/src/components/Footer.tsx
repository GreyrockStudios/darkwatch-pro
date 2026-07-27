export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          &copy; {new Date().getFullYear()} DarkWatch Pro. All rights reserved. |{' '}
          <a href="#privacy">Privacy Policy</a> |{' '}
          <a href="#terms">Terms of Service</a>
        </p>
      </div>
    </footer>
  );
}