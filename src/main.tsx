import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA service worker for offline-first standalone app
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('ATTEND PWA Service Worker registered:', registration.scope)
      })
      .catch((error) => {
        console.warn('ATTEND PWA Service Worker registration failed:', error)
      })
  })
}
