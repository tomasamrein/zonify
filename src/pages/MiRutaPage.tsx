import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, ShoppingCart, AlertCircle, RefreshCw, Route, Printer, X } from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { useVentasStore } from '@/store/useVentasStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { PrintableHojaRuta } from '@/components/PrintableHojaRuta'
import { supabase } from '@/lib/supabase'

export default function MiRutaPage() {
  const { clientes, cargando, error, recargar } = useClientes({ soloHoy: true })
  const colaOffline = useVentasStore((s) => s.colaOffline)
  const { empresaId, perfil } = useAuthStore()
  const navigate = useNavigate()
  const [hojaRutaVisible, setHojaRutaVisible] = useState(false)
  const [hojaRutaData, setHojaRutaData] = useState<any>(null)
  const [cargandoImpresion, setCargandoImpresion] = useState(false)

  const hoy = new Date().toDateString()
  const clientesConPedidoHoy = useMemo(
    () => new Set(
      colaOffline
        .filter((p) => new Date(p.creado_en).toDateString() === hoy)
        .map((p) => p.cliente_id),
    ),
    [colaOffline, hoy]
  )

  function imprimirHojaRuta() {
    window.print()
  }

  async function abrirHojaRuta() {
    setCargandoImpresion(true)
    try {
      const { data, error: err } = await supabase
        .from('clientes')
        .select(`
          id, codigo, razon_social, direccion, localidad,
          zona:zonas ( nombre ),
          pedidos (
            numero_pedido, fecha_pedido, total, estado,
            pedido_detalles ( cantidad )
          )
        `)
        .eq('empresa_id', empresaId)
        .in('id', clientes.map(c => c.id))

      if (err || !data) {
        alert('Error al cargar los datos de la ruta')
        return
      }

      setHojaRutaData({
        fecha: new Date().toISOString(),
        preventista: perfil?.nombre_completo,
        clientes: data,
      })
      setHojaRutaVisible(true)
    } catch (e) {
      alert('Error al generar la hoja de ruta')
    } finally {
      setCargandoImpresion(false)
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
        <Button size="sm" variant="outline" onClick={recargar} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {clientes.length === 0
            ? 'Sin visitas para hoy'
            : `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'} para hoy`}
        </p>
        <div className="flex gap-2">
          {clientes.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={abrirHojaRuta}
              disabled={cargandoImpresion}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Imprimir
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={recargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Actualizar
          </Button>
        </div>
      </div>

      {clientes.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <Route className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">Sin visitas programadas</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            No tenés clientes asignados para el día de hoy.
          </p>
        </div>
      )}

      {clientes.map((cliente) => {
        const yaVisitado = clientesConPedidoHoy.has(cliente.id)
        return (
          <div
            key={cliente.id}
            className={cn(
              'bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]',
              yaVisitado && 'opacity-60',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--color-ink)] truncate">{cliente.razon_social}</p>
                  {yaVisitado && <Badge tone="success">Pedido tomado</Badge>}
                </div>
                {cliente.nombre_fantasia && cliente.nombre_fantasia !== cliente.razon_social && (
                  <p className="text-xs text-[var(--color-ink-muted)] truncate mt-0.5">{cliente.nombre_fantasia}</p>
                )}
              </div>
              <Button
                size="sm"
                variant={yaVisitado ? 'outline' : 'primary'}
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                onClick={() =>
                  navigate(
                    `/venta?cliente_id=${cliente.id}&cliente_nombre=${encodeURIComponent(cliente.razon_social)}`,
                  )
                }
              >
                Vender
              </Button>
            </div>

            <div className="mt-3 space-y-1.5">
              {cliente.direccion && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {cliente.direccion}
                    {cliente.localidad ? `, ${cliente.localidad}` : ''}
                  </span>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <a href={`tel:${cliente.telefono}`} className="hover:text-brand-600">
                    {cliente.telefono}
                  </a>
                </div>
              )}
            </div>

            {(cliente.saldo_cuenta_corriente ?? 0) !== 0 && (
              <div
                className={cn(
                  'mt-3 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center justify-between',
                  (cliente.saldo_cuenta_corriente ?? 0) > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700',
                )}
              >
                <span>Saldo cuenta corriente</span>
                <span>${Math.abs(cliente.saldo_cuenta_corriente ?? 0).toFixed(2)}</span>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal de hoja de ruta */}
      {hojaRutaVisible && hojaRutaData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-4xl">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Hoja de Ruta</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={imprimirHojaRuta}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Imprimir
                </Button>
                <button
                  onClick={() => setHojaRutaVisible(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <PrintableHojaRuta data={hojaRutaData} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
