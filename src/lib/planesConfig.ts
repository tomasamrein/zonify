export type PlanKey = 'preventista' | 'completo' | 'facturacion'

export type Modulo =
  | 'preventa'
  | 'cobros'
  | 'deposito'
  | 'logistica'
  | 'facturacion'
  | 'stock'
  | 'reportes'

export const MODULOS_POR_PLAN: Record<PlanKey, Modulo[]> = {
  preventista: ['preventa', 'cobros', 'stock', 'reportes'],
  completo:    ['preventa', 'cobros', 'deposito', 'logistica', 'facturacion', 'stock', 'reportes'],
  facturacion: ['facturacion', 'stock', 'reportes'],
}

export const PLANES_META: Record<PlanKey, {
  nombre: string
  descripcion: string
  features: string[]
}> = {
  preventista: {
    nombre: 'Preventista',
    descripcion: 'Gestión de vendedores en calle y control de stock',
    features: [
      'Preventa y pedidos',
      'Control de stock',
      'Cobros y rendición de caja',
      'Gestión de clientes y zonas',
      'Reportes de ventas',
    ],
  },
  completo: {
    nombre: 'Completo',
    descripcion: 'Flujo completo: preventa → depósito → logística → facturación',
    features: [
      'Todo el plan Preventista',
      'Depósito y preparación de pedidos',
      'Logística y entregas (chofer)',
      'Hojas de ruta',
      'Facturación y comprobantes',
    ],
  },
  facturacion: {
    nombre: 'Facturación',
    descripcion: 'Solo facturación, productos y control de stock',
    features: [
      'Gestión de productos y precios',
      'Control de stock',
      'Facturación / comprobantes',
      'Reportes de ventas',
    ],
  },
}
