import { useState } from 'react'
import { AlertCircle, RefreshCw, DollarSign, Check } from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ClienteParaCobrar {
  id: string
  razon_social: string
  saldo_cuenta_corriente: number | null
  pedidos?: Array<{
    id: string
    numero_pedido: number
    total: number
  }>
}

interface FormularioCobro {
  monto: string
  forma_pago: 'efectivo' | 'transferencia' | 'cheque'
  pedido_id: string
  observaciones: string
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export default function CobrosPage() {
  const { clientes: clientesBase, cargando, error, recargar } = useClientes({ soloHoy: true })
  const { empresaId, perfil } = useAuthStore()
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteParaCobrar | null>(null)
  const [modalCobro, setModalCobro] = useState(false)
  const [forma, setForma] = useState<FormularioCobro>({
    monto: '',
    forma_pago: 'efectivo',
    pedido_id: '',
    observaciones: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [cerrandoRendicion, setCerrandoRendicion] = useState(false)
  const [cobrosHoy, setCobrosHoy] = useState<Array<{ cliente_id: string; monto: number }>>([])

  // Cargar pedidos del cliente para el select
  const cargarPedidosCliente = async (clienteId: string) => {
    if (!empresaId) return
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, total')
      .eq('cliente_id', clienteId)
      .eq('estado', 'facturado')
    return data || []
  }

  const abrirModalCobro = async (cliente: typeof clientesBase[0]) => {
    const pedidos = await cargarPedidosCliente(cliente.id)
    setClienteSeleccionado({
      ...cliente,
      saldo_cuenta_corriente: cliente.saldo_cuenta_corriente,
      pedidos,
    } as any)
    setForma({ monto: '', forma_pago: 'efectivo', pedido_id: pedidos[0]?.id || '', observaciones: '' })
    setModalCobro(true)
  }

  const registrarCobro = async () => {
    if (!clienteSeleccionado || !empresaId || !perfil) return
    setGuardando(true)

    try {
      const monto = parseFloat(forma.monto)
      if (!monto || monto <= 0) throw new Error('Monto debe ser mayor a 0')

      const { error: err } = await supabase.from('cobros').insert({
        empresa_id: empresaId,
        cliente_id: clienteSeleccionado.id,
        preventista_id: perfil.id,
        pedido_id: forma.pedido_id || null,
        monto,
        forma_pago: forma.forma_pago,
        observaciones: forma.observaciones,
        fecha: new Date().toISOString().split('T')[0],
      })

      if (err) throw err

      setCobrosHoy([...cobrosHoy, { cliente_id: clienteSeleccionado.id, monto }])
      setModalCobro(false)
      setClienteSeleccionado(null)
      setForma({ monto: '', forma_pago: 'efectivo', pedido_id: '', observaciones: '' })
      await recargar()
    } catch (e) {
      alert('Error al registrar cobro: ' + (e instanceof Error ? e.message : 'Desconocido'))
    } finally {
      setGuardando(false)
    }
  }

  const cerrarRendicion = async () => {
    if (!empresaId || !perfil) return
    setCerrandoRendicion(true)

    try {
      const totalCobrado = cobrosHoy.reduce((sum, c) => sum + c.monto, 0)

      const { data: rendData, error: rendErr } = await supabase
        .from('rendiciones')
        .insert({
          empresa_id: empresaId,
          preventista_id: perfil.id,
          fecha: new Date().toISOString().split('T')[0],
          total_cobrado: totalCobrado,
          estado: 'pendiente',
        })
        .select()

      if (rendErr || !rendData?.[0]) throw rendErr || new Error('Error al crear rendición')

      // Asociar cobros a la rendición
      await supabase
        .from('cobros')
        .update({ rendicion_id: rendData[0].id })
        .eq('preventista_id', perfil.id)
        .eq('fecha', new Date().toISOString().split('T')[0])
        .is('rendicion_id', null)

      setCobrosHoy([])
      alert(`Rendición cerrada: ${formatARS(totalCobrado)}`)
      await recargar()
    } catch (e) {
      alert('Error al cerrar rendición: ' + (e instanceof Error ? e.message : 'Desconocido'))
    } finally {
      setCerrandoRendicion(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalCobradoHoy = cobrosHoy.reduce((sum, c) => sum + c.monto, 0)

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {clientesBase.length} cliente(s) para hoy
        </p>
        <Button size="sm" variant="ghost" onClick={recargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Actualizar
        </Button>
      </div>

      {/* KPI: Total cobrado hoy */}
      {totalCobradoHoy > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600">Cobrado hoy</p>
            <p className="text-xl font-bold text-emerald-700">{formatARS(totalCobradoHoy)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-600">{cobrosHoy.length} cobro(s)</p>
            <Button
              size="sm"
              variant="primary"
              onClick={cerrarRendicion}
              disabled={cerrandoRendicion}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              {cerrandoRendicion ? 'Cerrando…' : 'Cerrar rendición'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-[var(--color-ink-muted)]">{error}</p>
        </div>
      )}

      {clientesBase.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">Sin visitas para hoy</p>
        </div>
      )}

      {clientesBase.map((cliente) => {
        const saldo = cliente.saldo_cuenta_corriente ?? 0
        const yaCobrado = cobrosHoy.find((c) => c.cliente_id === cliente.id)
        return (
          <div
            key={cliente.id}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-ink)] truncate">{cliente.razon_social}</p>
                {saldo !== 0 && (
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    {saldo > 0 ? 'Debe: ' : 'Acreedor: '}
                    {formatARS(Math.abs(saldo))}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant={yaCobrado ? 'outline' : 'primary'}
                onClick={() => abrirModalCobro(cliente)}
                leftIcon={<DollarSign className="w-3.5 h-3.5" />}
              >
                {yaCobrado ? 'Cobrado' : 'Cobrar'}
              </Button>
            </div>
          </div>
        )
      })}

      {/* Modal de cobro */}
      <Modal open={modalCobro} onClose={() => setModalCobro(false)} title={`Registrar cobro: ${clienteSeleccionado?.razon_social}`}>
        <div className="space-y-4 p-4">
          <div>
            <label className="text-sm font-semibold text-[var(--color-ink)] block mb-1">Monto</label>
            <input
              type="number"
              value={forma.monto}
              onChange={(e) => setForma({ ...forma, monto: e.target.value })}
              placeholder="0.00"
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--color-ink)] block mb-1">Forma de pago</label>
            <select
              value={forma.forma_pago}
              onChange={(e) => setForma({ ...forma, forma_pago: e.target.value as any })}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {clienteSeleccionado?.pedidos && clienteSeleccionado.pedidos.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-[var(--color-ink)] block mb-1">Pedido (opcional)</label>
              <select
                value={forma.pedido_id}
                onChange={(e) => setForma({ ...forma, pedido_id: e.target.value })}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Sin pedido asociado</option>
                {clienteSeleccionado.pedidos.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pedido #{p.numero_pedido} - {formatARS(p.total)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-[var(--color-ink)] block mb-1">Observaciones</label>
            <textarea
              value={forma.observaciones}
              onChange={(e) => setForma({ ...forma, observaciones: e.target.value })}
              placeholder="Notas opcionales"
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setModalCobro(false)}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={registrarCobro}
              disabled={guardando || !forma.monto}
              className="flex-1 px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 text-sm font-medium"
            >
              {guardando ? 'Registrando…' : 'Registrar cobro'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
