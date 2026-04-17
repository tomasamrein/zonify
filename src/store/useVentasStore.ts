import { create } from 'zustand/react'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Producto } from '@/types/database'

// ─── Tipos del store ────────────────────────────────────────────────────────

type EstadoSync = 'pendiente' | 'sincronizando' | 'sincronizado' | 'error'

export interface ItemCarrito {
  producto_id: string
  nombre: string           // desnormalizado para display sin red
  codigo_interno: string
  cantidad: number
  precio_unitario: number  // congelado al momento de agregar
  descuento_porcentaje: number
  iva_porcentaje: number
  subtotal: number         // cantidad * precio * (1 - desc/100)
  total_linea: number      // subtotal * (1 + iva/100)
}

export interface PedidoOffline {
  uuid_offline: string
  id_servidor?: string
  cliente_id: string
  cliente_nombre: string   // desnormalizado
  preventista_id: string
  lista_precios_id: string
  detalles: ItemCarrito[]
  subtotal: number
  total_iva: number
  total: number
  observaciones?: string
  creado_en: string
  estado_sync: EstadoSync
  intentos_sync: number
  ultimo_error?: string
}

// Catálogo enriquecido: producto + precio de la lista activa
export type ProductoConPrecio = Producto & { precio: number | null }

interface VentasState {
  // ── Catálogo ──────────────────────────────────────────────────────────────
  productos: ProductoConPrecio[]
  cargandoProductos: boolean
  ultimaCargaProductos: string | null

  // ── Carrito (pedido en curso) ─────────────────────────────────────────────
  carrito: ItemCarrito[]
  clienteSeleccionadoId: string | null
  clienteSeleccionadoNombre: string | null
  listaPreciosId: string | null

  // ── Cola offline ──────────────────────────────────────────────────────────
  colaOffline: PedidoOffline[]
  sincronizando: boolean
  ultimaSync: string | null

  // ── Actions: catálogo ─────────────────────────────────────────────────────
  cargarProductos: (listaPreciosId?: string, forzar?: boolean) => Promise<void>

  // ── Actions: carrito ──────────────────────────────────────────────────────
  setCliente: (id: string, nombre: string) => void
  setListaPrecios: (id: string) => void
  agregarAlCarrito: (producto: ProductoConPrecio, cantidad: number, descuento?: number) => void
  actualizarCantidad: (producto_id: string, cantidad: number) => void
  quitarDelCarrito: (producto_id: string) => void
  limpiarCarrito: () => void

  // ── Actions: pedidos ──────────────────────────────────────────────────────
  confirmarPedido: (opts: { preventista_id: string; observaciones?: string }) => Promise<string>
  sincronizarCola: () => Promise<void>
  marcarSincronizado: (uuid_offline: string, id_servidor: string) => void
  marcarError: (uuid_offline: string, error: string) => void
  limpiarSincronizados: () => void
}

// ─── Helpers de cálculo (espejo exacto de los triggers de Postgres) ──────────

function calcularItem(
  producto_id: string,
  nombre: string,
  codigo_interno: string,
  cantidad: number,
  precio_unitario: number,
  descuento_porcentaje: number,
  iva_porcentaje: number,
): ItemCarrito {
  const subtotal = round2(cantidad * precio_unitario * (1 - descuento_porcentaje / 100))
  const total_linea = round2(subtotal * (1 + iva_porcentaje / 100))
  return { producto_id, nombre, codigo_interno, cantidad, precio_unitario, descuento_porcentaje, iva_porcentaje, subtotal, total_linea }
}

