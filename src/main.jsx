import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker. When a new version is deployed, reload once
// so the phone always runs the latest code.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw?.addEventListener('statechange', () => {
            if (sw.state === 'activated' && navigator.serviceWorker.controller) window.location.reload();
          });
        });
        // Check for a new version whenever the app comes back to the foreground.
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update());
      })
      .catch(() => {});
  });
}
