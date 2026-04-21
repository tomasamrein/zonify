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
  Settings,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { RolUsuario } from '@/types/database'
import type { Modulo, PlanKey } from '@/lib/planesConfig'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  primary?: boolean
  modulo?: Modulo
  planMinimo?: PlanKey // oculto si el plan actual es inferior
}

const ADMIN_NAV: NavItem[] = [
  { to: '/',                   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/clientes',     label: 'Clientes',     icon: Users,          modulo: 'preventa' },
  { to: '/admin/productos',    label: 'Productos',    icon: Package,        modulo: 'stock' },
  { to: '/admin/precios',      label: 'Precios',      icon: DollarSign,     modulo: 'stock' },
  { to: '/admin/stock',        label: 'Stock',        icon: Warehouse,      modulo: 'stock' },
  { to: '/admin/pedidos',      label: 'Aprobación',   icon: ClipboardCheck, modulo: 'preventa' },
  { to: '/pedidos',            label: 'Pedidos',      icon: ShoppingCart,   modulo: 'preventa' },
  { to: '/rendicion',          label: 'Rendiciones',  icon: CreditCard,     modulo: 'cobros' },
  { to: '/admin/zonas',        label: 'Zonas',        icon: Map,            modulo: 'preventa' },
  { to: '/admin/preventistas', label: 'Preventistas', icon: UserCog,        modulo: 'preventa' },
  { to: '/admin/cobros',       label: 'Cobros',       icon: DollarSign,     modulo: 'cobros' },
  { to: '/reportes',           label: 'Reportes',     icon: BarChart3,      modulo: 'reportes' },
  { to: '/facturacion',        label: 'Facturación',  icon: FileText,       modulo: 'facturacion' },
  { to: '/admin/auditoria',    label: 'Auditoría',    icon: ShieldCheck,    planMinimo: 'enterprise' },
  { to: '/admin/asistente',    label: 'Asistente IA', icon: Sparkles,       planMinimo: 'enterprise' },
  { to: '/admin/suscripcion',  label: 'Suscripción',  icon: Settings },
]

const PREVENTISTA_NAV: NavItem[] = [
  { to: '/',          label: 'Inicio',       icon: LayoutDashboard },
  { to: '/ruta',      label: 'Mi ruta',      icon: Route,          modulo: 'preventa' },
  { to: '/venta',     label: 'Nueva venta',  icon: ShoppingCart,   modulo: 'preventa', primary: true },
  { to: '/cobros',    label: 'Cobros',       icon: CreditCard,     modulo: 'cobros' },
  { to: '/clientes',  label: 'Clientes',     icon: Users,          modulo: 'preventa' },
  { to: '/pedidos',   label: 'Pedidos',      icon: FileText,       modulo: 'preventa' },
]

const DEPOSITO_NAV: NavItem[] = [
  { to: '/',                     label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/deposito/preparacion', label: 'Preparación', icon: Package,  modulo: 'deposito', primary: true },
  { to: '/admin/productos',      label: 'Stock',       icon: Warehouse, modulo: 'stock' },
]

const CHOFER_NAV: NavItem[] = [
  { to: '/entregas',  label: 'Mis entregas', icon: Truck,        modulo: 'logistica', primary: true },
  { to: '/rendicion', label: 'Rendición',    icon: CreditCard,   modulo: 'cobros' },
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
