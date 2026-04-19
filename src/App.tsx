import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BarChart3, Warehouse } from 'lucide-react'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import MiRutaPage from '@/pages/MiRutaPage'
import NuevaVentaPage from '@/pages/NuevaVentaPage'
import MisPedidosPage from '@/pages/MisPedidosPage'
import ClientesPage from '@/pages/ClientesPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import FacturacionPage from '@/pages/FacturacionPage'
import AdminProductosPage from '@/pages/admin/ProductosPage'
import AdminClientesPage from '@/pages/admin/ClientesPage'
import AdminZonasPage from '@/pages/admin/ZonasPage'
import AdminUsuariosPage from '@/pages/admin/UsuariosPage'
import AdminPreciosPage from '@/pages/admin/PreciosPage'
import CobrosPage from '@/pages/CobrosPage'
import RendicionPage from '@/pages/RendicionPage'
import EntregasPage from '@/pages/EntregasPage'
import PreparacionPage from '@/pages/deposito/PreparacionPage'
import AprobacionPedidosPage from '@/pages/admin/AprobacionPedidosPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/"                      element={<DashboardPage />} />
            <Route path="/pedidos"               element={<MisPedidosPage />} />
            <Route path="/venta"                 element={<NuevaVentaPage />} />
            <Route path="/ruta"                  element={<MiRutaPage />} />
            <Route path="/clientes"              element={<ClientesPage />} />
            <Route path="/cobros"                element={<CobrosPage />} />
            <Route path="/rendicion"             element={<RendicionPage />} />
            <Route path="/reportes"              element={<PlaceholderPage title="Reportes" description="Gráficos de ventas, rentabilidad y KPIs del negocio." icon={BarChart3} />} />
            <Route path="/facturacion"           element={<FacturacionPage />} />
            <Route path="/despachos"             element={<PlaceholderPage title="Despachos" description="Gestión de salidas de depósito y remitos." icon={Warehouse} />} />

            <Route path="/entregas"             element={<EntregasPage />} />
            <Route path="/deposito/preparacion" element={<PreparacionPage />} />

            {/* Panel admin */}
            <Route path="/admin/pedidos"      element={<AprobacionPedidosPage />} />
            <Route path="/admin/productos"    element={<AdminProductosPage />} />
            <Route path="/admin/precios"      element={<AdminPreciosPage />} />
            <Route path="/admin/clientes"     element={<AdminClientesPage />} />
            <Route path="/admin/zonas"        element={<AdminZonasPage />} />
            <Route path="/admin/preventistas" element={<AdminUsuariosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
