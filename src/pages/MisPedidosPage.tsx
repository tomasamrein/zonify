import { useState } from 'react'
import { AlertCircle, RefreshCw, ShoppingCart, WifiOff, MessageCircle, Check, X } from 'lucide-react'
import { usePedidos } from '@/hooks/usePedidos'
import { useVentasStore } from '@/store/useVentasStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { cn } from '@/lib/utils'

type EstadoPedido = Database['public']['Enums']['estado_pedido']

const estadoBadge: Record<EstadoPedido, { tone: 'neutral' | 'warning' | 'brand' | 'success' | 'danger' | 'info'; label: string }> = {
  borrador:   { tone: 'neutral',  label: 'Borrador' },
  pendiente:  { tone: 'warning',  label: 'Pendiente' },
  confirmado: { tone: 'brand',    label: 'Confirmado' },
  facturado:  { tone: 'info',     label: 'Facturado' },
  entregado:  { tone: 'success',  label: 'Entregado' },
  cancelado:  { tone: 'danger',   label: 'Cancelado' },
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoneda(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function compartirPedidoWA(pedido: { numero_pedido: number; total: number; clientes?: { razon_social: string } | null }, empresaNombre: string) {
  const cliente = pedido.clientes?.razon_social ?? 'Cliente'
  const total = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(pedido.total)
  const msg = encodeURIComponent(
    `Hola ${cliente}! 👋\n` +
    `Te confirmamos el pedido #${pedido.numero_pedido} de ${empresaNombre} por ${total}.\n` +
    `Ante cualquier consulta estamos a disposición.`
  )
  window.open(`https://wa.me/?text=${msg}`, '_blank')
}

export default function MisPedidosPage() {
  const { pedidos, cargando, error, recargar } = usePedidos()
  const colaOffline = useVentasStore((s) => s.colaOffline)
  const sincronizarCola = useVentasStore((s) => s.sincronizarCola)
  const empresa = useAuthStore((s) => s.empresa)
  const rol = useAuthStore((s) => s.perfil?.rol)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  async function cambiarEstado(pedidoId: string, nuevoEstado: EstadoPedido) {
    setActualizando(pedidoId)
    try {
      const { error: err } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedidoId)

      if (err) {
        console.error('Error Supabase:', err)
        throw new Error(err.message || 'Error desconocido')
      }
      await recargar()
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : JSON.stringify(e)
      console.error('Error completo:', mensaje)
      alert('Error al actualizar:\n' + mensaje)
    } finally {
      setActualizando(null)
    }
  }

  async function forzarSync() {
    setSincronizando(true)
    try {
      console.log('[MisPedidosPage] Forzando sincronización...')
      await sincronizarCola()
      console.log('[MisPedidosPage] Sincronización completada')
      await recargar()
    } catch (err) {
      console.error('[MisPedidosPage] Error en sync:', err)
      alert('Error al sincronizar: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSincronizando(false)
    }
  }

  const pendientesSync = colaOffline.filter((p) => p.estado_sync !== 'sincronizado')

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

  const hayDatos = pendientesSync.length > 0 || pedidos.length > 0

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {pedidos.length + pendientesSync.length} pedidos en total
        </p>
        <div className="flex gap-2">
          {pendientesSync.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={forzarSync}
              loading={sincronizando}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sincronizar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={recargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Pedidos offline pendientes */}
      {pendientesSync.map((p) => (
        <div
          key={p.uuid_offline}
          className="bg-[var(--color-surface)] rounded-2xl border border-amber-200 p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--color-ink)] truncate">{p.cliente_nombre}</p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{formatFecha(p.creado_en)}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                tone={p.estado_sync === 'error' ? 'danger' : 'warning'}
                className="flex items-center gap-1"
              >
                <WifiOff className="w-3 h-3" />
                {p.estado_sync === 'error' ? 'Error sync' : 'Pendiente sync'}
              </Badge>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{formatMoneda(p.total)}</p>
            </div>
          </div>
          {p.estado_sync === 'error' && p.ultimo_error && (
            <p className="mt-2 text-xs text-red-600 truncate">{p.ultimo_error}</p>
          )}
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            {p.detalles.length} {p.detalles.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>
      ))}

      {/* Pedidos sincronizados desde BD */}
      {pedidos.map((pedido) => {
        const badge = estadoBadge[pedido.estado]
        const esAdmin = rol === 'admin'
        const puedeConfirmar = esAdmin && pedido.estado === 'pendiente'
        const puedeFacturar = esAdmin && (pedido.estado === 'confirmado' || pedido.estado === 'pendiente')

        return (
          <div
            key={pedido.id}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-ink)] truncate">
                  {pedido.clientes?.razon_social ?? '—'}
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  #{pedido.numero_pedido} · {formatFecha(pedido.fecha_pedido)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge tone={badge.tone}>{badge.label}</Badge>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{formatMoneda(pedido.total)}</p>
              </div>
            </div>

            {/* Botones de acción para admin */}
            {esAdmin && (puedeConfirmar || puedeFacturar) && (
              <div className="mt-3 flex gap-2">
                {puedeConfirmar && (
                  <button
                    onClick={() => cambiarEstado(pedido.id, 'confirmado')}
                    disabled={actualizando === pedido.id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirmar
                  </button>
                )}
                {puedeFacturar && (
                  <button
                    onClick={() => cambiarEstado(pedido.id, 'facturado')}
                    disabled={actualizando === pedido.id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Facturar
                  </button>
                )}
              </div>
            )}

            {/* Botón WhatsApp */}
            {(pedido.estado === 'facturado' || pedido.estado === 'entregado') && (
              <div className="mt-3">
                <button
                  onClick={() => compartirPedidoWA(pedido, empresa?.nombre ?? '')}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Compartir por WhatsApp
                </button>
              </div>
            )}
          </div>
        )
      })}

      {!hayDatos && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">Sin pedidos todavía</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Los pedidos que tomes aparecerán acá.
          </p>
        </div>
      )}
    </div>
  )
}
