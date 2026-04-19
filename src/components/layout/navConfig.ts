import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Map,
  BarChart3,
  UserCog,
  Route,
  Warehouse,
  Truck,
  FileText,
  DollarSign,
  CreditCard,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'
import type { RolUsuario } from '@/types/database'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  primary?: boolean // marcado como acción rápida en mobile
}

const ADMIN_NAV: NavItem[] = [
  { to: '/',                   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/clientes',     label: 'Clientes',     icon: Users },
  { to: '/admin/productos',    label: 'Productos',    icon: Package },
  { to: '/admin/precios',      label: 'Precios',      icon: DollarSign },
  { to: '/admin/pedidos',      label: 'Aprobación',   icon: ClipboardCheck },
  { to: '/pedidos',            label: 'Pedidos',      icon: ShoppingCart },
  { to: '/rendicion',          label: 'Rendiciones',  icon: CreditCard },
  { to: '/admin/zonas',        label: 'Zonas',        icon: Map },
  { to: '/admin/preventistas', label: 'Preventistas', icon: UserCog },
  { to: '/reportes',           label: 'Reportes',     icon: BarChart3 },
  { to: '/facturacion',        label: 'Facturación',  icon: FileText },
]

const PREVENTISTA_NAV: NavItem[] = [
  { to: '/',          label: 'Inicio',       icon: LayoutDashboard },
  { to: '/ruta',      label: 'Mi ruta',      icon: Route },
  { to: '/venta',     label: 'Nueva venta',  icon: ShoppingCart, primary: true },
  { to: '/cobros',    label: 'Cobros',       icon: CreditCard },
  { to: '/clientes',  label: 'Clientes',     icon: Users },
  { to: '/pedidos',   label: 'Pedidos',      icon: FileText },
]

const DEPOSITO_NAV: NavItem[] = [
  { to: '/',                    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/deposito/preparacion', label: 'Preparación', icon: Package, primary: true },
  { to: '/productos',           label: 'Stock',        icon: Warehouse },
]

const CHOFER_NAV: NavItem[] = [
  { to: '/entregas',  label: 'Mis entregas', icon: Truck, primary: true },
  { to: '/rendicion', label: 'Rendición',    icon: CreditCard },
]

export function getNavForRole(rol: RolUsuario | undefined | null): NavItem[] {
  switch (rol) {
    case 'admin':
    case 'supervisor':
      return ADMIN_NAV
    case 'preventista':
      return PREVENTISTA_NAV
    case 'deposito':
      return DEPOSITO_NAV
    case 'chofer':
      return CHOFER_NAV
    default:
      return []
  }
}
