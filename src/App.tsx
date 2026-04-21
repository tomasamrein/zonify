import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import LandingPage from '@/pages/LandingPage'
import RegistroPage from '@/pages/RegistroPage'
import DashboardPage from '@/pages/DashboardPage'
import MiRutaPage from '@/pages/MiRutaPage'
import NuevaVentaPage from '@/pages/NuevaVentaPage'
import MisPedidosPage from '@/pages/MisPedidosPage'
import ClientesPage from '@/pages/ClientesPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import { Warehouse } from 'lucide-react'
import FacturacionPage from '@/pages/FacturacionPage'
import AdminProductosPage from '@/pages/admin/ProductosPage'
import AdminClientesPage from '@/pages/admin/ClientesPage'
import AdminZonasPage from '@/pages/admin/ZonasPage'
import AdminUsuariosPage from '@/pages/admin/UsuariosPage'
import AdminPreciosPage from '@/pages/admin/PreciosPage'
import SuscripcionPage from '@/pages/admin/SuscripcionPage'
import CobrosAdminPage from '@/pages/admin/CobrosAdminPage'
import StockPage from '@/pages/admin/StockPage'
import ReportesPage from '@/pages/ReportesPage'
import CobrosPage from '@/pages/CobrosPage'
import RendicionPage from '@/pages/RendicionPage'
import EntregasPage from '@/pages/EntregasPage'
import PreparacionPage from '@/pages/deposito/PreparacionPage'
import AprobacionPedidosPage from '@/pages/admin/AprobacionPedidosPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ModuloBloqueado } from '@/components/ui/ModuloBloqueado'
import { usePlan } from '@/hooks/usePlan'
import type { Modulo } from '@/lib/planesConfig'
import { SuperadminGuard } from '@/pages/superadmin/SuperadminGuard'
import { SuperadminLayout } from '@/pages/superadmin/SuperadminLayout'
import EmpresasPage from '@/pages/superadmin/EmpresasPage'

function PlanRoute({ modulo, children }: { modulo: Modulo; children: React.ReactNode }) {
  const { tieneModulo } = usePlan()
  if (!tieneModulo(modulo)) return <ModuloBloqueado planRequerido="pro" />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/"                      element={<DashboardPage />} />
            <Route path="/pedidos"               element={<MisPedidosPage />} />
            <Route path="/venta"                 element={<NuevaVentaPage />} />
            <Route path="/ruta"                  element={<MiRutaPage />} />
            <Route path="/clientes"              element={<ClientesPage />} />
            <Route path="/cobros"                element={<CobrosPage />} />
            <Route path="/rendicion"             element={<RendicionPage />} />
            <Route path="/reportes"    element={<ReportesPage />} />
            <Route path="/facturacion" element={<PlanRoute modulo="facturacion"><FacturacionPage /></PlanRoute>} />
            <Route path="/despachos"   element={<PlanRoute modulo="deposito"><PlaceholderPage title="Despachos" description="Gestión de salidas de depósito y remitos." icon={Warehouse} /></PlanRoute>} />

            <Route path="/entregas"             element={<PlanRoute modulo="logistica"><EntregasPage /></PlanRoute>} />
            <Route path="/deposito/preparacion" element={<PlanRoute modulo="deposito"><PreparacionPage /></PlanRoute>} />

            {/* Panel admin */}
            <Route path="/admin/pedidos"      element={<AprobacionPedidosPage />} />
            <Route path="/admin/productos"    element={<AdminProductosPage />} />
            <Route path="/admin/precios"      element={<AdminPreciosPage />} />
            <Route path="/admin/clientes"     element={<AdminClientesPage />} />
            <Route path="/admin/zonas"        element={<AdminZonasPage />} />
            <Route path="/admin/preventistas" element={<AdminUsuariosPage />} />
            <Route path="/admin/stock"        element={<StockPage />} />
            <Route path="/admin/suscripcion"  element={<SuscripcionPage />} />
            <Route path="/admin/cobros"       element={<CobrosAdminPage />} />
          </Route>
        </Route>

        {/* Superadmin — completamente fuera del flujo de empresa */}
        <Route element={<SuperadminGuard />}>
          <Route element={<SuperadminLayout />}>
            <Route path="/superadmin" element={<EmpresasPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
