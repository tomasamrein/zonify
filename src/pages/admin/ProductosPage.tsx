import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Package, Search, RefreshCw, AlertCircle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { Producto, Categoria, UnidadMedida } from '@/types/database'

type ProductoRow = Producto & {
  categorias: { nombre: string } | null
  unidades_medida: { codigo: string } | null
}

interface Form {
  codigo_interno: string
  nombre: string
  descripcion: string
  categoria_id: string
  unidad_medida_id: string
  unidades_por_bulto: string
  costo: string
  iva_porcentaje: string
  stock_minimo: string
}

const EMPTY: Form = {
  codigo_interno: '', nombre: '', descripcion: '',
  categoria_id: '', unidad_medida_id: '',
  unidades_por_bulto: '1', costo: '0', iva_porcentaje: '21', stock_minimo: '0',
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export default function ProductosPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const [productos, setProductos] = useState<ProductoRow[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<ProductoRow | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    try {
      const [{ data: prods, error: e1 }, { data: cats, error: e2 }, { data: units, error: e3 }] =
        await Promise.all([
          supabase
            .from('productos')
            .select('*, categorias(nombre), unidades_medida(codigo)')
            .eq('empresa_id', empresaId)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .is('deleted_at' as any, null)
            .order('nombre'),
          supabase.from('categorias').select('*').eq('empresa_id', empresaId).eq('activo', true).order('nombre'),
          supabase.from('unidades_medida').select('*').eq('activo', true).order('nombre'),
        ])
      if (e1) throw e1
      if (e2) throw e2
      if (e3) throw e3
      setProductos((prods as ProductoRow[]) ?? [])
      setCategorias(cats ?? [])
      setUnidades(units ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
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

  function abrirEditar(p: ProductoRow) {
    setEditando(p)
    setForm({
      codigo_interno: p.codigo_interno,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      categoria_id: p.categoria_id ?? '',
      unidad_medida_id: p.unidad_medida_id,
      unidades_por_bulto: String(p.unidades_por_bulto),
      costo: String(p.costo),
      iva_porcentaje: String(p.iva_porcentaje),
      stock_minimo: String(p.stock_minimo),
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function guardar() {
    if (!empresaId) return
    if (!form.codigo_interno.trim() || !form.nombre.trim() || !form.unidad_medida_id) {
      setFormError('Código, nombre y unidad de medida son obligatorios.')
      return
    }
    setGuardando(true)
    setFormError(null)
    try {
      const payload = {
        empresa_id: empresaId,
        codigo_interno: form.codigo_interno.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        categoria_id: form.categoria_id || null,
        unidad_medida_id: form.unidad_medida_id,
        unidades_por_bulto: parseInt(form.unidades_por_bulto) || 1,
        costo: parseFloat(form.costo) || 0,
        iva_porcentaje: parseFloat(form.iva_porcentaje) || 21,
        stock_minimo: parseFloat(form.stock_minimo) || 0,
      }
      if (editando) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editando.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('productos').insert(payload)
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
    await supabase.from('productos').update({ activo: false, deleted_at: new Date().toISOString() } as any).eq('id', id)
    cargar()
    setConfirmarEliminarId(null)
  }

  async function toggleActivo(p: ProductoRow) {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    cargar()
  }

  const filtrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo_interno.toLowerCase().includes(busqueda.toLowerCase()),
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
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-sm"
          />
          <Button onClick={abrirCrear} leftIcon={<Plus className="w-4 h-4" />} className="ml-auto shrink-0">
            Nuevo producto
          </Button>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden lg:table-cell">Unidad</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden md:table-cell">Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden lg:table-cell">Costo</th>
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
                          <Package className="w-8 h-8 opacity-30" />
                          <span>Sin productos cargados. Creá el primero.</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtrados.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--color-surface-soft)] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-muted)]">{p.codigo_interno}</td>
                      <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{p.nombre}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden md:table-cell">
                        {p.categorias?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden lg:table-cell">
                        {p.unidades_medida?.codigo ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className={p.stock_actual <= p.stock_minimo ? 'text-red-600 font-medium' : 'text-[var(--color-ink)]'}>
                          {p.stock_actual}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-[var(--color-ink-muted)]">
                        {formatARS(p.costo)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={p.activo ? 'success' : 'neutral'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {confirmarEliminarId === p.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-red-600 mr-1">¿Eliminar?</span>
                            <Button size="sm" variant="ghost" className="text-red-600 h-7 px-2 text-xs" onClick={() => eliminar(p.id)}>Sí</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirmarEliminarId(null)}>No</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => abrirEditar(p)} title="Editar">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleActivo(p)}
                              title={p.activo ? 'Desactivar' : 'Activar'}
                              className={p.activo ? '' : 'text-green-600'}
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setConfirmarEliminarId(p.id)} title="Eliminar" className="text-red-500 hover:text-red-400">
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
            {filtrados.length} de {productos.length} productos
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar producto' : 'Nuevo producto'}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código interno *"
              value={form.codigo_interno}
              onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
              placeholder="Ej: P-001"
            />
            <Input
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del producto"
            />
          </div>
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Opcional"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoría"
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
            <Select
              label="Unidad de medida *"
              value={form.unidad_medida_id}
              onChange={(e) => setForm({ ...form, unidad_medida_id: e.target.value })}
            >
              <option value="">Seleccionar</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.codigo} — {u.nombre}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Unid. por bulto"
              type="number"
              min="1"
              value={form.unidades_por_bulto}
              onChange={(e) => setForm({ ...form, unidades_por_bulto: e.target.value })}
            />
            <Input
              label="Costo ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.costo}
              onChange={(e) => setForm({ ...form, costo: e.target.value })}
            />
            <Input
              label="IVA (%)"
              type="number"
              min="0"
              step="0.5"
              value={form.iva_porcentaje}
              onChange={(e) => setForm({ ...form, iva_porcentaje: e.target.value })}
            />
          </div>
          <Input
            label="Stock mínimo"
            type="number"
            min="0"
            value={form.stock_minimo}
            onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
          />

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{formError}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={guardar} loading={guardando} className="flex-1">
              {editando ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