function calcularTotalesCarrito(carrito: ItemCarrito[]) {
  const subtotal = round2(carrito.reduce((acc, i) => acc + i.subtotal, 0))
  const total_iva = round2(carrito.reduce((acc, i) => acc + (i.total_linea - i.subtotal), 0))
  const total = round2(carrito.reduce((acc, i) => acc + i.total_linea, 0))
  return { subtotal, total_iva, total }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

// Re-fetch si pasaron más de 30 minutos (caché por TTL)
const CACHE_TTL_MS = 30 * 60 * 1000

function cacheVencida(ultimaCarga: string | null) {
  if (!ultimaCarga) return true
  return Date.now() - new Date(ultimaCarga).getTime() > CACHE_TTL_MS
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useVentasStore = create<VentasState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      productos: [],
      cargandoProductos: false,
      ultimaCargaProductos: null,

      carrito: [],
      clienteSeleccionadoId: null,
      clienteSeleccionadoNombre: null,
      listaPreciosId: null,

      colaOffline: [],
      sincronizando: false,
      ultimaSync: null,

      // ── Catálogo ────────────────────────────────────────────────────────────

      cargarProductos: async (listaPreciosId?: string, forzar = false) => {
        const { ultimaCargaProductos, cargandoProductos } = get()
        if (cargandoProductos) return
        if (!forzar && !cacheVencida(ultimaCargaProductos)) return

        set({ cargandoProductos: true })

        try {
          const { data: prods, error: errProds } = await supabase
            .from('productos')
            .select('*')
            .eq('activo', true)
            .order('nombre')

          if (errProds) throw errProds

          const listaId = listaPreciosId ?? get().listaPreciosId
          let precioMap: Record<string, number> = {}

          if (listaId) {
            const { data: precios, error: errPrecios } = await supabase
              .from('lista_precios_items')
              .select('producto_id, precio')
              .eq('lista_id', listaId)

            if (errPrecios) throw errPrecios
            precioMap = Object.fromEntries(precios.map((p) => [p.producto_id, p.precio]))
          }

          const productosConPrecio: ProductoConPrecio[] = (prods ?? []).map((p) => ({
            ...p,
            precio: precioMap[p.id] ?? null,
          }))

          set({ productos: productosConPrecio, ultimaCargaProductos: new Date().toISOString() })
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Error al cargar productos')
        } finally {
          set({ cargandoProductos: false })
        }
      },

      // ── Carrito ─────────────────────────────────────────────────────────────

      setCliente: (id: string, nombre: string) =>
        set({ clienteSeleccionadoId: id, clienteSeleccionadoNombre: nombre }),

      setListaPrecios: (id: string) => set({ listaPreciosId: id }),

      agregarAlCarrito: (producto: ProductoConPrecio, cantidad: number, descuento = 0) => {
        if (producto.precio === null) {
          toast.error(`${producto.nombre} no tiene precio en la lista activa`)
          return
        }
        if (cantidad <= 0) return

        const item = calcularItem(
          producto.id,
          producto.nombre,
          producto.codigo_interno,
          cantidad,
          producto.precio,
          descuento,
          producto.iva_porcentaje,
        )

        set((s) => {
          const existe = s.carrito.find((i) => i.producto_id === producto.id)
          if (existe) {
            return {
              carrito: s.carrito.map((i) =>
                i.producto_id === producto.id
                  ? calcularItem(i.producto_id, i.nombre, i.codigo_interno, i.cantidad + cantidad, i.precio_unitario, i.descuento_porcentaje, i.iva_porcentaje)
                  : i,
              ),
            }
          }
          return { carrito: [...s.carrito, item] }
        })
      },

      actualizarCantidad: (producto_id: string, cantidad: number) => {
        if (cantidad <= 0) {
          get().quitarDelCarrito(producto_id)
          return
        }
        set((s) => ({
          carrito: s.carrito.map((i) =>
            i.producto_id === producto_id
              ? calcularItem(i.producto_id, i.nombre, i.codigo_interno, cantidad, i.precio_unitario, i.descuento_porcentaje, i.iva_porcentaje)
              : i,
          ),
        }))
      },

      quitarDelCarrito: (producto_id: string) =>
        set((s) => ({ carrito: s.carrito.filter((i) => i.producto_id !== producto_id) })),

      limpiarCarrito: () =>
        set({ carrito: [], clienteSeleccionadoId: null, clienteSeleccionadoNombre: null }),

      // ── Confirmar pedido (online o encolado offline) ────────────────────────

      confirmarPedido: async ({ preventista_id, observaciones }) => {
        const { carrito, clienteSeleccionadoId, clienteSeleccionadoNombre, listaPreciosId } = get()

        if (!clienteSeleccionadoId || !clienteSeleccionadoNombre) throw new Error('Seleccioná un cliente')
        if (!listaPreciosId) throw new Error('No hay lista de precios activa')
        if (carrito.length === 0) throw new Error('El carrito está vacío')

        const totales = calcularTotalesCarrito(carrito)
        const uuid_offline = uuidv4()

        const pedido: PedidoOffline = {
          uuid_offline,
          cliente_id: clienteSeleccionadoId,
          cliente_nombre: clienteSeleccionadoNombre,
          preventista_id,
          lista_precios_id: listaPreciosId,
          detalles: carrito,
          ...totales,
          observaciones,
          creado_en: new Date().toISOString(),
          estado_sync: 'pendiente',
          intentos_sync: 0,
        }

        // Guardar localmente primero — garantiza que no se pierde nunca
        set((s) => ({ colaOffline: [...s.colaOffline, pedido] }))
        get().limpiarCarrito()

        if (navigator.onLine) {
          get().sincronizarCola()
        } else {
          toast('Pedido guardado offline. Se sincronizará cuando haya conexión.', { icon: '📦' })
        }

        return uuid_offline
      },

      // ── Sincronización ───────────────────────────────────────────────────────

      sincronizarCola: async () => {
        const { colaOffline, sincronizando } = get()
        if (sincronizando || !navigator.onLine) return

        const pendientes = colaOffline.filter(
          (p) => p.estado_sync === 'pendiente' || (p.estado_sync === 'error' && p.intentos_sync < 5),
        )
        if (pendientes.length === 0) return

        set({ sincronizando: true })

        for (const pedido of pendientes) {
          set((s) => ({
            colaOffline: s.colaOffline.map((p) =>
              p.uuid_offline === pedido.uuid_offline ? { ...p, estado_sync: 'sincronizando' as EstadoSync } : p,
            ),
          }))

          try {
            const { data: pedidoDB, error: errPedido } = await supabase
              .from('pedidos')
              .insert({
                cliente_id: pedido.cliente_id,
                preventista_id: pedido.preventista_id,
                lista_precios_id: pedido.lista_precios_id,
                uuid_offline: pedido.uuid_offline,
                sincronizado_en: new Date().toISOString(),
                observaciones: pedido.observaciones ?? null,
                subtotal: pedido.subtotal,
                total_iva: pedido.total_iva,
                total: pedido.total,
              })
              .select('id')
              .single()

            if (errPedido) {
              // 23505 = unique_violation: el pedido ya fue creado (doble envío)
              if (errPedido.code === '23505') {
                const { data: existente } = await supabase
                  .from('pedidos')
                  .select('id')
                  .eq('uuid_offline', pedido.uuid_offline)
                  .single()
                if (existente) {
                  get().marcarSincronizado(pedido.uuid_offline, existente.id)
                  continue
                }
              }
              throw errPedido
            }

            const detalles = pedido.detalles.map((d) => ({
              pedido_id: pedidoDB.id,
              producto_id: d.producto_id,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
              descuento_porcentaje: d.descuento_porcentaje,
              iva_porcentaje: d.iva_porcentaje,
              subtotal: d.subtotal,
              total_linea: d.total_linea,
            }))

            const { error: errDetalles } = await supabase.from('pedido_detalles').insert(detalles)
            if (errDetalles) throw errDetalles

            get().marcarSincronizado(pedido.uuid_offline, pedidoDB.id)
            toast.success(`Pedido de ${pedido.cliente_nombre} sincronizado`)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error de sincronización'
            get().marcarError(pedido.uuid_offline, msg)
            toast.error(`Error sync: ${msg}`)
          }
        }

        set({ sincronizando: false, ultimaSync: new Date().toISOString() })
      },

      marcarSincronizado: (uuid_offline: string, id_servidor: string) =>
        set((s) => ({
          colaOffline: s.colaOffline.map((p) =>
            p.uuid_offline === uuid_offline
              ? { ...p, estado_sync: 'sincronizado' as EstadoSync, id_servidor }
              : p,
          ),
          ultimaSync: new Date().toISOString(),
        })),

      marcarError: (uuid_offline: string, error: string) =>
        set((s) => ({
          colaOffline: s.colaOffline.map((p) =>
            p.uuid_offline === uuid_offline
              ? { ...p, estado_sync: 'error' as EstadoSync, intentos_sync: p.intentos_sync + 1, ultimo_error: error }
              : p,
          ),
        })),

      limpiarSincronizados: () =>
        set((s) => ({ colaOffline: s.colaOffline.filter((p) => p.estado_sync !== 'sincronizado') })),
    }),

    {
      name: 'zonify-ventas',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir lo crítico — sincronizando/cargandoProductos se recalculan
      partialize: (s) => ({
        productos: s.productos,
        ultimaCargaProductos: s.ultimaCargaProductos,
        carrito: s.carrito,
        clienteSeleccionadoId: s.clienteSeleccionadoId,
        clienteSeleccionadoNombre: s.clienteSeleccionadoNombre,
        listaPreciosId: s.listaPreciosId,
        colaOffline: s.colaOffline,
        ultimaSync: s.ultimaSync,
      }),
    },
  ),
)

// Listener global: cuando vuelve la red dispara sync automático
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    toast('Conexión restaurada. Sincronizando...', { icon: '🔄' })
    useVentasStore.getState().sincronizarCola()
  })
}
