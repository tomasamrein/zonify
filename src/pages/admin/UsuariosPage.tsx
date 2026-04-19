import { useState, useEffect, useCallback } from 'react'
import { Pencil, RefreshCw, AlertCircle, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { Database } from '@/types/database'

type RolUsuario = Database['public']['Enums']['rol_usuario']
type Perfil = Database['public']['Tables']['perfiles']['Row']
type Zona = Database['public']['Tables']['zonas']['Row']

const ROL_LABELS: Record<RolUsuario, string> = {
  admin:       'Admin',
  supervisor:  'Supervisor',
  preventista: 'Preventista',
  deposito:    'Depósito',
  chofer:      'Chofer',
}

const ROL_TONE: Record<RolUsuario, 'brand' | 'warning' | 'info' | 'neutral'> = {
  admin:       'brand',
  supervisor:  'warning',
  preventista: 'info',
  deposito:    'neutral',
  chofer:      'neutral',
}

interface Form {
  rol:              RolUsuario
  activo:           boolean
  telefono:         string
  zonas_asignadas:  string[]
}

export default function UsuariosPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const userId    = useAuthStore((s) => s.user?.id)
  const [perfiles, setPerfiles]   = useState<Perfil[]>([])
  const [zonas, setZonas]         = useState<Zona[]>([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando]   = useState<Perfil | null>(null)
  const [form, setForm]           = useState<Form>({ rol: 'preventista', activo: true, telefono: '', zonas_asignadas: [] })
  const [guardando, setGuardando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    try {
      const [perfilesRes, zonasRes] = await Promise.all([
        supabase
          .from('perfiles')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('nombre_completo'),
        supabase
          .from('zonas')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .order('nombre'),
      ])

      if (perfilesRes.error) throw perfilesRes.error
      if (zonasRes.error) throw zonasRes.error

      setPerfiles(perfilesRes.data ?? [])
      setZonas(zonasRes.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setCargando(false)
    }
  }, [empresaId])

  useEffect(() => { cargar() }, [cargar])

  function abrirEditar(p: Perfil) {
    setEditando(p)
    setForm({
      rol: p.rol,
      activo: p.activo,
      telefono: p.telefono ?? '',
      zonas_asignadas: p.zonas_asignadas ?? [],
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function guardar() {
    if (!editando) return
    setGuardando(true)
    setFormError(null)
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({
          rol: form.rol,
          activo: form.activo,
          telefono: form.telefono.trim() || null,
          zonas_asignadas: form.rol === 'preventista' ? form.zonas_asignadas : [],
        })
        .eq('id', editando.id)
      if (error) throw error
      setModalOpen(false)
      cargar()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
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
        <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            Para agregar nuevos usuarios, creá las credenciales en el panel de Supabase
            y asignales el <code className="font-mono text-xs bg-blue-100 px-1 rounded">empresa_id</code> en la tabla{' '}
            <code className="font-mono text-xs bg-blue-100 px-1 rounded">perfiles</code>.
          </p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden md:table-cell">Teléfono</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--color-ink-muted)]">Estado</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {perfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[var(--color-ink-muted)]">
                    Sin usuarios registrados.
                  </td>
                </tr>
              ) : (
                perfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-surface-soft)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-ink)]">
                        {p.nombre_completo}
                        {p.id === userId && (
                          <span className="ml-2 text-xs text-[var(--color-ink-muted)]">(vos)</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">{p.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={ROL_TONE[p.rol]}>{ROL_LABELS[p.rol]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden md:table-cell">
                      {p.telefono ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={p.activo ? 'success' : 'neutral'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => abrirEditar(p)}
                        title="Editar"
                        disabled={p.id === userId}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
            {perfiles.length} {perfiles.length === 1 ? 'usuario' : 'usuarios'}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar usuario"
      >
        <div className="space-y-3">
          {editando && (
            <div className="bg-[var(--color-surface-soft)] rounded-xl px-4 py-3">
              <p className="font-medium text-[var(--color-ink)]">{editando.nombre_completo}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{editando.email}</p>
            </div>
          )}
          <Select
            label="Rol"
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value as RolUsuario })}
          >
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="preventista">Preventista</option>
            <option value="deposito">Depósito</option>
            <option value="chofer">Chofer</option>
          </Select>

          {form.rol === 'preventista' && zonas.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-[var(--color-ink)]">Zonas asignadas</p>
              <div className="space-y-2 bg-[var(--color-surface-soft)] rounded-lg p-3">
                {zonas.map((zona) => (
                  <label key={zona.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.zonas_asignadas.includes(zona.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({
                            ...form,
                            zonas_asignadas: [...form.zonas_asignadas, zona.id],
                          })
                        } else {
                          setForm({
                            ...form,
                            zonas_asignadas: form.zonas_asignadas.filter((z) => z !== zona.id),
                          })
                        }
                      }}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    <span className="text-sm text-[var(--color-ink)]">{zona.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+54 11 1234-5678"
          />
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-4 h-4 rounded accent-brand-600"
            />
            <span className="text-sm text-[var(--color-ink)]">Usuario activo</span>
          </label>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{formError}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={guardar} loading={guardando} className="flex-1">
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
