import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, RefreshCw, AlertCircle, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

interface ProductoStock {
  id: string
  codigo_interno: string
  nombre: string
  stock_actual: number
  unidades_medida: { codigo: string } | null
}

interface MovimientoReciente {
  id: string
  created_at: string
  tipo: string
  cantidad: number
  stock_posterior: number
  motivo: string | null
  productos: { nombre: string; codigo_interno: string } | null
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR').format(n)
}

export default function StockPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const perfilId = useAuthStore((s) => s.perfil?.id)

  const [productos, setProductos] = useState<ProductoStock[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoReciente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [productoSel, setProductoSel] = useState<ProductoStock | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    try {
      const [{ data: prods, error: e1 }, { data: movs, error: e2 }] = await Promise.all([
        supabase
          .from('productos')
          .select('id, codigo_interno, nombre, stock_actual, unidades_medida(codigo)')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .order('nombre'),
        supabase
          .from('stock_movimientos')
          .select('id, created_at, tipo, cantidad, stock_posterior, motivo, productos(nombre, codigo_interno)')
          .eq('productos.empresa_id', empresaId)
          .order('created_at', { ascending: false })
          .limit(30),
      ])
      if (e1) throw e1
      setProductos((prods as ProductoStock[]) ?? [])
      setMovimientos((movs as MovimientoReciente[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setCargando(false)
    }
  }, [empresaId])

  useEffect(() => { cargar() }, [cargar])

  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.toLowerCase()
    return p.nombre.toLowerCase().includes(q) || p.codigo_interno.toLowerCase().includes(q)
  })

  function abrirIngreso(p: ProductoStock) {
    setProductoSel(p)
    setCantidad('')
    setMotivo('')
    setModalOpen(true)
  }

  async function confirmarIngreso() {
    if (!productoSel || !empresaId) return
    const cant = parseInt(cantidad, 10)
    if (isNaN(cant) || cant <= 0) {
      toast.error('Ingresá una cantidad válida')
      return
    }
    setGuardando(true)
    try {
      const stockPrevio = productoSel.stock_actual
      const stockPosterior = stockPrevio + cant

      const { error: e1 } = await supabase.from('stock_movimientos').insert({
        producto_id: productoSel.id,
        tipo: 'ingreso' as const,
        cantidad: cant,
        stock_previo: stockPrevio,
        stock_posterior: stockPosterior,
        motivo: motivo.trim() || null,
        usuario_id: perfilId ?? null,
      })
      if (e1) throw e1

      const { error: e2 } = await supabase
        .from('productos')
        .update({ stock_actual: stockPosterior })
        .eq('id', productoSel.id)
      if (e2) throw e2

      toast.success(`Stock actualizado: ${productoSel.nombre} → ${formatARS(stockPosterior)} u.`)
      setModalOpen(false)
      await cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar ingreso')
    } finally {
      setGuardando(false)
    }
  }

  const TIPO_LABEL: Record<string, string> = {
    ingreso: 'Ingreso',
    egreso: 'Egreso',
    ajuste: 'Ajuste',
    devolucion: 'Devolución',
    transferencia: 'Transferencia',
  }
  const TIPO_COLOR: Record<string, string> = {
    ingreso: 'text-green-400',
    egreso: 'text-red-400',
    ajuste: 'text-amber-400',
    devolucion: 'text-blue-400',
    transferencia: 'text-purple-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Gestión de Stock</h1>
        <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Productos */}
      <div className="space-y-3">
        <Input
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                  <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium">Producto</th>
                  <th className="text-right px-4 py-3 text-[var(--color-ink-muted)] font-medium">Stock actual</th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-[var(--color-ink-muted)]">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Sin productos
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-xs text-[var(--color-ink-muted)]">{p.codigo_interno}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={p.stock_actual <= 0 ? 'text-red-400 font-semibold' : 'text-[var(--color-ink)]'}>
                          {formatARS(p.stock_actual)}
                        </span>
                        <span className="text-xs text-[var(--color-ink-muted)] ml-1">
                          {p.unidades_medida?.codigo ?? 'u.'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => abrirIngreso(p)}
                          className="p-1.5 rounded-lg hover:bg-brand-600/20 text-brand-500 hover:text-brand-400 transition-colors"
                          title="Registrar ingreso"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movimientos recientes */}
      {movimientos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
            Últimos movimientos
          </h2>
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                  <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium">Producto</th>
                  <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium">Tipo</th>
                  <th className="text-right px-4 py-3 text-[var(--color-ink-muted)] font-medium">Cant.</th>
                  <th className="text-right px-4 py-3 text-[var(--color-ink-muted)] font-medium">Stock final</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-sm">{m.productos?.nombre ?? '—'}</p>
                      {m.motivo && <p className="text-xs text-[var(--color-ink-muted)]">{m.motivo}</p>}
                    </td>
                    <td className={`px-4 py-2.5 font-medium ${TIPO_COLOR[m.tipo] ?? ''}`}>
                      {TIPO_LABEL[m.tipo] ?? m.tipo}
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatARS(m.cantidad)}</td>
                    <td className="px-4 py-2.5 text-right text-[var(--color-ink-muted)]">{formatARS(m.stock_posterior)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal ingreso */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ingreso de stock — ${productoSel?.nombre ?? ''}`}
      >
        <div className="space-y-4">
          <div className="flex justify-between text-sm p-3 rounded-lg bg-[var(--color-surface-raised)]">
            <span className="text-[var(--color-ink-muted)]">Stock actual</span>
            <span className="font-semibold">{formatARS(productoSel?.stock_actual ?? 0)} {productoSel?.unidades_medida?.codigo ?? 'u.'}</span>
          </div>

          <Input
            label="Cantidad a ingresar"
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Ej: 100"
            autoFocus
          />

          <Input
            label="Motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Remito #1234, Compra proveedor..."
          />

          {cantidad && parseInt(cantidad, 10) > 0 && (
            <p className="text-sm text-green-400 text-center">
              Stock resultante: <strong>{formatARS((productoSel?.stock_actual ?? 0) + parseInt(cantidad, 10))} {productoSel?.unidades_medida?.codigo ?? 'u.'}</strong>
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={confirmarIngreso} loading={guardando}>
              Confirmar ingreso
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
