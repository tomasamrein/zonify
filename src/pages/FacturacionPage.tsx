import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, RefreshCw, AlertCircle, MessageCircle, Printer, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PrintableComprobante } from '@/components/PrintableComprobante'

interface ComprobanteRow {
  id: string
  numero: number
  tipo: string
  fecha_emision: string
  estado: string
  subtotal: number
  total_iva: number
  total: number
  pedido_id: string
  pedidos: {
    numero_pedido: number
    clientes: { razon_social: string; cuit: string | null; condicion_iva: string } | null
  } | null
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mesLabel(value: string) {
  const [y, m] = value.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function primerDia(ym: string) { return `${ym}-01` }
function ultimoDia(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).toISOString().split('T')[0]
}

function mesActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

function meses() {
  const result: string[] = []
  const hoy = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

const condicionLabel: Record<string, string> = {
  responsable_inscripto: 'R.I.',
  monotributo: 'Mono',
  exento: 'Exento',
  consumidor_final: 'C.F.',
  no_responsable: 'N.R.',
}

export default function FacturacionPage() {
  const { empresaId, empresa } = useAuthStore()
  const [mesSel, setMesSel] = useState(mesActual)
  const [comprobantes, setComprobantes] = useState<ComprobanteRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [comprobanteParaImprimir, setComprobanteParaImprimir] = useState<any>(null)
  const [cargandoImpresion, setCargandoImpresion] = useState(false)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    const desde = primerDia(mesSel)
    const hasta = ultimoDia(mesSel)
    const { data, error: err } = await supabase
      .from('comprobantes')
      .select(`
        id, numero, tipo, fecha_emision, estado,
        subtotal, total_iva, total, pedido_id,
        pedidos (
          numero_pedido,
          clientes ( razon_social, cuit, condicion_iva )
        )
      `)
      .eq('empresa_id', empresaId)
      .gte('fecha_emision', desde)
      .lte('fecha_emision', hasta + 'T23:59:59')
      .order('numero', { ascending: false })
    if (err) { setError(err.message); setCargando(false); return }
    setComprobantes((data ?? []) as ComprobanteRow[])
    setCargando(false)
  }, [empresaId, mesSel])

  useEffect(() => { cargar() }, [cargar])

  const totalMes = comprobantes.filter(c => c.estado === 'emitido').reduce((s, c) => s + c.total, 0)
  const totalIva = comprobantes.filter(c => c.estado === 'emitido').reduce((s, c) => s + c.total_iva, 0)

