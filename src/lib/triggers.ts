// Espejo TypeScript exacto de los triggers de Postgres.
// Permite testear la lógica de cálculo sin base de datos.

function round2(n: number) {
  return Math.round(n * 100) / 100
}

// ── trg_calcular_totales_detalle ────────────────────────────────────────────
// Replica: subtotal = cantidad * precio * (1 - descuento/100)
//          total_linea = subtotal * (1 + iva/100)

export interface DetalleInput {
  cantidad: number
  precio_unitario: number
  descuento_porcentaje: number
  iva_porcentaje: number
}

export interface DetalleCalculado extends DetalleInput {
  subtotal: number
  total_linea: number
}

export function calcularDetalle(d: DetalleInput): DetalleCalculado {
  const subtotal = round2(d.cantidad * d.precio_unitario * (1 - d.descuento_porcentaje / 100))
  const total_linea = round2(subtotal * (1 + d.iva_porcentaje / 100))
  return { ...d, subtotal, total_linea }
}

export function calcularTotalesPedido(detalles: DetalleInput[]) {
  const calculados = detalles.map(calcularDetalle)
  const subtotal = round2(calculados.reduce((a, d) => a + d.subtotal, 0))
  const total_iva = round2(calculados.reduce((a, d) => a + (d.total_linea - d.subtotal), 0))
  const total = round2(calculados.reduce((a, d) => a + d.total_linea, 0))
  return { detalles: calculados, subtotal, total_iva, total }
}

// ── trg_gestionar_stock ─────────────────────────────────────────────────────
// Replica la actualización de stock_actual según el tipo de movimiento.

export type TipoMovimiento = 'ingreso' | 'egreso' | 'ajuste' | 'devolucion' | 'transferencia'

export interface MovimientoInput {
  tipo: TipoMovimiento
  cantidad: number
  stock_actual_previo: number
}

export interface MovimientoCalculado {
  stock_previo: number
  stock_posterior: number
  cantidad: number
  tipo: TipoMovimiento
}

export function aplicarMovimiento(m: MovimientoInput): MovimientoCalculado {
  let stock_posterior: number

  switch (m.tipo) {
    case 'ingreso':
    case 'devolucion':
      stock_posterior = m.stock_actual_previo + m.cantidad
      break
    case 'egreso':
      stock_posterior = m.stock_actual_previo - m.cantidad
      break
    case 'ajuste':
      stock_posterior = m.cantidad
      break
    case 'transferencia':
      stock_posterior = m.stock_actual_previo - m.cantidad
      break
  }

  return {
    stock_previo: m.stock_actual_previo,
    stock_posterior,
    cantidad: m.cantidad,
    tipo: m.tipo,
  }
}

export function aplicarMovimientosSecuenciales(
  stockInicial: number,
  movimientos: { tipo: TipoMovimiento; cantidad: number }[],
): MovimientoCalculado[] {
  let stockActual = stockInicial
  return movimientos.map((m) => {
    const resultado = aplicarMovimiento({ ...m, stock_actual_previo: stockActual })
    stockActual = resultado.stock_posterior
    return resultado
  })
}
