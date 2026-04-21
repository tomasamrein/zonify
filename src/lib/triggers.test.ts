import { describe, it, expect } from 'vitest'
import {
  calcularDetalle,
  calcularTotalesPedido,
  aplicarMovimiento,
  aplicarMovimientosSecuenciales,
} from './triggers'

// ── trg_calcular_totales_detalle ────────────────────────────────────────────

describe('calcularDetalle', () => {
  it('calcula subtotal y total_linea sin descuento', () => {
    const r = calcularDetalle({ cantidad: 10, precio_unitario: 100, descuento_porcentaje: 0, iva_porcentaje: 21 })
    expect(r.subtotal).toBe(1000)
    expect(r.total_linea).toBe(1210)
  })

  it('aplica descuento antes de IVA', () => {
    const r = calcularDetalle({ cantidad: 10, precio_unitario: 100, descuento_porcentaje: 10, iva_porcentaje: 21 })
    expect(r.subtotal).toBe(900)   // 10 * 100 * 0.90
    expect(r.total_linea).toBe(1089) // 900 * 1.21
  })

  it('IVA 0% devuelve subtotal === total_linea', () => {
    const r = calcularDetalle({ cantidad: 5, precio_unitario: 200, descuento_porcentaje: 0, iva_porcentaje: 0 })
    expect(r.subtotal).toBe(1000)
    expect(r.total_linea).toBe(1000)
  })

  it('redondea a 2 decimales', () => {
    const r = calcularDetalle({ cantidad: 3, precio_unitario: 10, descuento_porcentaje: 0, iva_porcentaje: 21 })
    expect(r.subtotal).toBe(30)
    expect(r.total_linea).toBe(36.3)
  })

  it('descuento 100% resulta en 0', () => {
    const r = calcularDetalle({ cantidad: 10, precio_unitario: 100, descuento_porcentaje: 100, iva_porcentaje: 21 })
    expect(r.subtotal).toBe(0)
    expect(r.total_linea).toBe(0)
  })

  it('cantidad fraccionaria', () => {
    const r = calcularDetalle({ cantidad: 2.5, precio_unitario: 100, descuento_porcentaje: 0, iva_porcentaje: 21 })
    expect(r.subtotal).toBe(250)
    expect(r.total_linea).toBe(302.5)
  })
})

describe('calcularTotalesPedido — inserciones masivas', () => {
  it('agrega correctamente 100 líneas homogéneas', () => {
    const detalles = Array.from({ length: 100 }, () => ({
      cantidad: 1, precio_unitario: 100, descuento_porcentaje: 0, iva_porcentaje: 21,
    }))
    const r = calcularTotalesPedido(detalles)
    expect(r.subtotal).toBe(10000)
    expect(r.total_iva).toBe(2100)
    expect(r.total).toBe(12100)
  })

  it('pedido mixto: IVA 21% y exento', () => {
    const detalles = [
      { cantidad: 10, precio_unitario: 100, descuento_porcentaje: 0, iva_porcentaje: 21 },
      { cantidad: 10, precio_unitario: 100, descuento_porcentaje: 0, iva_porcentaje: 0 },
    ]
    const r = calcularTotalesPedido(detalles)
    expect(r.subtotal).toBe(2000)
    expect(r.total_iva).toBe(210)
    expect(r.total).toBe(2210)
  })

  it('acumula correctamente con descuentos variables', () => {
    const detalles = [
      { cantidad: 10, precio_unitario: 100, descuento_porcentaje: 0,  iva_porcentaje: 21 },
      { cantidad: 10, precio_unitario: 100, descuento_porcentaje: 10, iva_porcentaje: 21 },
      { cantidad: 10, precio_unitario: 100, descuento_porcentaje: 20, iva_porcentaje: 21 },
    ]
    const r = calcularTotalesPedido(detalles)
    // subtotales: 1000 + 900 + 800 = 2700
    expect(r.subtotal).toBe(2700)
    expect(r.total).toBe(3267) // 2700 * 1.21
  })

  it('pedido vacío devuelve ceros', () => {
    const r = calcularTotalesPedido([])
    expect(r.subtotal).toBe(0)
    expect(r.total_iva).toBe(0)
    expect(r.total).toBe(0)
  })

  it('total === subtotal + total_iva siempre', () => {
    const detalles = Array.from({ length: 50 }, (_, i) => ({
      cantidad: i + 1,
      precio_unitario: 137.5,
      descuento_porcentaje: (i % 5) * 5,
      iva_porcentaje: i % 2 === 0 ? 21 : 10.5,
    }))
    const r = calcularTotalesPedido(detalles)
    expect(r.total).toBeCloseTo(r.subtotal + r.total_iva, 1)
  })
})

