import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, ShoppingCart, Plus, Minus, X, ChevronDown,
  AlertCircle, RefreshCw, CheckCircle2, Package,
} from 'lucide-react'
import { useVentasStore } from '@/store/useVentasStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useClientes } from '@/hooks/useClientes'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import type { ProductoConPrecio } from '@/store/useVentasStore'

type Paso = 'selector' | 'catalogo' | 'confirmacion'

const formatMoneda = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

// ── Selector de cliente ──────────────────────────────────────────────────────

interface SelectorClienteProps {
  onSeleccionar: (id: string, nombre: string) => void
}

function SelectorCliente({ onSeleccionar }: SelectorClienteProps) {
  const { clientes, cargando, error, recargar } = useClientes()
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(
    () => clientes.filter(
      (c) =>
        c.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.nombre_fantasia ?? '').toLowerCase().includes(busqueda.toLowerCase()),
    ),
    [clientes, busqueda]
  )

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-4">
      <Input
        placeholder="Buscar cliente..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
        autoFocus
      />

      {cargando && (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-[var(--color-ink-muted)]">{error}</p>
          <Button size="sm" variant="outline" onClick={recargar} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reintentar
          </Button>
        </div>
      )}

      {!cargando && filtrados.length === 0 && (
        <p className="text-center text-sm text-[var(--color-ink-muted)] py-12">
          {busqueda ? 'Sin resultados' : 'No tenés clientes asignados'}
        </p>
      )}

      <div className="space-y-2">
        {filtrados.map((c) => (
          <button
            key={c.id}
            onClick={() => onSeleccionar(c.id, c.razon_social)}
            className="w-full text-left bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl px-4 py-3 transition-colors"
          >
            <p className="font-medium text-[var(--color-ink)]">{c.razon_social}</p>
            {c.nombre_fantasia && c.nombre_fantasia !== c.razon_social && (
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{c.nombre_fantasia}</p>
            )}
            {c.direccion && (
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 truncate">{c.direccion}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Fila de producto (memoizada: re-renderiza solo si cambia su propia cantidad) ─

interface ProductoRowProps {
  producto: ProductoConPrecio
  cantidad: number
  onMas: (p: ProductoConPrecio) => void
  onMenos: (p: ProductoConPrecio) => void
}

const ProductoRow = memo(function ProductoRow({ producto: p, cantidad: cant, onMas, onMenos }: ProductoRowProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-[var(--shadow-card)]',
        cant > 0 && 'border-brand-300 bg-brand-50/40',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-ink)] text-sm leading-tight truncate">{p.nombre}</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{p.codigo_interno}</p>
      </div>
      <p className="text-sm font-semibold text-brand-700 shrink-0">
        {formatMoneda(p.precio!)}
      </p>
      <div className="flex items-center gap-1.5 shrink-0">
        {cant > 0 ? (
          <>
            <button
              onClick={() => onMenos(p)}
              className="w-8 h-8 rounded-lg bg-[var(--color-surface-soft)] hover:bg-[var(--color-border)] flex items-center justify-center transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{cant}</span>
            <button
              onClick={() => onMas(p)}
              className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onMas(p)}
            className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
})

// ── Catálogo ─────────────────────────────────────────────────────────────────

interface CatalogoProps {
  clienteNombre: string
  onCambiarCliente: () => void
  onConfirmar: () => void
}

function Catalogo({ clienteNombre, onCambiarCliente, onConfirmar }: CatalogoProps) {
  const productos = useVentasStore((s) => s.productos)
  const cargandoProductos = useVentasStore((s) => s.cargandoProductos)
  const carrito = useVentasStore((s) => s.carrito)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarCarrito, setMostrarCarrito] = useState(false)

  const filtrados = useMemo(
    () => productos.filter(
      (p) =>
        p.activo &&
        p.precio !== null &&
        (p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo_interno.toLowerCase().includes(busqueda.toLowerCase())),
    ),
    [productos, busqueda]
  )

  // O(1) lookup map — rebuilt only when carrito changes
  const carritoMap = useMemo(
    () => Object.fromEntries(carrito.map((i) => [i.producto_id, i.cantidad])),
    [carrito]
  )

  const { totalItems, totalCarrito } = useMemo(
    () => ({
      totalItems: carrito.reduce((acc, i) => acc + i.cantidad, 0),
      totalCarrito: carrito.reduce((acc, i) => acc + i.total_linea, 0),
    }),
    [carrito]
  )

  // Stable callbacks — read current carrito from store to avoid stale closure without deps on carritoMap
  const handleMas = useCallback((p: ProductoConPrecio) => {
    const { carrito: c, agregarAlCarrito: add, actualizarCantidad: update } = useVentasStore.getState()
    const cant = c.find((i) => i.producto_id === p.id)?.cantidad ?? 0
    if (cant === 0) add(p, 1)
    else update(p.id, cant + 1)
  }, [])

  const handleMenos = useCallback((p: ProductoConPrecio) => {
    const { carrito: c, actualizarCantidad: update, quitarDelCarrito: remove } = useVentasStore.getState()
    const cant = c.find((i) => i.producto_id === p.id)?.cantidad ?? 0
    if (cant <= 1) remove(p.id)
    else update(p.id, cant - 1)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Lista productos */}
      <div className="flex-1 min-w-0 space-y-3 pb-28 lg:pb-4">
        {/* Cliente selector pill */}
        <button
          onClick={onCambiarCliente}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
        >
          <span className="truncate max-w-[200px]">{clienteNombre}</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        </button>

        <Input
          placeholder="Buscar producto o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        {cargandoProductos && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargandoProductos && filtrados.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-ink-muted)]">
              {busqueda ? 'Sin resultados' : 'Sin productos con precio en esta lista'}
            </p>
          </div>
        )}

        {filtrados.map((p) => (
          <ProductoRow
            key={p.id}
            producto={p}
            cantidad={carritoMap[p.id] ?? 0}
            onMas={handleMas}
            onMenos={handleMenos}
          />
        ))}
      </div>

      {/* ── Carrito desktop (sidebar) ─── */}
      {totalItems > 0 && (
        <div className="hidden lg:flex flex-col w-80 shrink-0">
          <CarritoPanel carrito={carrito} onConfirmar={onConfirmar} onQuitar={(id) => useVentasStore.getState().quitarDelCarrito(id)} onActualizar={(id, c) => useVentasStore.getState().actualizarCantidad(id, c)} />
        </div>
      )}

      {/* ── Carrito mobile (barra fija abajo + drawer) ─── */}
      {totalItems > 0 && (
        <>
          <div className="lg:hidden fixed bottom-20 left-0 right-0 px-4 z-30">
            <button
              onClick={() => setMostrarCarrito(true)}
              className="w-full bg-brand-600 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-semibold">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</span>
              </div>
              <span className="font-bold">{formatMoneda(totalCarrito)}</span>
            </button>
          </div>

          {/* Drawer */}
          {mostrarCarrito && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMostrarCarrito(false)} />
              <div className="relative bg-[var(--color-surface)] rounded-t-3xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
                  <p className="font-semibold text-[var(--color-ink)]">Carrito</p>
                  <button onClick={() => setMostrarCarrito(false)}>
                    <X className="w-5 h-5 text-[var(--color-ink-muted)]" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  <CarritoPanel
                    carrito={carrito}
                    onConfirmar={() => { setMostrarCarrito(false); onConfirmar() }}
                    onQuitar={(id) => useVentasStore.getState().quitarDelCarrito(id)}
                    onActualizar={(id, c) => useVentasStore.getState().actualizarCantidad(id, c)}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Panel carrito ─────────────────────────────────────────────────────────────

interface CarritoPanelProps {
  carrito: ReturnType<typeof useVentasStore.getState>['carrito']
  onConfirmar: () => void
  onQuitar: (id: string) => void
  onActualizar: (id: string, cant: number) => void
}

const CarritoPanel = memo(function CarritoPanel({ carrito, onConfirmar, onQuitar, onActualizar }: CarritoPanelProps) {
  const subtotal = carrito.reduce((a, i) => a + i.subtotal, 0)
  const totalIva = carrito.reduce((a, i) => a + (i.total_linea - i.subtotal), 0)
  const total    = carrito.reduce((a, i) => a + i.total_linea, 0)

  return (
    <div className="space-y-3">
      {carrito.map((item) => (
        <div key={item.producto_id} className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.nombre}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">{formatMoneda(item.precio_unitario)} c/u</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onActualizar(item.producto_id, item.cantidad - 1)}
              className="w-7 h-7 rounded-lg bg-[var(--color-surface-soft)] hover:bg-[var(--color-border)] flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.cantidad}</span>
            <button
              onClick={() => onActualizar(item.producto_id, item.cantidad + 1)}
              className="w-7 h-7 rounded-lg bg-[var(--color-surface-soft)] hover:bg-[var(--color-border)] flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm font-semibold w-20 text-right tabular-nums shrink-0">
            {formatMoneda(item.total_linea)}
          </p>
          <button onClick={() => onQuitar(item.producto_id)} className="text-[var(--color-ink-muted)] hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <div className="border-t border-[var(--color-border)] pt-3 space-y-1 text-sm">
        <div className="flex justify-between text-[var(--color-ink-muted)]">
          <span>Subtotal</span><span>{formatMoneda(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[var(--color-ink-muted)]">
          <span>IVA</span><span>{formatMoneda(totalIva)}</span>
        </div>
        <div className="flex justify-between font-bold text-[var(--color-ink)] text-base pt-1">
          <span>Total</span><span>{formatMoneda(total)}</span>
        </div>
      </div>

      <Button variant="primary" size="lg" className="w-full mt-2" onClick={onConfirmar}>
        Revisar pedido
      </Button>
    </div>
  )
})

// ── Pantalla de confirmación ──────────────────────────────────────────────────

interface ConfirmacionProps {
  clienteNombre: string
  onVolver: () => void
  onConfirmar: (observaciones: string) => void
  submitting: boolean
}

function Confirmacion({ clienteNombre, onVolver, onConfirmar, submitting }: ConfirmacionProps) {
  const carrito = useVentasStore((s) => s.carrito)
  const [observaciones, setObservaciones] = useState('')

  const subtotal = carrito.reduce((a, i) => a + i.subtotal, 0)
  const totalIva = carrito.reduce((a, i) => a + (i.total_linea - i.subtotal), 0)
  const total    = carrito.reduce((a, i) => a + i.total_linea, 0)

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-4">
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] shadow-[var(--shadow-card)]">
        <div className="px-4 py-3">
          <p className="text-xs text-[var(--color-ink-muted)]">Cliente</p>
          <p className="font-semibold text-[var(--color-ink)] mt-0.5">{clienteNombre}</p>
        </div>

        <div className="px-4 py-3 space-y-2.5">
          {carrito.map((item) => (
            <div key={item.producto_id} className="flex items-center justify-between text-sm gap-3">
              <span className="text-[var(--color-ink)] flex-1 truncate">{item.nombre}</span>
              <span className="text-[var(--color-ink-muted)] shrink-0">× {item.cantidad}</span>
              <span className="font-medium text-[var(--color-ink)] tabular-nums shrink-0">
                {formatMoneda(item.total_linea)}
              </span>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-[var(--color-ink-muted)]">
            <span>Subtotal</span><span>{formatMoneda(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--color-ink-muted)]">
            <span>IVA</span><span>{formatMoneda(totalIva)}</span>
          </div>
          <div className="flex justify-between font-bold text-[var(--color-ink)] text-base pt-1">
            <span>Total</span><span>{formatMoneda(total)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
          Observaciones <span className="text-[var(--color-ink-muted)] font-normal">(opcional)</span>
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          placeholder="Ej: Entregar en depósito, llamar antes..."
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-[var(--color-ink-muted)]"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onVolver} disabled={submitting}>
          Volver
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          loading={submitting}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => onConfirmar(observaciones)}
        >
          Confirmar pedido
        </Button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function NuevaVentaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { perfil, empresaId } = useAuthStore()
  const { setCliente, setListaPrecios, cargarProductos, limpiarCarrito } = useVentasStore()

  const [paso, setPaso] = useState<Paso>('selector')
  const [_clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNombre, setClienteNombre] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorLista, setErrorLista] = useState<string | null>(null)

  const cargarListaYProductos = useCallback(async (cliId: string) => {
    setErrorLista(null)
    try {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('lista_precios_id')
        .eq('id', cliId)
        .single()

      let listaId = cliente?.lista_precios_id ?? null

      if (!listaId) {
        const { data: listaDefault } = await supabase
          .from('listas_precios')
          .select('id')
          .eq('es_default', true)
          .single()
        listaId = listaDefault?.id ?? null
      }

      if (!listaId) {
        setErrorLista('Este cliente no tiene lista de precios asignada y no hay una lista por defecto. Contactá al administrador.')
        return
      }

      setListaPrecios(listaId)
      await cargarProductos(listaId, true)
    } catch {
      setErrorLista('Error al cargar la lista de precios.')
    }
  }, [setListaPrecios, cargarProductos])

  // Pre-seleccionar cliente desde URL (viene de Mi Ruta)
  useEffect(() => {
    const cliId   = searchParams.get('cliente_id')
    const cliNombre = searchParams.get('cliente_nombre')
    if (cliId && cliNombre) {
      handleSeleccionarCliente(cliId, decodeURIComponent(cliNombre))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSeleccionarCliente(id: string, nombre: string) {
    setClienteId(id)
    setClienteNombre(nombre)
    setCliente(id, nombre)
    setPaso('catalogo')
    cargarListaYProductos(id)
  }

  async function handleConfirmarPedido(observaciones: string) {
    if (!perfil?.id || !empresaId) return
    setSubmitting(true)
    try {
      const { confirmarPedido } = useVentasStore.getState()
      await confirmarPedido({
        empresa_id: empresaId,
        preventista_id: perfil.id,
        observaciones: observaciones || undefined,
      })
      navigate('/pedidos')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al confirmar pedido')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCambiarCliente() {
    limpiarCarrito()
    setClienteId(null)
    setClienteNombre(null)
    setPaso('selector')
  }

  return (
    <div className="h-full">
      {paso === 'selector' && (
        <SelectorCliente onSeleccionar={handleSeleccionarCliente} />
      )}

      {paso === 'catalogo' && clienteNombre && (
        errorLista ? (
          <div className="max-w-lg mx-auto lg:mx-0 flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <p className="text-sm text-[var(--color-ink-muted)]">{errorLista}</p>
            <Button size="sm" variant="outline" onClick={handleCambiarCliente}>
              Cambiar cliente
            </Button>
          </div>
        ) : (
          <Catalogo
            clienteNombre={clienteNombre}
            onCambiarCliente={handleCambiarCliente}
            onConfirmar={() => setPaso('confirmacion')}
          />
        )
      )}

      {paso === 'confirmacion' && clienteNombre && (
        <Confirmacion
          clienteNombre={clienteNombre}
          onVolver={() => setPaso('catalogo')}
          onConfirmar={handleConfirmarPedido}
          submitting={submitting}
        />
      )}
    </div>
  )
}
