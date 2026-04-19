import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Bell } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { perfil, empresa } = useAuthStore()
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="sticky top-0 z-20 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile logo / title */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            Z
          </div>
          <div className="flex flex-col leading-tight">
            <p className="text-base font-semibold leading-none">{title ?? 'Zonify'}</p>
            {empresa && (
              <span className="text-[11px] text-[var(--color-ink-muted)] leading-none mt-0.5">{empresa.nombre}</span>
            )}
          </div>
        </div>

        {/* Desktop title */}
        <div className="hidden lg:flex flex-col leading-tight">
          <h1 className="text-lg font-semibold text-[var(--color-ink)] leading-none">{title}</h1>
          {empresa && (
            <span className="text-xs text-[var(--color-ink-muted)] leading-none mt-0.5">{empresa.nombre}</span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
              online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
            )}
            role="status"
            aria-live="polite"
            title={online ? 'Conectado' : 'Sin conexión'}
          >
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
          </div>

          <button
            aria-label="Notificaciones"
            className="p-2 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)] transition-colors relative"
          >
            <Bell className="w-5 h-5" />
          </button>

          <div className="lg:hidden">
            <Avatar name={perfil?.nombre_completo ?? '?'} size="sm" />
          </div>
        </div>
      </div>
    </header>
  )
}
