import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from '@/store/useAuthStore'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  })
}

useAuthStore.getState().inicializar()

registerSW({
  onOfflineReady() {
    toast('Zonify listo para usar sin conexión', { icon: '📦', duration: 4000 })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="bottom-center" />
  </StrictMode>,
)
