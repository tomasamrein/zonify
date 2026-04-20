import { describe, it, expect, beforeEach } from 'vitest'
import { useVentasStore } from './useVentasStore'
import type { ProductoConPrecio } from './useVentasStore'

function makeProducto(overrides: Partial<ProductoConPrecio> = {}): ProductoConPrecio {
  return {
    id: 'prod-1',
    nombre: 'Producto Test',
    codigo_interno: 'P001',
    codigo_barras: null,
    precio: 100,
    iva_porcentaje: 21,
    costo: null,
    stock_actual: 100,
    stock_reservado: 0,
    stock_minimo: 0,
    activo: true,
    empresa_id: 'emp-1',
    deposito_id: null,
    unidad_medida_id: null,
    categoria_id: null,
    descripcion: null,
    imagen_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as ProductoConPrecio
}

describe('useVentasStore — carrito', () => {
  beforeEach(() => {
    useVentasStore.setState({
      carrito: [],
      clienteSeleccionadoId: null,
      clienteSeleccionadoNombre: null,
      listaPreciosId: null,
    })
  })

  it('calcula subtotal y total_linea correctamente', () => {
    const store = useVentasStore.getState()
    store.agregarAlCarrito(makeProducto({ precio: 100 }), 10, 0)

    const item = useVentasStore.getState().carrito[0]
    // subtotal = 10 * 100 * (1 - 0/100) = 1000
    expect(item.subtotal).toBe(1000)
    // total_linea = 1000 * (1 + 21/100) = 1210
    expect(item.total_linea).toBe(1210)
  })

  it('calcula descuento correctamente', () => {
    const store = useVentasStore.getState()
    store.agregarAlCarrito(makeProducto({ precio: 100 }), 10, 10)

    const item = useVentasStore.getState().carrito[0]
    // subtotal = 10 * 100 * (1 - 10/100) = 900
    expect(item.subtotal).toBe(900)
    // total_linea = 900 * (1 + 21/100) = 1089
    expect(item.total_linea).toBe(1089)
  })

  it('acumula cantidades al agregar el mismo producto', () => {
    const store = useVentasStore.getState()
    store.agregarAlCarrito(makeProducto({ precio: 100 }), 5)
    store.agregarAlCarrito(makeProducto({ precio: 100 }), 3)

    const carrito = useVentasStore.getState().carrito
    expect(carrito).toHaveLength(1)
    expect(carrito[0].cantidad).toBe(8)
  })

  it('no agrega producto sin precio', () => {
    const store = useVentasStore.getState()
    store.agregarAlCarrito(makeProducto({ precio: null }), 5)

    expect(useVentasStore.getState().carrito).toHaveLength(0)
  })

  it('quita un producto del carrito', () => {
    const store = useVentasStore.getState()
    store.agregarAlCarrito(makeProducto(), 5)
    useVentasStore.getState().quitarDelCarrito('prod-1')

    expect(useVentasStore.getState().carrito).toHaveLength(0)
  })

  it('limpia el carrito', () => {
    const store = useVentasStore.getState()
    store.agregarAlCarrito(makeProducto(), 5)
    store.agregarAlCarrito(makeProducto({ id: 'prod-2' }), 3)
    useVentasStore.getState().limpiarCarrito()

    expect(useVentasStore.getState().carrito).toHaveLength(0)
  })
})

describe('useVentasStore — cola offline', () => {
  beforeEach(() => {
    useVentasStore.setState({ colaOffline: [] })
  })

  it('limpiarSincronizados remueve solo los sincronizados', () => {
    useVentasStore.setState({
      colaOffline: [
        { uuid_offline: '1', estado_sync: 'sincronizado', intentos_sync: 0 } as any,
        { uuid_offline: '2', estado_sync: 'pendiente', intentos_sync: 0 } as any,
        { uuid_offline: '3', estado_sync: 'error', intentos_sync: 5 } as any,
      ],
    })

    useVentasStore.getState().limpiarSincronizados()

    const cola = useVentasStore.getState().colaOffline
    expect(cola).toHaveLength(2)
    expect(cola.find((p) => p.uuid_offline === '1')).toBeUndefined()
    expect(cola.find((p) => p.uuid_offline === '2')).toBeDefined()
    expect(cola.find((p) => p.uuid_offline === '3')).toBeDefined()
  })
})
