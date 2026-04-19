import { useState, useMemo } from 'react'
import { AlertCircle, RefreshCw, Truck, CheckCircle2, MapPin, Phone, ChevronDown, ChevronUp, DollarSign, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePedidosPorEstado, type PedidoConDetalles } from '@/hooks/usePedidosPorEstado'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

function formatMoneda(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

type FormaPago = 'efectivo' | 'transferencia' | 'cheque'

interface ModalCobro {
  pedidoId: string
  clienteNombre: string
  totalPedido: number
}

function PedidoCard({
  pedido, entregado, expandido, onToggle, onConfirmar, confirmando,
}: {
  pedido: PedidoConDetalles
  entregado: boolean
  expandido: boolean
  onToggle: () => void
  onConfirmar?: () => void
  confirmando?: boolean
}) {
  const cliente = pedido.clientes
  const totalItems = pedido.pedido_detalles?.reduce((acc, d) => acc + d.cantidad, 0) ?? 0

  return (
    <div className={cn(
      'bg-[var(--color-surface)] rounded-2xl border shadow-[var(--shadow-card)] overflow-hidden',
      entregado ? 'border-emerald-200 opacity-75' : 'border-[var(--color-border)]',
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--color-ink)] truncate">{cliente?.razon_social ?? '—'}</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              #{pedido.numero_pedido} · {formatFecha(pedido.fecha_pedido)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge tone={entregado ? 'success' : 'info'}>{entregado ? 'Entregado' : 'Pendiente'}</Badge>
            <p className="text-sm font-semibold text-[var(--color-ink)]">{formatMoneda(pedido.total)}</p>
          </div>
        </div>

        {!entregado && (
          <div className="mt-2 space-y-1">
            {cliente?.direccion && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{cliente.direccion}{cliente.localidad ? `, ${cliente.localidad}` : ''}</span>
              </div>
            )}
            {cliente?.telefono && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <a href={`tel:${cliente.telefono}`} className="hover:text-brand-600">{cliente.telefono}</a>
              </div>
            )}
          </div>
        )}

        <button onClick={onToggle} className="mt-3 flex items-center gap-1 text-xs text-brand-600 font-medium">
          {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
        </button>

        {expandido && pedido.pedido_detalles && (
          <div className="mt-3 space-y-1.5 border-t border-[var(--color-border)] pt-3">
            {pedido.pedido_detalles.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink)] truncate flex-1">{d.productos?.nombre ?? d.producto_id}</span>
                <span className="ml-3 font-semibold tabular-nums text-[var(--color-ink)] shrink-0">× {d.cantidad}</span>
              </div>
            ))}
          </div>
        )}

        {!entregado && (
          <Button
            variant="primary" size="sm" className="w-full mt-3"
            loading={confirmando}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={onConfirmar}
          >
            Confirmar entrega
          </Button>
        )}
      </div>
    </div>
  )
}

