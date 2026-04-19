import { useState } from 'react'
import { AlertCircle, RefreshCw, ClipboardCheck, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePedidosPorEstado } from '@/hooks/usePedidosPorEstado'

function formatMoneda(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AprobacionPedidosPage() {
  const { pedidos, cargando, error, recargar } = usePedidosPorEstado('pendiente')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [actualizando, setActualizando] = useState<string | null>(null)

  async function cambiarEstado(pedidoId: string, nuevoEstado: 'confirmado' | 'cancelado') {
    setActualizando(pedidoId)
    try {
      const { error: err } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedidoId)
      if (err) throw err
      await recargar()
    } catch (e) {
      alert('Error al actualizar: ' + (e instanceof Error ? e.message : (e as any)?.message ?? JSON.stringify(e)))
    } finally {
      setActualizando(null)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-[var(--color-ink-muted)]">{error}</p>
        <Button size="sm" variant="outline" onClick={recargar} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {pedidos.length === 0
            ? 'Sin pedidos pendientes'
            : `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} para aprobar`}
        </p>
        <Button size="sm" variant="ghost" onClick={recargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Actualizar
        </Button>
      </div>

      {pedidos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">Todo aprobado</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">No hay pedidos pendientes de aprobación.</p>
        </div>
      )}

      {pedidos.map((pedido) => {
        const abierto = expandido === pedido.id
        const totalItems = pedido.pedido_detalles?.reduce((acc, d) => acc + d.cantidad, 0) ?? 0
        return (
          <div
            key={pedido.id}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-ink)] truncate">
                    {pedido.clientes?.razon_social ?? '—'}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    #{pedido.numero_pedido} · {formatFecha(pedido.fecha_pedido)}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    {pedido.perfiles?.nombre_completo ?? 'Preventista'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge tone="warning">Pendiente</Badge>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{formatMoneda(pedido.total)}</p>
                </div>
              </div>

              {/* Toggle detalles */}
              <button
                onClick={() => setExpandido(abierto ? null : pedido.id)}
                className="mt-3 flex items-center gap-1 text-xs text-brand-600 font-medium"
              >
                {abierto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </button>

              {abierto && pedido.pedido_detalles && (
                <div className="mt-3 space-y-1.5 border-t border-[var(--color-border)] pt-3">
                  {pedido.pedido_detalles.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-ink)] truncate flex-1">{d.productos?.nombre ?? d.producto_id}</span>
                      <span className="ml-3 shrink-0 text-[var(--color-ink-muted)]">× {d.cantidad}</span>
                      <span className="ml-3 font-medium tabular-nums text-[var(--color-ink)] shrink-0">{formatMoneda(d.total_linea)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => cambiarEstado(pedido.id, 'cancelado')}
                  disabled={actualizando === pedido.id}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Rechazar
                </button>
                <button
                  onClick={() => cambiarEstado(pedido.id, 'confirmado')}
                  disabled={actualizando === pedido.id}
                  className="flex-2 flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-2 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Aprobar pedido
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
