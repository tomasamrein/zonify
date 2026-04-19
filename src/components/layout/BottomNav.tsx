import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { getNavForRole } from './navConfig'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { perfil } = useAuthStore()
  const items = getNavForRole(perfil?.rol).slice(0, 5)

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-[var(--color-ink-muted)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.primary ? (
                    <span
                      className={cn(
                        'w-11 h-11 -mt-5 rounded-2xl flex items-center justify-center shadow-[var(--shadow-card)] transition-transform active:scale-95',
                        isActive ? 'bg-brand-700 text-white' : 'bg-brand-600 text-white',
                      )}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </span>
                  ) : (
                    <Icon className={cn('w-5 h-5', isActive && 'scale-110')} strokeWidth={2} />
                  )}
                  <span className="leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
