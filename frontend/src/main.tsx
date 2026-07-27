import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import design system styles
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/landing.css';
import './styles/app.css';

// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);