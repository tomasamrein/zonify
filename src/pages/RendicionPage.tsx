import { useState, useCallback, useEffect } from 'react'
import { AlertCircle, RefreshCw, Check, X, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Cobro {
  id: string
  cliente_id: string
  monto: number
  forma_pago: string
  clientes?: { razon_social: string } | null
}

interface Rendicion {
  id: string
  preventista_id: string
  fecha: string
  total_cobrado: number
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  observaciones: string | null
  perfiles?: { nombre_completo: string; rol: string } | null
  cobros?: Cobro[]
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const estadoBadge: Record<string, 'success' | 'warning' | 'danger'> = {
  aprobada: 'success', pendiente: 'warning', rechazada: 'danger',
}

// ── Vista del chofer/preventista: cobros del día + cerrar rendición ────────────

function VistaRendicionPropia() {
  const { perfil, empresaId } = useAuthStore()
  const [cobrosHoy, setCobrosHoy] = useState<Cobro[]>([])
  const [rendicionHoy, setRendicionHoy] = useState<Rendicion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cerrando, setCerrando] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  const cargar = useCallback(async () => {
    if (!perfil || !empresaId) return
    setCargando(true)
    try {
      const [{ data: cobros }, { data: rendiciones }] = await Promise.all([
        supabase
          .from('cobros')
          .select('id, cliente_id, monto, forma_pago, clientes(razon_social)')
          .eq('preventista_id', perfil.id)
          .eq('fecha', hoy)
          .is('rendicion_id', null),
        supabase
          .from('rendiciones')
          .select('id, preventista_id, fecha, total_cobrado, estado, observaciones')
          .eq('preventista_id', perfil.id)
          .eq('fecha', hoy)
          .limit(1),
      ])
      setCobrosHoy((cobros ?? []) as Cobro[])
      setRendicionHoy((rendiciones?.[0] ?? null) as Rendicion | null)
    } finally {
      setCargando(false)
    }
  }, [perfil, empresaId, hoy])

  useEffect(() => { cargar() }, [cargar])

  async function cerrarRendicion() {
    if (!perfil || !empresaId) return
    setCerrando(true)
    try {
      const total = cobrosHoy.reduce((s, c) => s + Number(c.monto), 0)
      const { data: rend, error: errRend } = await supabase
        .from('rendiciones')
        .insert({ empresa_id: empresaId, preventista_id: perfil.id, fecha: hoy, total_cobrado: total, estado: 'pendiente' })
        .select()
        .single()
      if (errRend) throw errRend

      await supabase
        .from('cobros')
        .update({ rendicion_id: rend.id })
        .eq('preventista_id', perfil.id)
        .eq('fecha', hoy)
        .is('rendicion_id', null)

      await cargar()
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : (e as any)?.message ?? JSON.stringify(e)))
    } finally {
      setCerrando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalHoy = cobrosHoy.reduce((s, c) => s + Number(c.monto), 0)
  const porForma = cobrosHoy.reduce<Record<string, number>>((acc, c) => {
    acc[c.forma_pago] = (acc[c.forma_pago] ?? 0) + Number(c.monto)
    return acc
  }, {})

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-4">
      {/* Estado de rendición del día */}
      {rendicionHoy ? (
        <div className={`rounded-2xl border p-4 ${rendicionHoy.estado === 'aprobada' ? 'bg-emerald-50 border-emerald-200' : rendicionHoy.estado === 'rechazada' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--color-ink)]">Rendición del día</p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{formatFecha(rendicionHoy.fecha)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--color-ink)]">{formatARS(rendicionHoy.total_cobrado)}</p>
              <Badge tone={estadoBadge[rendicionHoy.estado]}>
                {rendicionHoy.estado.charAt(0).toUpperCase() + rendicionHoy.estado.slice(1)}
              </Badge>
            </div>
          </div>
          {rendicionHoy.observaciones && (
            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{rendicionHoy.observaciones}</p>
          )}
        </div>
      ) : cobrosHoy.length > 0 ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-[var(--color-ink)]">Cobros del día</p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{cobrosHoy.length} cobro{cobrosHoy.length > 1 ? 's' : ''} sin rendir</p>
            </div>
            <p className="text-xl font-bold text-[var(--color-ink)]">{formatARS(totalHoy)}</p>
          </div>

          {/* Desglose por forma de pago */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(porForma).map(([forma, monto]) => (
              <div key={forma} className="bg-[var(--color-surface-soft)] rounded-xl p-2 text-center">
                <p className="text-xs text-[var(--color-ink-muted)] capitalize">{forma}</p>
                <p className="text-sm font-bold text-[var(--color-ink)] mt-0.5">{formatARS(monto)}</p>
              </div>
            ))}
          </div>

          <Button
            variant="primary" className="w-full"
            loading={cerrando}
            leftIcon={<Check className="w-4 h-4" />}
            onClick={cerrarRendicion}
          >
            Cerrar rendición del día
          </Button>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">Sin cobros hoy</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">Los cobros que registres aparecerán acá.</p>
        </div>
      )}

      {/* Lista de cobros del día */}
      {cobrosHoy.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">Detalle</p>
          {cobrosHoy.map((cobro) => (
            <div key={cobro.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">{cobro.clientes?.razon_social ?? '—'}</p>
                <p className="text-xs text-[var(--color-ink-muted)] capitalize mt-0.5">{cobro.forma_pago}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{formatARS(cobro.monto)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Vista admin: todas las rendiciones con aprobación ─────────────────────────

function VistaAdminRendiciones() {
  const { empresaId } = useAuthStore()
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [selected, setSelected] = useState<Rendicion | null>(null)
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar')
  const [obsModal, setObsModal] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('rendiciones')
        .select(`id, preventista_id, fecha, total_cobrado, estado, observaciones,
          perfiles(nombre_completo, rol),
          cobros(id, cliente_id, monto, forma_pago, clientes(razon_social))`)
        .eq('empresa_id', empresaId)
        .gte('fecha', fechaFiltro)
        .order('fecha', { ascending: false })
      if (err) throw err
      setRendiciones((data ?? []) as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setCargando(false)
    }
  }, [empresaId, fechaFiltro])

  useEffect(() => { cargar() }, [cargar])

  async function cambiarEstado() {
    if (!selected) return
    setProcesando(true)
    try {
      const { error: err } = await supabase
        .from('rendiciones')
        .update({ estado: accion === 'aprobar' ? 'aprobada' : 'rechazada', observaciones: obsModal || null })
        .eq('id', selected.id)
      if (err) throw err
      setModalOpen(false)
      setSelected(null)
      setObsModal('')
      await cargar()
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : (e as any)?.message ?? JSON.stringify(e)))
    } finally {
      setProcesando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalGral = rendiciones.reduce((s, r) => s + Number(r.total_cobrado), 0)
  const pendientes = rendiciones.filter((r) => r.estado === 'pendiente')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">Rendiciones de Caja</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">Aprobación de cobros diarios</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date" value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-ink-muted)] mb-1">Total cobrado</p>
          <p className="text-2xl font-bold text-[var(--color-ink)]">{formatARS(totalGral)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
          <p className="text-xs text-amber-600 mb-1">Pendientes de aprobación</p>
          <p className="text-2xl font-bold text-amber-700">{pendientes.length}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-2xl border border-red-200 text-sm text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-3">
        {rendiciones.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
            <p className="text-[var(--color-ink-muted)]">Sin rendiciones en este período</p>
          </div>
        ) : rendiciones.map((rend) => (
          <div key={rend.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--color-ink)]">{rend.perfiles?.nombre_completo ?? '—'}</p>
                  {rend.perfiles?.rol && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-surface-soft)] text-[var(--color-ink-muted)] capitalize">
                      {rend.perfiles.rol}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  {formatFecha(rend.fecha)} · {rend.cobros?.length ?? 0} cobro(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[var(--color-ink)]">{formatARS(rend.total_cobrado)}</p>
                <Badge tone={estadoBadge[rend.estado] ?? 'neutral'} className="mt-1">
                  {rend.estado.charAt(0).toUpperCase() + rend.estado.slice(1)}
                </Badge>
              </div>
            </div>

            {rend.cobros && rend.cobros.length > 0 && (
              <div className="mb-3 bg-[var(--color-surface-soft)] rounded-lg p-2 text-xs space-y-1">
                {rend.cobros.map((c) => (
                  <div key={c.id} className="flex justify-between text-[var(--color-ink-muted)]">
                    <span>{c.clientes?.razon_social ?? '—'} <span className="capitalize">({c.forma_pago})</span></span>
                    <span className="font-medium">{formatARS(c.monto)}</span>
                  </div>
                ))}
              </div>
            )}

            {rend.observaciones && (
              <p className="mb-3 text-xs text-[var(--color-ink-muted)] bg-blue-50 rounded-lg p-2">{rend.observaciones}</p>
            )}

            {rend.estado === 'pendiente' && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelected(rend); setAccion('rechazar'); setObsModal(''); setModalOpen(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <X className="w-3.5 h-3.5" /> Rechazar
                </button>
                <button
                  onClick={() => { setSelected(rend); setAccion('aprobar'); setObsModal(''); setModalOpen(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  <Check className="w-3.5 h-3.5" /> Aprobar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${accion === 'aprobar' ? 'Aprobar' : 'Rechazar'} rendición`}>
        <div className="space-y-4 p-4">
          {selected && (
            <>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{selected.perfiles?.nombre_completo}</p>
                  {selected.perfiles?.rol && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 capitalize">
                      {selected.perfiles.rol}
                    </span>
                  )}
                </div>
                <p>{formatFecha(selected.fecha)} · {formatARS(selected.total_cobrado)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--color-ink)] block mb-1">Observaciones (opcional)</label>
                <textarea
                  value={obsModal} onChange={(e) => setObsModal(e.target.value)}
                  placeholder={accion === 'aprobar' ? 'Agregar nota...' : 'Motivo del rechazo...'}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium">Cancelar</button>
                <button
                  onClick={cambiarEstado} disabled={procesando}
                  className={`flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${accion === 'aprobar' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {procesando ? 'Procesando…' : accion === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ── Entry point: delega según rol ─────────────────────────────────────────────

export default function RendicionPage() {
  const rol = useAuthStore((s) => s.perfil?.rol)
  if (rol === 'chofer' || rol === 'preventista') return <VistaRendicionPropia />
  return <VistaAdminRendiciones />
}
