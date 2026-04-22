import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Users, Search, RefreshCw, AlertCircle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { usePlan } from '@/hooks/usePlan'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { Database } from '@/types/database'

type DiaSemana = Database['public']['Enums']['dia_semana']
type CondicionIva = Database['public']['Enums']['condicion_iva']

type ClienteRow = Database['public']['Tables']['clientes']['Row'] & {
  zonas: { nombre: string } | null
  perfiles: { nombre_completo: string } | null
  listas_precios: { nombre: string } | null
}

type ZonaOption    = { id: string; nombre: string }
type PerfilOption  = { id: string; nombre_completo: string }
type ListaOption   = { id: string; nombre: string }

interface Form {
  razon_social: string
  nombre_fantasia: string
  codigo: string
  cuit: string
  condicion_iva: CondicionIva
  direccion: string
  localidad: string
  telefono: string
  email: string
  zona_id: string
  dia_visita: DiaSemana | ''
  preventista_id: string
  lista_precios_id: string
  limite_credito: string
  observaciones: string
}

const EMPTY: Form = {
  razon_social: '', nombre_fantasia: '', codigo: '', cuit: '',
  condicion_iva: 'consumidor_final', direccion: '', localidad: '',
  telefono: '', email: '', zona_id: '', dia_visita: '',
  preventista_id: '', lista_precios_id: '', limite_credito: '0', observaciones: '',
}

