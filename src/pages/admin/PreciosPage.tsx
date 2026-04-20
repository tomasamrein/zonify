import { useState, useCallback, useEffect, useRef } from 'react'
import { AlertCircle, RefreshCw, DollarSign, Upload, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface PrecioItem {
  id: string
  producto_id: string
  lista_id: string
  precio: number
  producto?: { codigo_interno: string; nombre: string; categoria_id: string } | null
  categoria?: { nombre: string } | null
}

interface ItemEnEdicion {
  id: string
  nuevoPrecio: string
}

interface ListaPrecio {
  id: string
  nombre: string
  activo: boolean
}

interface FilaImport {
  codigo: string
  nombre: string
  presentacion: string
  precio: number
  esNuevo?: boolean
}

function parsearPrecioAR(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return val
  const s = String(val).trim()
  // Formato argentino: "15.303,75" → 15303.75
  const normalizado = s.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(normalizado)
  return isNaN(n) || n <= 0 ? null : n
}

function parsearExcel(buffer: ArrayBuffer): FilaImport[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (rows.length < 2) return []

  // Detectar fila de encabezado (primera fila con "código" o "descripcion")
  let headerIdx = 0
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map((c) => String(c).toLowerCase())
    if (row.some((c) => c.includes('dig') || c.includes('cod') || c.includes('descrip'))) {
      headerIdx = i
      break
    }
  }

  const header = rows[headerIdx].map((c) => String(c).toLowerCase())
  const colCodigo = header.findIndex((c) => c.includes('dig') || c.includes('cod') || c === '0')
  const colNombre = header.findIndex((c) => c.includes('descrip') || c.includes('nombre'))
  const colPres = header.findIndex((c) => c.includes('presen'))
  const colPrecio = header.findIndex((c) =>
    c.includes('precio') || c.includes('l1') || c.includes('price')
  )

  // Fallback posicional si no se detectan headers
  const ci = colCodigo >= 0 ? colCodigo : 0
  const cn = colNombre >= 0 ? colNombre : 1
  const cp = colPres >= 0 ? colPres : 2
  const cpr = colPrecio >= 0 ? colPrecio : 3

  const result: FilaImport[] = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const codigo = String(row[ci] ?? '').trim()
    const nombre = String(row[cn] ?? '').trim()
    const presentacion = String(row[cp] ?? '').trim()
    const precio = parsearPrecioAR(row[cpr])
    if (!codigo || !nombre || precio === null) continue
    result.push({ codigo, nombre, presentacion, precio })
  }
  return result
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export default function AdminPreciosPage() {
  const { empresaId } = useAuthStore()
  const [listas, setListas] = useState<ListaPrecio[]>([])
  const [listaSelId, setListaSelId] = useState<string>('')
  const [items, setItems] = useState<PrecioItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pctAumento, setPctAumento] = useState<string>('0')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [categorias, setCategorias] = useState<Array<{ id: string; nombre: string }>>([])
  const [itemEnEdicion, setItemEnEdicion] = useState<ItemEnEdicion | null>(null)
  const [guardandoIndividual, setGuardandoIndividual] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filasImport, setFilasImport] = useState<FilaImport[]>([])
  const [importando, setImportando] = useState(false)
  const [importResult, setImportResult] = useState<{ nuevos: number; actualizados: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)

    try {
      // Cargar listas de precios
      const { data: listasData, error: listasErr } = await supabase
        .from('listas_precios')
        .select('id, nombre, activo')
        .eq('empresa_id', empresaId)
        .eq('activo', true)

      if (listasErr) throw listasErr
      setListas(listasData ?? [])

      if (!listaSelId && (listasData ?? []).length > 0) {
        setListaSelId(listasData![0].id)
      }

      // Cargar categorías para filtro
      const { data: categData, error: categErr } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('empresa_id', empresaId)
        .eq('activo', true)

      if (categErr) throw categErr
      setCategorias(categData ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setCargando(false)
    }
  }, [empresaId, listaSelId])

  const cargarItems = useCallback(async () => {
    if (!listaSelId) return
    setCargando(true)

    try {
      const { data, error: err } = await supabase
        .from('lista_precios_items')
        .select(`
          id, producto_id, lista_id, precio,
          productos (
            codigo_interno, nombre, categoria_id,
            categorias (nombre)
          )
        `)
        .eq('lista_id', listaSelId)

      if (err) throw err
      const items = (data ?? []).map((item: any) => ({
        ...item,
        producto: item.productos,
        categoria: item.productos?.categorias,
      }))
      setItems(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar items')
    } finally {
      setCargando(false)
    }
  }, [listaSelId])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    cargarItems()
  }, [cargarItems])

  const itemsFiltrados =
    filtroCategoria === 'todos'
      ? items
      : items.filter((i) => i.producto?.categoria_id === filtroCategoria)

  const pct = parseFloat(pctAumento) || 0
  const aplicarAumento = async () => {
    setGuardando(true)
    try {
      await Promise.all(
        itemsFiltrados.map((item) =>
          supabase
            .from('lista_precios_items')
            .update({
              precio: +(item.precio * (1 + pct / 100)).toFixed(2),
            })
            .eq('id', item.id)
        )
      )
      await cargarItems()
      setModalOpen(false)
      setPctAumento('0')
      setFiltroCategoria('todos')
    } catch (e) {
      alert('Error al aplicar aumento: ' + (e instanceof Error ? e.message : 'Desconocido'))
    } finally {
      setGuardando(false)
    }
  }

  const guardarPrecioIndividual = async (itemId: string, nuevoPrecio: string) => {
    if (!nuevoPrecio || parseFloat(nuevoPrecio) <= 0) {
      alert('Precio debe ser mayor a 0')
      return
    }
    setGuardandoIndividual(true)
    try {
      const { error: err } = await supabase
        .from('lista_precios_items')
        .update({ precio: parseFloat(nuevoPrecio) })
        .eq('id', itemId)

      if (err) throw err
      setItemEnEdicion(null)
      await cargarItems()
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : 'Desconocido'))
    } finally {
      setGuardandoIndividual(false)
    }
  }

  const onArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const filas = parsearExcel(buffer)
    if (filas.length === 0) { alert('No se encontraron filas válidas en el archivo.'); return }

    // Marcar cuáles son nuevos productos
    const { data: existentes } = await supabase
      .from('productos')
      .select('codigo_interno')
      .eq('empresa_id', empresaId!)
    const codigosExistentes = new Set((existentes ?? []).map((p) => p.codigo_interno))
    const filasConEstado = filas.map((f) => ({ ...f, esNuevo: !codigosExistentes.has(f.codigo) }))

    setFilasImport(filasConEstado)
    setImportResult(null)
    setImportModalOpen(true)
    e.target.value = ''
  }

  const aplicarImportacion = async () => {
    if (!listaSelId || !empresaId) return
    setImportando(true)
    let nuevos = 0, actualizados = 0
    try {
      // Obtener unidad_medida default (UN)
      const { data: unidades } = await supabase.from('unidades_medida').select('id').eq('codigo', 'UN').single()
      const unidadId = unidades?.id

      for (const fila of filasImport) {
        let productoId: string

        if (fila.esNuevo) {
          const { data: prod, error: prodErr } = await supabase
            .from('productos')
            .insert({ codigo_interno: fila.codigo, nombre: fila.nombre, descripcion: fila.presentacion, empresa_id: empresaId!, unidad_medida_id: unidadId! })
            .select('id')
            .single()
          if (prodErr) continue
          productoId = prod.id
          nuevos++
        } else {
          const { data: prod } = await supabase
            .from('productos')
            .select('id')
            .eq('codigo_interno', fila.codigo)
            .eq('empresa_id', empresaId)
            .single()
          if (!prod) continue
          productoId = prod.id
        }

        // Upsert en lista_precios_items
        const { data: existing } = await supabase
          .from('lista_precios_items')
          .select('id')
          .eq('lista_id', listaSelId)
          .eq('producto_id', productoId)
          .maybeSingle()

        if (existing) {
          await supabase.from('lista_precios_items').update({ precio: fila.precio }).eq('id', existing.id)
        } else {
          await supabase.from('lista_precios_items').insert({ lista_id: listaSelId, producto_id: productoId, precio: fila.precio, empresa_id: empresaId })
        }
        if (!fila.esNuevo) actualizados++
      }
      setImportResult({ nuevos, actualizados })
      await cargarItems()
    } catch (e) {
      alert('Error en importación: ' + (e instanceof Error ? e.message : 'Desconocido'))
    } finally {
      setImportando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">Gestión de Precios</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">Actualizar lista de precios en lote</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Importar Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onArchivoSeleccionado} />
          <Button
            size="sm"
            variant="outline"
            onClick={cargarItems}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center bg-red-50 rounded-2xl border border-red-200 p-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Selector de lista */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
        <label className="text-sm font-semibold text-[var(--color-ink)] block mb-2">
          Lista de precios
        </label>
        <select
          value={listaSelId}
          onChange={(e) => setListaSelId(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {listas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de precios */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
                <th className="text-left p-3 font-semibold">Código</th>
                <th className="text-left p-3 font-semibold">Nombre</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Categoría</th>
                <th className="text-right p-3 font-semibold">Precio actual</th>
                {pct !== 0 && <th className="text-right p-3 font-semibold">Nuevo precio</th>}
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={pct !== 0 ? 5 : 4} className="text-center py-8 text-[var(--color-ink-muted)]">
                    Sin items en esta lista
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-soft)] transition-colors"
                  >
                    <td className="p-3">{item.producto?.codigo_interno ?? '—'}</td>
                    <td className="p-3">{item.producto?.nombre ?? '—'}</td>
                    <td className="p-3 hidden md:table-cell text-xs text-[var(--color-ink-muted)]">
                      {item.categoria?.nombre ?? '—'}
                    </td>
                    <td className="p-3 text-right">
                      {itemEnEdicion?.id === item.id ? (
                        <div className="flex gap-1 justify-end items-center">
                          <input
                            type="number"
                            value={itemEnEdicion.nuevoPrecio}
                            onChange={(e) =>
                              setItemEnEdicion({ ...itemEnEdicion, nuevoPrecio: e.target.value })
                            }
                            className="w-24 border border-brand-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              guardarPrecioIndividual(item.id, itemEnEdicion.nuevoPrecio)
                            }
                            disabled={guardandoIndividual}
                            className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setItemEnEdicion(null)}
                            className="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-soft)]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setItemEnEdicion({
                              id: item.id,
                              nuevoPrecio: item.precio.toString(),
                            })
                          }
                          className="font-semibold text-right w-full cursor-pointer hover:text-brand-600"
                        >
                          {formatARS(item.precio)}
                        </button>
                      )}
                    </td>
                    {pct !== 0 && (
                      <td className="p-3 text-right font-semibold text-brand-600">
                        {formatARS(item.precio * (1 + pct / 100))}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {itemsFiltrados.length > 0 && (
          <div className="p-3 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
            {itemsFiltrados.length} producto(s)
          </div>
        )}
      </div>

      {/* Panel de acción flotante */}
      {listas.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <label className="text-sm font-semibold text-[var(--color-ink)]">Aumento (%)</label>
            <input
              type="number"
              value={pctAumento}
              onChange={(e) => setPctAumento(e.target.value)}
              placeholder="0"
              className="w-20 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex-1" />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="todos">Aplicar a: Todos</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  Por categoría: {c.nombre}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setModalOpen(true)}
              disabled={!pctAumento || parseFloat(pctAumento) === 0 || guardando}
              leftIcon={<DollarSign className="w-3.5 h-3.5" />}
            >
              {guardando ? 'Aplicando…' : 'Aplicar'}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de importación Excel */}
      <Modal open={importModalOpen} onClose={() => { setImportModalOpen(false); setImportResult(null) }} title="Importar lista de precios desde Excel">
        <div className="space-y-4 p-4">
          {importResult ? (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-sm text-green-800 space-y-1">
                <p className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Importación completada</p>
                <p>{importResult.nuevos} producto(s) nuevos creados</p>
                <p>{importResult.actualizados} precio(s) actualizados</p>
              </div>
              <Button size="sm" variant="primary" onClick={() => { setImportModalOpen(false); setImportResult(null) }}>Cerrar</Button>
            </div>
          ) : (
            <>
              <div className="text-sm text-[var(--color-ink-muted)]">
                Se encontraron <strong>{filasImport.length}</strong> filas válidas.{' '}
                <span className="text-brand-600 font-medium">{filasImport.filter(f => f.esNuevo).length} nuevos</span>,{' '}
                <span className="text-[var(--color-ink)] font-medium">{filasImport.filter(f => !f.esNuevo).length} actualizaciones</span>.
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--color-surface-muted)]">
                    <tr>
                      <th className="text-left px-3 py-2">Cód.</th>
                      <th className="text-left px-3 py-2">Nombre</th>
                      <th className="text-right px-3 py-2">Precio</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasImport.map((f) => (
                      <tr key={f.codigo} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-1.5">{f.codigo}</td>
                        <td className="px-3 py-1.5">{f.nombre}</td>
                        <td className="px-3 py-1.5 text-right">{formatARS(f.precio)}</td>
                        <td className="px-3 py-1.5">
                          {f.esNuevo
                            ? <span className="text-brand-600 font-medium">NUEVO</span>
                            : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Lista destino: <strong>{listas.find(l => l.id === listaSelId)?.nombre ?? '—'}</strong>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setImportModalOpen(false)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface-soft)]">Cancelar</button>
                <button onClick={aplicarImportacion} disabled={importando} className="flex-1 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                  {importando ? 'Importando…' : 'Confirmar importación'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de confirmación */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirmar aumento de precios">
        <div className="space-y-4 p-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Se aplicará:</p>
            <p>
              Aumento de <strong>{pctAumento}%</strong> a{' '}
              <strong>{itemsFiltrados.length} producto(s)</strong>
            </p>
            {filtroCategoria !== 'todos' && (
              <p className="mt-2">
                Categoría: <strong>{categorias.find((c) => c.id === filtroCategoria)?.nombre}</strong>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={aplicarAumento}
              disabled={guardando}
              className="flex-1 px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 text-sm font-medium"
            >
              {guardando ? 'Aplicando…' : 'Aplicar aumento'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
