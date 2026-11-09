import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA compliance (Mobile & Tablet Kiosk)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker terdaftar dengan scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA Service Worker gagal didaftarkan:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

