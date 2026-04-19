import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { useAuthStore } from '@/store/useAuthStore'
import { getNavForRole } from './navConfig'
import { DevRoleSwitcher } from '@/components/DevRoleSwitcher'

export function AppLayout() {
  const { perfil } = useAuthStore()
  const location = useLocation()
  const nav = getNavForRole(perfil?.rol)
  const current = nav.find((n) => n.to === location.pathname)
  const title = current?.label ?? 'Zonify'

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-muted)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 px-4 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      {import.meta.env.DEV && <DevRoleSwitcher />}
    </div>
  )
}