export default function EntregasPage() {
  const { pedidos, cargando, error, recargar } = usePedidosPorEstado(['facturado', 'entregado'])
  const { perfil, empresaId } = useAuthStore()
  const [expandido, setExpandido] = useState<string | null>(null)
  const [entregando, setEntregando] = useState<string | null>(null)
  const [modalCobro, setModalCobro] = useState<ModalCobro | null>(null)
  const [monto, setMonto] = useState('')
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo')
  const [registrandoCobro, setRegistrandoCobro] = useState(false)

  const hoy = new Date().toDateString()

  const { pendientes, entregadosHoy } = useMemo(() => ({
    pendientes: pedidos.filter((p) => p.estado === 'facturado'),
    entregadosHoy: pedidos.filter(
      (p) => p.estado === 'entregado' && new Date(p.fecha_pedido).toDateString() === hoy,
    ),
  }), [pedidos, hoy])

  const totalEntregadoHoy = useMemo(
    () => entregadosHoy.reduce((acc, p) => acc + Number(p.total), 0),
    [entregadosHoy],
  )

  async function confirmarEntrega(pedido: PedidoConDetalles) {
    setEntregando(pedido.id)
    try {
      const { error: err } = await supabase
        .from('pedidos').update({ estado: 'entregado' }).eq('id', pedido.id)
      if (err) throw err
      await recargar()
      setModalCobro({
        pedidoId: pedido.id,
        clienteNombre: pedido.clientes?.razon_social ?? 'Cliente',
        totalPedido: Number(pedido.total),
      })
      setMonto(String(pedido.total))
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : (e as any)?.message ?? JSON.stringify(e)))
    } finally {
      setEntregando(null)
    }
  }

  async function registrarCobroConClienteId() {
    if (!modalCobro || !perfil || !empresaId) return
    setRegistrandoCobro(true)
    try {
      const montoNum = parseFloat(monto)
      if (!montoNum || montoNum <= 0) throw new Error('Monto inválido')

      const { data: pedidoDB } = await supabase
        .from('pedidos').select('cliente_id').eq('id', modalCobro.pedidoId).single()

      const { error: err } = await supabase.from('cobros').insert({
        empresa_id: empresaId,
        cliente_id: pedidoDB?.cliente_id,
        preventista_id: perfil.id,
        pedido_id: modalCobro.pedidoId,
        monto: montoNum,
        forma_pago: formaPago,
        fecha: new Date().toISOString().split('T')[0],
      })
      if (err) throw err
      setModalCobro(null)
    } catch (e) {
      alert('Error al registrar cobro: ' + (e instanceof Error ? e.message : (e as any)?.message ?? JSON.stringify(e)))
    } finally {
      setRegistrandoCobro(false)
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
        <Button size="sm" variant="outline" onClick={recargar} leftIcon={<RefreshCw className="w-4 h-4" />}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {pendientes.length === 0 ? 'Sin entregas pendientes' : `${pendientes.length} pendiente${pendientes.length > 1 ? 's' : ''}`}
        </p>
        <Button size="sm" variant="ghost" onClick={recargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Actualizar
        </Button>
      </div>

      {entregadosHoy.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              {entregadosHoy.length} {entregadosHoy.length === 1 ? 'entrega' : 'entregas'} realizadas hoy
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">Total: {formatMoneda(totalEntregadoHoy)}</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
        </div>
      )}

      {pendientes.length === 0 && entregadosHoy.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">Sin entregas</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">No hay pedidos asignados para entregar.</p>
        </div>
      )}

      {pendientes.map((pedido) => (
        <PedidoCard
          key={pedido.id} pedido={pedido} entregado={false}
          expandido={expandido === pedido.id}
          onToggle={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
          onConfirmar={() => confirmarEntrega(pedido)}
          confirmando={entregando === pedido.id}
        />
      ))}

      {entregadosHoy.length > 0 && (
        <>
          <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide pt-2">
            Entregados hoy
          </p>
          {entregadosHoy.map((pedido) => (
            <PedidoCard
              key={pedido.id} pedido={pedido} entregado={true}
              expandido={expandido === pedido.id}
              onToggle={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
            />
          ))}
        </>
      )}

      {/* Modal cobro post-entrega */}
      {modalCobro && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--color-surface)] rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-ink)]">Registrar cobro</p>
              <button onClick={() => setModalCobro(null)}>
                <X className="w-5 h-5 text-[var(--color-ink-muted)]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-[var(--color-ink-muted)]">{modalCobro.clienteNombre}</p>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1.5">Monto cobrado</label>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full border border-[var(--color-border-strong)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  Total del pedido: {formatMoneda(modalCobro.totalPedido)}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1.5">Forma de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['efectivo', 'transferencia', 'cheque'] as FormaPago[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormaPago(f)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-medium border transition-colors',
                        formaPago === f
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]',
                      )}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModalCobro(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
                >
                  Omitir
                </button>
                <Button
                  variant="primary" className="flex-1"
                  loading={registrandoCobro}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                  onClick={registrarCobroConClienteId}
                >
                  Cobrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
