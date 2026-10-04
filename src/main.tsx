import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {!isLocalHost && <Analytics />}
  </StrictMode>,
)

// Register PWA service worker for offline-first standalone app
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.warn('ATTEND PWA Service Worker registration failed:', error)
      })
  })
}
