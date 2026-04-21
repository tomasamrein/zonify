import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { useAuthStore } from '@/store/useAuthStore'
import { getNavForRole } from './navConfig'
import { DevRoleSwitcher } from '@/components/DevRoleSwitcher'
import { useSwipeNav } from '@/hooks/useSwipeNav'
import { usePlan } from '@/hooks/usePlan'
import { useNotificaciones } from '@/hooks/useNotificaciones'

export function AppLayout() {
  const { perfil } = useAuthStore()
  const { tieneModulo, plan } = usePlan()
  useNotificaciones()
  const location = useLocation()
  const PLAN_ORDEN: Record<string, number> = { starter: 0, pro: 1, enterprise: 2 }
  const allNav = getNavForRole(perfil?.rol)
  const nav = allNav.filter((item) => {
    if (item.modulo && !tieneModulo(item.modulo)) return false
    if (item.planMinimo && (PLAN_ORDEN[plan] ?? 0) < (PLAN_ORDEN[item.planMinimo] ?? 0)) return false
    return true
  })
  const current = nav.find((n) => n.to === location.pathname)
  const title = current?.label ?? 'Zonify'
  const { onTouchStart, onTouchEnd } = useSwipeNav(nav)

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-muted)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main
          className="flex-1 px-4 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Outlet />
        </main>
        <BottomNav />
      </div>
      {import.meta.env.DEV && <DevRoleSwitcher />}
    </div>
  )
}
