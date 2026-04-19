import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { getNavForRole } from './navConfig'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { perfil, logout } = useAuthStore()
  const items = getNavForRole(perfil?.rol)

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2.5 border-b border-[var(--color-border)]">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          Z
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">Zonify</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Preventas</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]',
                )
              }
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={perfil?.nombre_completo ?? '?'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-ink)] truncate">
              {perfil?.nombre_completo}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] capitalize">{perfil?.rol}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            className="p-2 rounded-lg text-[var(--color-ink-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
