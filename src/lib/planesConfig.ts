export type PlanKey = 'starter' | 'pro' | 'enterprise'

export type Modulo =
  | 'preventa'
  | 'cobros'
  | 'deposito'
  | 'logistica'
  | 'facturacion'
  | 'stock'
  | 'reportes'

export const MODULOS_POR_PLAN: Record<PlanKey, Modulo[]> = {
  starter:    ['preventa', 'cobros', 'stock', 'reportes'],
  pro:        ['preventa', 'cobros', 'deposito', 'logistica', 'facturacion', 'stock', 'reportes'],
  enterprise: ['preventa', 'cobros', 'deposito', 'logistica', 'facturacion', 'stock', 'reportes'],
}

export interface PlanLimites {
  max_preventistas: number | null  // null = ilimitado
  max_zonas: number | null
  max_clientes: number | null
  max_productos: number | null
}

export const LIMITES_POR_PLAN: Record<PlanKey, PlanLimites> = {
  starter:    { max_preventistas: 3,    max_zonas: 5,    max_clientes: 200,  max_productos: 300  },
  pro:        { max_preventistas: 15,   max_zonas: null, max_clientes: null, max_productos: null },
  enterprise: { max_preventistas: null, max_zonas: null, max_clientes: null, max_productos: null },
}

export interface PlanMeta {
  nombre: string
  descripcion: string
  precio_usd: number | null   // null = a consultar
  precio_label: string
  periodo: 'mes' | 'consultar'
  es_popular: boolean
  features: string[]
  features_negadas?: string[]
}

export const PLANES_META: Record<PlanKey, PlanMeta> = {
  starter: {
    nombre: 'Starter',
    descripcion: 'Para distribuidoras que arrancan a digitalizar su preventa.',
    precio_usd: 25,
    precio_label: 'USD 25',
    periodo: 'mes',
    es_popular: false,
    features: [
      'Hasta 3 preventistas',
      'Hasta 5 zonas',
      'Preventa y pedidos offline',
      'Control de stock',
      'Cobros y rendición de caja',
      'Reportes de ventas',
    ],
    features_negadas: [
      'Depósito y logística',
      'Hojas de ruta',
      'Facturación / remitos',
    ],
  },
  pro: {
    nombre: 'Pro',
    descripcion: 'Flujo completo: preventa → depósito → logística → cobros.',
    precio_usd: 65,
    precio_label: 'USD 65',
    periodo: 'mes',
    es_popular: true,
    features: [
      'Hasta 15 preventistas',
      'Zonas y clientes ilimitados',
      'Todo el plan Starter',
      'Depósito y preparación de pedidos',
      'Hojas de ruta para choferes',
      'Facturación / remitos PDF',
      'Aprobación de pedidos por supervisor',
    ],
  },
  enterprise: {
    nombre: 'Enterprise',
    descripcion: 'Para distribuidoras grandes con múltiples depósitos o sucursales.',
    precio_usd: null,
    precio_label: 'A consultar',
    periodo: 'consultar',
    es_popular: false,
    features: [
      'Preventistas ilimitados',
      'Múltiples depósitos / sucursales',
      'Todo el plan Pro',
      'Integración ARCA / facturación fiscal',
      'API de integración con ERP propio',
      'Soporte prioritario con SLA',
      'Capacitación y onboarding dedicado',
    ],
  },
}

// Mapeo de valores legacy en DB a los nuevos keys
const PLAN_ALIAS: Record<string, PlanKey> = {
  preventista: 'starter',
  completo:    'pro',
  facturacion: 'starter',
  starter:     'starter',
  pro:         'pro',
  enterprise:  'enterprise',
}

export function normalizarPlan(planRaw: string | null | undefined): PlanKey {
  return PLAN_ALIAS[planRaw ?? ''] ?? 'starter'
}

// Helper para usar en guards de features
export function superaPlanLimite(
  plan: PlanKey,
  limite: keyof PlanLimites,
  valorActual: number,
): boolean {
  const max = LIMITES_POR_PLAN[plan][limite]
  if (max === null) return false
  return valorActual >= max
}
