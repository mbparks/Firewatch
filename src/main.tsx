import React from 'react';
import ReactDOM from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './app.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
);
