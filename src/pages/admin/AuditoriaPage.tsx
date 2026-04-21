import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle, ArrowUpCircle, ArrowDownCircle, Settings2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'

interface MovimientoLog {
  id: string
  created_at: string
  tipo: string
  cantidad: number
  stock_posterior: number
  motivo: string | null
  usuario_id: string | null
  productos: { nombre: string; codigo_interno: string } | null
  perfiles: { nombre_completo: string } | null
}

const TIPO_CONFIG: Record<string, { label: string; color: string; icon: typeof ArrowUpCircle }> = {
  ingreso:       { label: 'Ingreso',   color: 'text-green-600 bg-green-50',   icon: ArrowUpCircle },
  egreso:        { label: 'Egreso',    color: 'text-red-600 bg-red-50',      icon: ArrowDownCircle },
  ajuste:        { label: 'Ajuste',    color: 'text-amber-600 bg-amber-50',  icon: Settings2 },
  venta:         { label: 'Venta',     color: 'text-blue-600 bg-blue-50',    icon: ArrowDownCircle },
  devolucion:    { label: 'Dev.',      color: 'text-violet-600 bg-violet-50', icon: ArrowUpCircle },
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

type Filtro = 'todo' | 'ingreso' | 'egreso' | 'ajuste' | 'venta'

export default function AuditoriaPage() {
  const empresaId = useAuthStore((s) => s.empresaId)
  const [movimientos, setMovimientos] = useState<MovimientoLog[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todo')

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    setError(null)
    let query = supabase
      .from('movimientos_stock')
      .select(`
        id, created_at, tipo, cantidad, stock_posterior, motivo, usuario_id,
        productos ( nombre, codigo_interno ),
        perfiles ( nombre_completo )
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (filtro !== 'todo') {
      query = query.eq('tipo', filtro)
    }

    const { data, error: err } = await query
    if (err) { setError(err.message); setCargando(false); return }
    setMovimientos((data ?? []) as unknown as MovimientoLog[])
    setCargando(false)
  }, [empresaId, filtro])

  useEffect(() => { cargar() }, [cargar])

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todo', label: 'Todo' },
    { key: 'ingreso', label: 'Ingresos' },
    { key: 'egreso', label: 'Egresos' },
    { key: 'venta', label: 'Ventas' },
    { key: 'ajuste', label: 'Ajustes' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)]">Auditoría</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">Registro detallado de movimientos de stock</p>
        </div>
        <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`text-sm font-medium px-3 py-1.5 rounded-xl border transition-colors ${
              filtro === f.key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-border)] hover:border-brand-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-[var(--color-ink-muted)]">{error}</p>
          <Button size="sm" variant="outline" onClick={cargar} leftIcon={<RefreshCw className="w-4 h-4" />}>Reintentar</Button>
        </div>
      ) : movimientos.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-semibold text-[var(--color-ink)]">Sin movimientos registrados</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">Los movimientos de stock aparecerán aquí.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium">Producto</th>
                <th className="text-center px-3 py-3 text-[var(--color-ink-muted)] font-medium">Cant.</th>
                <th className="text-center px-3 py-3 text-[var(--color-ink-muted)] font-medium">Stock final</th>
                <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium hidden md:table-cell">Usuario</th>
                <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium hidden lg:table-cell">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, i) => {
                const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: 'text-gray-600 bg-gray-50', icon: Settings2 }
                const IconComp = cfg.icon
                const esNegativo = ['egreso', 'venta'].includes(m.tipo)
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-[var(--color-border)] last:border-0 ${
                      i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-muted)]'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-[var(--color-ink-muted)] text-xs whitespace-nowrap">
                      {formatFecha(m.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        <IconComp className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-[var(--color-ink)] truncate max-w-[160px]">
                        {m.productos?.nombre ?? '—'}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">{m.productos?.codigo_interno}</p>
                    </td>
                    <td className={`text-center px-3 py-2.5 font-semibold ${esNegativo ? 'text-red-600' : 'text-green-600'}`}>
                      {esNegativo ? '-' : '+'}{m.cantidad}
                    </td>
                    <td className="text-center px-3 py-2.5 text-[var(--color-ink-muted)]">
                      {m.stock_posterior}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-muted)] text-xs hidden md:table-cell">
                      {m.perfiles?.nombre_completo ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-muted)] text-xs hidden lg:table-cell truncate max-w-[140px]">
                      {m.motivo ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--color-ink-muted)] text-center">
        Mostrando los últimos 200 movimientos · Para exportar contactá soporte
      </p>
    </div>
  )
}