  async function exportarCSV() {
    if (!empresaId) return
    setExportando(true)
    const { data, error: err } = await supabase.rpc('exportar_ventas_mes', {
      p_empresa_id: empresaId,
      p_desde: primerDia(mesSel),
      p_hasta: ultimoDia(mesSel),
    })
    setExportando(false)
    if (err || !data?.length) {
      alert(err?.message ?? 'No hay datos para exportar en este período.')
      return
    }
    const cols = Object.keys(data[0])
    const rows = [
      cols.join(';'),
      ...data.map((row: Record<string, unknown>) =>
        cols.map((c) => {
          const v = row[c]
          if (v == null) return ''
          if (typeof v === 'string' && v.includes(';')) return `"${v}"`
          return String(v)
        }).join(';')
      ),
    ]
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ventas_${empresa?.nombre ?? 'empresa'}_${mesSel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function compartirWhatsApp(comp: ComprobanteRow) {
    const cliente = comp.pedidos?.clientes?.razon_social ?? 'Cliente'
    const nro = String(comp.numero).padStart(4, '0')
    const msg = encodeURIComponent(
      `Hola ${cliente}! 👋\n` +
      `Adjuntamos el comprobante N° ${nro} de ${empresa?.nombre ?? 'la empresa'} ` +
      `por ${formatARS(comp.total)} correspondiente al pedido #${comp.pedidos?.numero_pedido ?? ''}.\n` +
      `Ante cualquier consulta estamos a disposición.`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  async function abrirParaImprimir(comp: ComprobanteRow) {
    setCargandoImpresion(true)
    try {
      // Cargar pedido con cliente_id
      const { data: pedidoData, error: pedErr } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, fecha_pedido, observaciones, cliente_id')
        .eq('id', comp.pedido_id)
        .single()

      if (pedErr || !pedidoData) throw new Error('Error al cargar pedido')

      // Cargar detalles
      const { data: detallesData, error: detErr } = await supabase
        .from('pedido_detalles')
        .select('producto_id, cantidad, precio_unitario, descuento_porcentaje, iva_porcentaje, subtotal, total_linea')
        .eq('pedido_id', comp.pedido_id)

      if (detErr) throw new Error('Error al cargar detalles')

      // Cargar productos
      const productoIds = (detallesData || []).map(d => d.producto_id).filter(Boolean)
      const { data: productosData, error: prodErr } = await supabase
        .from('productos')
        .select('id, codigo_interno, nombre')
        .in('id', productoIds)

      if (prodErr) throw new Error('Error al cargar productos')

      // Mapear detalles con productos
      const detallesConProductos = (detallesData || []).map(det => ({
        ...det,
        productos: productosData?.find(p => p.id === det.producto_id) || { codigo: '', nombre: '' }
      }))

      // Cargar cliente
      const { data: clienteData, error: cliErr } = await supabase
        .from('clientes')
        .select('razon_social, cuit, condicion_iva, direccion, localidad, provincia')
        .eq('id', pedidoData.cliente_id)
        .single()

      if (cliErr) throw new Error('Error al cargar cliente')

      setComprobanteParaImprimir({
        comprobante: {
          id: comp.id,
          numero: comp.numero,
          fecha_emision: comp.fecha_emision,
          subtotal: comp.subtotal,
          total_iva: comp.total_iva,
          total: comp.total,
        },
        pedido: {
          numero_pedido: pedidoData.numero_pedido,
          fecha_pedido: pedidoData.fecha_pedido,
          observaciones: pedidoData.observaciones,
          detalles: detallesConProductos,
          clientes: clienteData,
        },
      })

    } catch (e) {
      console.error('Error:', e)
      alert('Error al cargar el comprobante: ' + (e instanceof Error ? e.message : 'Desconocido'))
    } finally {
      setCargandoImpresion(false)
    }
  }

  function imprimirComprobante() {
    window.print()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">Facturación</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">Comprobantes internos · Exportación para contador</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={mesSel}
            onChange={(e) => setMesSel(e.target.value)}
            className="text-sm border border-[var(--color-border)] rounded-xl px-3 py-2 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {meses().map((m) => (
              <option key={m} value={m}>{mesLabel(m)}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={cargar}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={exportarCSV}
            disabled={exportando || comprobantes.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            {exportando ? 'Exportando…' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs text-[var(--color-ink-muted)] mb-1">Comprobantes</p>
          <p className="text-2xl font-bold text-[var(--color-ink)]">
            {comprobantes.filter(c => c.estado === 'emitido').length}
          </p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs text-[var(--color-ink-muted)] mb-1">Neto</p>
          <p className="text-lg font-bold text-[var(--color-ink)] leading-tight">{formatARS(totalMes - totalIva)}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs text-[var(--color-ink-muted)] mb-1">Total c/IVA</p>
          <p className="text-lg font-bold text-brand-600 leading-tight">{formatARS(totalMes)}</p>
        </div>
      </div>

      {/* Info para contador */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-0.5">Para tu contador</p>
          <p>Exportá el CSV del mes y enviáselo. Incluye CUIT, condición IVA, subtotales netos y montos de IVA por línea — todo lo que necesita para emitir las facturas fiscales.</p>
        </div>
      </div>

      {/* Lista de comprobantes */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-[var(--color-ink-muted)]">{error}</p>
          <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reintentar
          </Button>
        </div>
      ) : comprobantes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">Sin comprobantes en {mesLabel(mesSel)}</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Los comprobantes se generan automáticamente al facturar un pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {comprobantes.map((comp) => {
            const cliente = comp.pedidos?.clientes
            const nro = String(comp.numero).padStart(4, '0')
            return (
              <div
                key={comp.id}
                className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-[var(--color-ink-muted)]">
                        X-{nro}
                      </span>
                      {comp.estado === 'anulado' && (
                        <Badge tone="danger">Anulado</Badge>
                      )}
                      {cliente?.condicion_iva && (
                        <Badge tone="neutral">{condicionLabel[cliente.condicion_iva] ?? cliente.condicion_iva}</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-[var(--color-ink)] mt-1 truncate">
                      {cliente?.razon_social ?? '—'}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                      Pedido #{comp.pedidos?.numero_pedido} · {formatFecha(comp.fecha_emision)}
                      {cliente?.cuit ? ` · CUIT ${cliente.cuit}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-sm font-bold text-[var(--color-ink)]">{formatARS(comp.total)}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">IVA {formatARS(comp.total_iva)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirParaImprimir(comp)}
                        disabled={cargandoImpresion}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                        title="Imprimir comprobante"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir
                      </button>
                      <button
                        onClick={() => compartirWhatsApp(comp)}
                        className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
                        title="Compartir por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de impresión */}
      {comprobanteParaImprimir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-2xl">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Vista previa del comprobante</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={imprimirComprobante}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Imprimir
                </Button>
                <button
                  onClick={() => setComprobanteParaImprimir(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <PrintableComprobante data={comprobanteParaImprimir} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