const DIAS: { value: DiaSemana; label: string }[] = [
  { value: 'lunes',     label: 'Lunes' },
  { value: 'martes',    label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves',    label: 'Jueves' },
  { value: 'viernes',   label: 'Viernes' },
  { value: 'sabado',    label: 'Sábado' },
]

const CONDICIONES_IVA: { value: CondicionIva; label: string }[] = [
  { value: 'consumidor_final',      label: 'Consumidor Final' },
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributo',           label: 'Monotributo' },
  { value: 'exento',                label: 'Exento' },
  { value: 'no_responsable',        label: 'No Responsable' },
]

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export default function ClientesPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const { superaLimite, limites } = usePlan()
  const [clientes, setClientes]         = useState<ClienteRow[]>([])
  const [zonas, setZonas]               = useState<ZonaOption[]>([])
  const [preventistas, setPreventistas] = useState<PerfilOption[]>([])
  const [listas, setListas]             = useState<ListaOption[]>([])
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [busqueda, setBusqueda]         = useState('')
  const [modalOpen, setModalOpen]       = useState(false)
  const [editando, setEditando]         = useState<ClienteRow | null>(null)
  const [form, setForm]                 = useState<Form>(EMPTY)
  const [guardando, setGuardando]       = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    try {
      const [
        { data: cls,  error: e1 },
        { data: zns,  error: e2 },
        { data: pvs,  error: e3 },
        { data: lsts, error: e4 },
      ] = await Promise.all([
        supabase
          .from('clientes')
          .select('*, zonas(nombre), perfiles(nombre_completo), listas_precios(nombre)')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .order('razon_social'),
        supabase.from('zonas').select('id, nombre').eq('empresa_id', empresaId).eq('activo', true).order('nombre'),
        supabase
          .from('perfiles')
          .select('id, nombre_completo')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .in('rol', ['preventista', 'supervisor'])
          .order('nombre_completo'),
        supabase.from('listas_precios').select('id, nombre').eq('empresa_id', empresaId).eq('activo', true).order('nombre'),
      ])
      if (e1) throw e1; if (e2) throw e2; if (e3) throw e3; if (e4) throw e4
      setClientes((cls as ClienteRow[]) ?? [])
      setZonas((zns as ZonaOption[]) ?? [])
      setPreventistas((pvs as PerfilOption[]) ?? [])
      setListas((lsts as ListaOption[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setCargando(false)
    }
  }, [empresaId])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null)
    setForm(EMPTY)
    setFormError(null)
    setModalOpen(true)
  }

  function abrirEditar(c: ClienteRow) {
    setEditando(c)
    setForm({
      razon_social:     c.razon_social,
      nombre_fantasia:  c.nombre_fantasia ?? '',
      codigo:           c.codigo ?? '',
      cuit:             c.cuit ?? '',
      condicion_iva:    c.condicion_iva,
      direccion:        c.direccion ?? '',
      localidad:        c.localidad ?? '',
      telefono:         c.telefono ?? '',
      email:            c.email ?? '',
      zona_id:          c.zona_id ?? '',
      dia_visita:       c.dia_visita ?? '',
      preventista_id:   c.preventista_id ?? '',
      lista_precios_id: c.lista_precios_id ?? '',
      limite_credito:   String(c.limite_credito ?? 0),
      observaciones:    c.observaciones ?? '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function guardar() {
    if (!empresaId) return
    if (!form.razon_social.trim()) {
      setFormError('La razón social es obligatoria.')
      return
    }
    if (!editando && superaLimite('max_clientes', clientes.length)) {
      setFormError(`Tu plan permite hasta ${limites.max_clientes} clientes. Actualizá tu plan para agregar más.`)
      return
    }
    setGuardando(true)
    setFormError(null)
    try {
      const payload = {
        empresa_id:       empresaId,
        razon_social:     form.razon_social.trim(),
        nombre_fantasia:  form.nombre_fantasia.trim() || null,
        codigo:           form.codigo.trim() || null,
        cuit:             form.cuit.trim() || null,
        condicion_iva:    form.condicion_iva,
        direccion:        form.direccion.trim() || null,
        localidad:        form.localidad.trim() || null,
        telefono:         form.telefono.trim() || null,
        email:            form.email.trim() || null,
        zona_id:          form.zona_id || null,
        dia_visita:       (form.dia_visita as DiaSemana) || null,
        preventista_id:   form.preventista_id || null,
        lista_precios_id: form.lista_precios_id || null,
        limite_credito:   parseFloat(form.limite_credito) || 0,
        observaciones:    form.observaciones.trim() || null,
      }
      if (editando) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', editando.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clientes').insert(payload)
        if (error) throw error
      }
      setModalOpen(false)
      cargar()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('clientes').update({ activo: false, deleted_at: new Date().toISOString() } as any).eq('id', id)
    cargar()
    setConfirmarEliminarId(null)
  }

  async function toggleActivo(c: ClienteRow) {
    await supabase.from('clientes').update({ activo: !c.activo }).eq('id', c.id)
    cargar()
  }

  const filtrados = clientes.filter(
    (c) =>
      c.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.nombre_fantasia ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.codigo ?? '').toLowerCase().includes(busqueda.toLowerCase()),
  )

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
        <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar por nombre, fantasía o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-sm"
          />
          <Button onClick={abrirCrear} leftIcon={<Plus className="w-4 h-4" />} className="ml-auto shrink-0">
            Nuevo cliente
          </Button>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden md:table-cell">Zona</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden md:table-cell">Día visita</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden lg:table-cell">Preventista</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden xl:table-cell">Lista precios</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden lg:table-cell">Saldo CC</th>
                  <th className="text-center px-4 py-3 font-medium text-[var(--color-ink-muted)]">Estado</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[var(--color-ink-muted)]">
                      {busqueda ? 'Sin resultados para la búsqueda.' : (
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 opacity-30" />
                          <span>Sin clientes cargados. Creá el primero.</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtrados.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--color-surface-soft)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-ink)]">{c.razon_social}</p>
                        {c.nombre_fantasia && (
                          <p className="text-xs text-[var(--color-ink-muted)]">{c.nombre_fantasia}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden md:table-cell">
                        {c.zonas?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden md:table-cell capitalize">
                        {c.dia_visita ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden lg:table-cell">
                        {c.perfiles?.nombre_completo ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden xl:table-cell text-sm">
                        {c.listas_precios?.nombre ?? <span className="italic opacity-60">Default</span>}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className={c.saldo_cuenta_corriente < 0 ? 'text-red-600 font-medium' : 'text-[var(--color-ink)]'}>
                          {formatARS(c.saldo_cuenta_corriente)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={c.activo ? 'success' : 'neutral'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {confirmarEliminarId === c.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-red-600 mr-1">¿Eliminar?</span>
                            <Button size="sm" variant="ghost" className="text-red-600 h-7 px-2 text-xs" onClick={() => eliminar(c.id)}>Sí</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirmarEliminarId(null)}>No</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => abrirEditar(c)} title="Editar">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleActivo(c)}
                              title={c.activo ? 'Desactivar' : 'Activar'}
                              className={c.activo ? '' : 'text-green-600'}
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setConfirmarEliminarId(c.id)} title="Eliminar" className="text-red-500 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
            {filtrados.length} de {clientes.length} clientes
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar cliente' : 'Nuevo cliente'}
        className="max-w-xl"
      >
        <div className="space-y-3">
          <Input
            label="Razón social *"
            value={form.razon_social}
            onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
            placeholder="Nombre legal o comercial"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre fantasía"
              value={form.nombre_fantasia}
              onChange={(e) => setForm({ ...form, nombre_fantasia: e.target.value })}
            />
            <Input
              label="Código interno"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              placeholder="Ej: C-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CUIT"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              placeholder="XX-XXXXXXXX-X"
            />
            <Select
              label="Condición IVA"
              value={form.condicion_iva}
              onChange={(e) => setForm({ ...form, condicion_iva: e.target.value as CondicionIva })}
            >
              {CONDICIONES_IVA.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <Input
            label="Dirección"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Localidad"
              value={form.localidad}
              onChange={(e) => setForm({ ...form, localidad: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Zona"
              value={form.zona_id}
              onChange={(e) => setForm({ ...form, zona_id: e.target.value })}
            >
              <option value="">Sin zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </Select>
            <Select
              label="Día de visita"
              value={form.dia_visita}
              onChange={(e) => setForm({ ...form, dia_visita: e.target.value as DiaSemana | '' })}
            >
              <option value="">Sin asignar</option>
              {DIAS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Preventista"
              value={form.preventista_id}
              onChange={(e) => setForm({ ...form, preventista_id: e.target.value })}
            >
              <option value="">Sin asignar</option>
              {preventistas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre_completo}</option>
              ))}
            </Select>
            <Select
              label="Lista de precios"
              value={form.lista_precios_id}
              onChange={(e) => setForm({ ...form, lista_precios_id: e.target.value })}
            >
              <option value="">Lista default</option>
              {listas.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </Select>
          </div>
          <Input
            label="Límite de crédito ($)"
            type="number"
            min="0"
            value={form.limite_credito}
            onChange={(e) => setForm({ ...form, limite_credito: e.target.value })}
          />
          <Input
            label="Observaciones"
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            placeholder="Opcional"
          />

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{formError}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={guardar} loading={guardando} className="flex-1">
              {editando ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
