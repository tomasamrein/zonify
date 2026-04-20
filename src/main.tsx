import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from '@/store/useAuthStore'

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
