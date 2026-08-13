import React from 'react';
import ReactDOM from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './app.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', document.baseURI);
    navigator.serviceWorker.register(swUrl.href).catch((error)=>console.warn('FIREWATCH service worker registration failed', error));
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('FIREWATCH startup failed: #root was not found');

try {
  ReactDOM.createRoot(root).render(
    <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
  );
  (window as typeof window & { __FIREWATCH_BOOTED__?: boolean }).__FIREWATCH_BOOTED__ = true;
} catch (error) {
  console.error('FIREWATCH startup failure', error);
  const message = error instanceof Error ? error.message : String(error);
  root.innerHTML = `<div class="fatal-boot"><strong>FIREWATCH STARTUP ERROR</strong><p>${message.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c] || c))}</p><small>Open the browser console for details. Local station data has not been cleared.</small></div>`;
}
