import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Map, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { usePlan } from '@/hooks/usePlan'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { Zona, Database } from '@/types/database'

type DiaSemana = Database['public']['Enums']['dia_semana']

interface Form {
  nombre: string
  dia_visita: DiaSemana | ''
  descripcion: string
}

const EMPTY: Form = { nombre: '', dia_visita: '', descripcion: '' }

const DIAS: { value: DiaSemana; label: string }[] = [
  { value: 'lunes',     label: 'Lunes' },
  { value: 'martes',    label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves',    label: 'Jueves' },
  { value: 'viernes',   label: 'Viernes' },
  { value: 'sabado',    label: 'Sábado' },
]

export default function ZonasPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const { superaLimite, limites } = usePlan()
  const [zonas, setZonas]         = useState<Zona[]>([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [busqueda, setBusqueda]   = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando]   = useState<Zona | null>(null)
  const [form, setForm]           = useState<Form>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('zonas')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nombre')
      if (err) throw err
      setZonas(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar zonas')
    } finally {
      setCargando(false)
    }
  }, [empresaId])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    if (superaLimite('max_zonas', zonas.length)) {
      setError(`Tu plan permite hasta ${limites.max_zonas} zonas. Actualizá tu plan para agregar más.`)
      return
    }
    setEditando(null)
    setForm(EMPTY)
    setFormError(null)
    setModalOpen(true)
  }

  function abrirEditar(z: Zona) {
    setEditando(z)
    setForm({ nombre: z.nombre, dia_visita: z.dia_visita, descripcion: z.descripcion ?? '' })
    setFormError(null)
    setModalOpen(true)
  }

  async function guardar() {
    if (!empresaId) return
    if (!form.nombre.trim() || !form.dia_visita) {
      setFormError('Nombre y día de visita son obligatorios.')
      return
    }
    setGuardando(true)
    setFormError(null)
    try {
      const payload = {
        empresa_id:  empresaId,
        nombre:      form.nombre.trim(),
        dia_visita:  form.dia_visita as DiaSemana,
        descripcion: form.descripcion.trim() || null,
      }
      if (editando) {
        const { error } = await supabase.from('zonas').update(payload).eq('id', editando.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('zonas').insert(payload)
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

  async function toggleActivo(z: Zona) {
    await supabase.from('zonas').update({ activo: !z.activo }).eq('id', z.id)
    cargar()
  }

  const filtradas = zonas.filter((z) => z.nombre.toLowerCase().includes(busqueda.toLowerCase()))

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
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar zona..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-xs"
          />
          <Button onClick={abrirCrear} leftIcon={<Plus className="w-4 h-4" />} className="ml-auto shrink-0">
            Nueva zona
          </Button>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Día de visita</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden md:table-cell">Descripción</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--color-ink-muted)]">Estado</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[var(--color-ink-muted)]">
                    {busqueda ? 'Sin resultados.' : (
                      <div className="flex flex-col items-center gap-2">
                        <Map className="w-8 h-8 opacity-30" />
                        <span>Sin zonas cargadas. Creá la primera.</span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtradas.map((z) => (
                  <tr key={z.id} className="hover:bg-[var(--color-surface-soft)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{z.nombre}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] capitalize">{z.dia_visita}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden md:table-cell">
                      {z.descripcion ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={z.activo ? 'success' : 'neutral'}>{z.activo ? 'Activa' : 'Inactiva'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => abrirEditar(z)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleActivo(z)}
                          title={z.activo ? 'Desactivar' : 'Activar'}
                          className={z.activo ? '' : 'text-green-600'}
                        >
                          <Map className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
            {filtradas.length} de {zonas.length} zonas
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar zona' : 'Nueva zona'}
      >
        <div className="space-y-3">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Zona Norte"
          />
          <Select
            label="Día de visita *"
            value={form.dia_visita}
            onChange={(e) => setForm({ ...form, dia_visita: e.target.value as DiaSemana | '' })}
          >
            <option value="">Seleccionar día</option>
            {DIAS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
              {editando ? 'Guardar cambios' : 'Crear zona'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
