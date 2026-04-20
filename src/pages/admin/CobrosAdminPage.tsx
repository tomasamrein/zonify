import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CobroRow {
  id: string
  monto: number
  forma_pago: string
  fecha: string
  observaciones: string | null
  clientes: { razon_social: string } | null
  perfiles: { nombre_completo: string } | null
  pedidos: { numero_pedido: number } | null
}

interface ResumenPreventista {
  nombre: string
  total: number
  efectivo: number
  transferencia: number
  cheque: number
  cantidad: number
}

function exportarCSV(cobros: CobroRow[]) {
  const filas = cobros.map((c) => [
    c.fecha,
    c.perfiles?.nombre_completo ?? '',
    c.clientes?.razon_social ?? '',
    c.pedidos?.numero_pedido ?? '',
    c.forma_pago,
    c.monto,
    c.observaciones ?? '',
  ])
  const cabeceras = ['Fecha', 'Preventista', 'Cliente', 'Pedido #', 'Forma pago', 'Monto', 'Observaciones']
  const csv = [cabeceras, ...filas].map((row) =>
    row.map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',')
  ).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cobros-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CobrosAdminPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const [cobros, setCobros] = useState<CobroRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    const { data, error } = await supabase
      .from('cobros')
      .select('id, monto, forma_pago, fecha, observaciones, clientes(razon_social), perfiles(nombre_completo), pedidos(numero_pedido)')
      .eq('empresa_id', empresaId)
      .eq('fecha', fecha)
      .order('created_at', { ascending: false })
    if (error) toast.error('Error al cargar cobros')
    else setCobros((data as CobroRow[]) ?? [])
    setCargando(false)
  }, [empresaId, fecha])

  useEffect(() => { cargar() }, [cargar])

  const totalDia = cobros.reduce((s, c) => s + c.monto, 0)

  // Resumen por preventista
  const porPreventista = cobros.reduce<Record<string, ResumenPreventista>>((acc, c) => {
    const nombre = c.perfiles?.nombre_completo ?? 'Sin asignar'
    if (!acc[nombre]) acc[nombre] = { nombre, total: 0, efectivo: 0, transferencia: 0, cheque: 0, cantidad: 0 }
    acc[nombre].total += c.monto
    acc[nombre].cantidad += 1
    if (c.forma_pago === 'efectivo') acc[nombre].efectivo += c.monto
    else if (c.forma_pago === 'transferencia') acc[nombre].transferencia += c.monto
    else if (c.forma_pago === 'cheque') acc[nombre].cheque += c.monto
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">Cobros del día</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{cobros.length} cobros · {formatCurrency(totalDia)} total</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm bg-[var(--color-surface)]"
          />
          <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />}>
            Actualizar
          </Button>
          {cobros.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => exportarCSV(cobros)} leftIcon={<Download className="w-3.5 h-3.5" />}>
              CSV
            </Button>
          )}
        </div>
      </div>

      {/* Resumen por preventista */}
      {Object.keys(porPreventista).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(porPreventista).map((pv) => (
            <div key={pv.nombre} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
              <p className="font-semibold text-[var(--color-ink)] truncate">{pv.nombre}</p>
              <p className="text-2xl font-bold text-brand-600 mt-1">{formatCurrency(pv.total)}</p>
              <div className="mt-2 space-y-0.5 text-xs text-[var(--color-ink-muted)]">
                {pv.efectivo > 0 && <p>Efectivo: {formatCurrency(pv.efectivo)}</p>}
                {pv.transferencia > 0 && <p>Transferencia: {formatCurrency(pv.transferencia)}</p>}
                {pv.cheque > 0 && <p>Cheque: {formatCurrency(pv.cheque)}</p>}
                <p className="pt-0.5">{pv.cantidad} cobro(s)</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla detalle */}
      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cobros.length === 0 ? (
        <p className="text-center py-16 text-[var(--color-ink-muted)]">Sin cobros para esta fecha.</p>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Preventista</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden sm:table-cell">Pedido</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)]">Forma pago</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-muted)]">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-muted)] hidden md:table-cell">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {cobros.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-surface-muted)] transition-colors">
                    <td className="px-4 py-3 text-[var(--color-ink)]">{c.perfiles?.nombre_completo ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--color-ink)]">{c.clientes?.razon_social ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] hidden sm:table-cell">
                      {c.pedidos?.numero_pedido ? `#${c.pedidos.numero_pedido}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] capitalize">{c.forma_pago}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink)]">{formatCurrency(c.monto)}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] text-xs hidden md:table-cell">{formatDate(c.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