// ── trg_gestionar_stock ─────────────────────────────────────────────────────

describe('aplicarMovimiento', () => {
  it('ingreso suma al stock', () => {
    const r = aplicarMovimiento({ tipo: 'ingreso', cantidad: 50, stock_actual_previo: 100 })
    expect(r.stock_previo).toBe(100)
    expect(r.stock_posterior).toBe(150)
  })

  it('egreso resta del stock', () => {
    const r = aplicarMovimiento({ tipo: 'egreso', cantidad: 30, stock_actual_previo: 100 })
    expect(r.stock_posterior).toBe(70)
  })

  it('ajuste fija el stock al valor exacto', () => {
    const r = aplicarMovimiento({ tipo: 'ajuste', cantidad: 75, stock_actual_previo: 999 })
    expect(r.stock_posterior).toBe(75)
  })

  it('devolucion suma al stock igual que ingreso', () => {
    const r = aplicarMovimiento({ tipo: 'devolucion', cantidad: 5, stock_actual_previo: 20 })
    expect(r.stock_posterior).toBe(25)
  })

  it('transferencia descuenta del origen', () => {
    const r = aplicarMovimiento({ tipo: 'transferencia', cantidad: 10, stock_actual_previo: 50 })
    expect(r.stock_posterior).toBe(40)
  })

  it('egreso puede llevar stock a negativo (sin restricción en trigger)', () => {
    const r = aplicarMovimiento({ tipo: 'egreso', cantidad: 200, stock_actual_previo: 100 })
    expect(r.stock_posterior).toBe(-100)
  })
})

describe('aplicarMovimientosSecuenciales — inserciones masivas', () => {
  it('secuencia ingreso → egreso → ajuste produce resultado correcto', () => {
    const resultados = aplicarMovimientosSecuenciales(0, [
      { tipo: 'ingreso',     cantidad: 100 },
      { tipo: 'egreso',      cantidad: 30  },
      { tipo: 'devolucion',  cantidad: 5   },
      { tipo: 'ajuste',      cantidad: 50  },
    ])
    expect(resultados[0].stock_posterior).toBe(100)
    expect(resultados[1].stock_posterior).toBe(70)
    expect(resultados[2].stock_posterior).toBe(75)
    expect(resultados[3].stock_posterior).toBe(50)
  })

  it('cada movimiento usa el stock_posterior del anterior como previo', () => {
    const movs = aplicarMovimientosSecuenciales(10, [
      { tipo: 'ingreso', cantidad: 5 },
      { tipo: 'ingreso', cantidad: 5 },
      { tipo: 'egreso',  cantidad: 8 },
    ])
    expect(movs[0].stock_previo).toBe(10)
    expect(movs[1].stock_previo).toBe(15)
    expect(movs[2].stock_previo).toBe(20)
    expect(movs[2].stock_posterior).toBe(12)
  })

  it('100 ingresos de 1 unidad desde stock 0 resulta en 100', () => {
    const movs = aplicarMovimientosSecuenciales(
      0,
      Array.from({ length: 100 }, () => ({ tipo: 'ingreso' as const, cantidad: 1 })),
    )
    expect(movs.at(-1)!.stock_posterior).toBe(100)
  })

  it('ajuste en medio de la secuencia resetea el stock', () => {
    const movs = aplicarMovimientosSecuenciales(500, [
      { tipo: 'egreso',  cantidad: 200 },
      { tipo: 'ajuste',  cantidad: 0   },
      { tipo: 'ingreso', cantidad: 50  },
    ])
    expect(movs[1].stock_posterior).toBe(0)
    expect(movs[2].stock_posterior).toBe(50)
  })
})
