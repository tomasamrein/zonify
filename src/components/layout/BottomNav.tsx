import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal, X } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { getNavForRole } from './navConfig'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { perfil } = useAuthStore()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const all = getNavForRole(perfil?.rol)

  // If 5 or fewer items, show all. Otherwise show 4 + "Más"
  const showMore = all.length > 5
  const primary = showMore ? all.slice(0, 4) : all

  const isMoreActive = showMore && all.slice(4).some((n) => n.to === location.pathname)

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación principal"
      >
        <div className={cn('grid h-16', showMore ? 'grid-cols-5' : `grid-cols-${primary.length}`)}>
          {primary.map((item) => {
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

          {showMore && (
            <button
              onClick={() => setDrawerOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isMoreActive ? 'text-brand-600' : 'text-[var(--color-ink-muted)]',
              )}
            >
              <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
              <span className="leading-none">Más</span>
            </button>
          )}
        </div>
      </nav>

      {/* Drawer "Más" */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--color-surface)] rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <span className="font-semibold text-[var(--color-ink)]">Menú</span>
              <button onClick={() => setDrawerOpen(false)} className="text-[var(--color-ink-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {all.slice(4).map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-soft)]',
                    )}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                    <span className="leading-none text-center">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
