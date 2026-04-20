import { useState, useMemo } from 'react'
import { Download, Search, TrendingUp, ShoppingCart, FileText, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

type Agrupamiento = 'preventista' | 'zona' | 'producto'

interface VentaRow {
  fecha: string
  cliente_razon_social: string
  numero_comprobante: number
  producto_nombre: string
  producto_codigo: string
  cantidad: number
  precio_unitario: number
  descuento_porcentaje: number
  subtotal_linea: number
  iva_porcentaje: number
  iva_linea: number
  total_linea: number
  cliente_cuit: string
  cliente_condicion_iva: string
}

interface FilaAgrupada {
  clave: string
  cantidad_lineas: number
  total: number
  tickets: number
}

function exportarCSV(ventas: VentaRow[], nombre: string) {
  if (!ventas.length) return
  const cabeceras = ['Fecha', 'Comprobante', 'Cliente', 'CUIT', 'Cond.IVA', 'Producto', 'Código', 'Cantidad', 'Precio Unit.', 'Descuento%', 'Subtotal', 'IVA%', 'IVA', 'Total']
  const filas = ventas.map((v) => [
    v.fecha, v.numero_comprobante, v.cliente_razon_social, v.cliente_cuit, v.cliente_condicion_iva,
    v.producto_nombre, v.producto_codigo, v.cantidad, v.precio_unitario, v.descuento_porcentaje,
    v.subtotal_linea, v.iva_porcentaje, v.iva_linea, v.total_linea,
  ])
  const csv = [cabeceras, ...filas]
    .map((row) => row.map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(','))
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

function primerDiaMes() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
}

export default function ReportesPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const [desde, setDesde] = useState(primerDiaMes())
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0])
  const [agrupamiento, setAgrupamiento] = useState<Agrupamiento>('preventista')
  const [ventas, setVentas] = useState<VentaRow[]>([])
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  async function cargar() {
    if (!empresaId) return
    setCargando(true)
    setBuscado(false)
    try {
      const { data, error } = await supabase.rpc('exportar_ventas_mes', {
        p_empresa_id: empresaId,
        p_desde: desde,
        p_hasta: hasta,
      })
      if (error) throw error
      setVentas((data as VentaRow[]) ?? [])
      setBuscado(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar reportes')
    } finally {
      setCargando(false)
    }
  }

  const totalVentas = useMemo(() => ventas.reduce((s, v) => s + v.total_linea, 0), [ventas])
  const totalIva    = useMemo(() => ventas.reduce((s, v) => s + v.iva_linea, 0), [ventas])
  const comprobantes = useMemo(() => new Set(ventas.map((v) => v.numero_comprobante)).size, [ventas])
  const ticketPromedio = comprobantes > 0 ? totalVentas / comprobantes : 0

  const filasAgrupadas = useMemo<FilaAgrupada[]>(() => {
    const mapa = new Map<string, FilaAgrupada>()
    ventas.forEach((v) => {
      const clave = agrupamiento === 'producto' ? v.producto_nombre :
                    agrupamiento === 'zona'      ? v.cliente_condicion_iva :
                                                   v.cliente_razon_social
      const existing = mapa.get(clave)
      if (existing) {
        existing.cantidad_lineas += 1
        existing.total += v.total_linea
        existing.tickets = new Set([...Array(existing.tickets)]).size
      } else {
        mapa.set(clave, { clave, cantidad_lineas: 1, total: v.total_linea, tickets: 1 })
      }
    })
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total)
  }, [ventas, agrupamiento])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-ink)]">Reportes</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">Ventas por período</p>
      </div>

      {/* Filtros */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1">Agrupar por</label>
          <select
            value={agrupamiento}
            onChange={(e) => setAgrupamiento(e.target.value as Agrupamiento)}
            className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)]"
          >
            <option value="preventista">Cliente</option>
            <option value="producto">Producto</option>
          </select>
        </div>
        <Button onClick={cargar} loading={cargando} leftIcon={<Search className="w-4 h-4" />}>
          Cargar
        </Button>
        {ventas.length > 0 && (
          <Button
            variant="outline"
            onClick={() => exportarCSV(ventas, `ventas-${desde}-${hasta}.csv`)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar CSV
          </Button>
        )}
      </div>

      {/* KPIs */}
      {buscado && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total ventas',    value: formatCurrency(totalVentas),     icon: TrendingUp,   color: 'text-brand-600' },
              { label: 'Ticket promedio', value: formatCurrency(ticketPromedio),  icon: DollarSign,   color: 'text-emerald-600' },
              { label: 'Comprobantes',    value: String(comprobantes),            icon: FileText,     color: 'text-amber-600' },
              { label: 'Total IVA',       value: formatCurrency(totalIva),        icon: ShoppingCart, color: 'text-slate-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <p className="text-xs text-[var(--color-ink-muted)]">{kpi.label}</p>
                </div>
                <p className="text-lg font-bold text-[var(--color-ink)]">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Tabla agrupada */}
          {filasAgrupadas.length === 0 ? (
            <p className="text-center py-12 text-[var(--color-ink-muted)]">Sin datos para el período seleccionado.</p>
          ) : (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] capitalize">{agrupamiento === 'producto' ? 'Producto' : 'Cliente'}</th>
                      <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-muted)]">Líneas</th>
                      <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-muted)]">Total</th>
                      <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-muted)]">% del total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filasAgrupadas.map((f) => (
                      <tr key={f.clave} className="hover:bg-[var(--color-surface-muted)] transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{f.clave}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink-muted)]">{f.cantidad_lineas}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink)]">{formatCurrency(f.total)}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-ink-muted)]">
                          {totalVentas > 0 ? ((f.total / totalVentas) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">Total</td>
                      <td className="px-4 py-3 text-right text-[var(--color-ink-muted)]">{ventas.length}</td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--color-ink)]">{formatCurrency(totalVentas)}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-ink-muted)]">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
