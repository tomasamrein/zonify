import { useState } from 'react'
import { MapPin, Phone, AlertCircle, RefreshCw, Users } from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { Button } from '@/components/ui/Button'

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export default function ClientesPage() {
  const { clientes, cargando, error, recargar } = useClientes()
  const [filtro, setFiltro] = useState('')

  const clientesFiltrados = clientes.filter((c) =>
    c.razon_social.toLowerCase().includes(filtro.toLowerCase()) ||
    c.codigo.toLowerCase().includes(filtro.toLowerCase())
  )

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto lg:mx-0 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--color-ink-muted)]">{clientes.length} cliente(s)</p>
        <Button size="sm" variant="ghost" onClick={recargar} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Actualizar
        </Button>
      </div>

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {clientesFiltrados.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[var(--color-ink-muted)]" />
          </div>
          <p className="font-semibold text-[var(--color-ink)]">
            {filtro ? 'Sin resultados' : 'Sin clientes'}
          </p>
        </div>
      )}

      {clientesFiltrados.map((cliente) => {
        const saldo = cliente.saldo_cuenta_corriente ?? 0
        return (
          <div
            key={cliente.id}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-ink)] truncate">{cliente.razon_social}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">{cliente.codigo}</p>
              </div>
              {saldo !== 0 && (
                <div className="text-right text-sm font-medium">
                  <p className={saldo > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {saldo > 0 ? 'Debe: ' : 'Acreedor: '}
                    {formatARS(Math.abs(saldo))}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
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
                  <a href={`tel:${cliente.telefono}`} className="hover:text-brand-600 underline">
                    {cliente.telefono}
                  </a>
                </div>
              )}
              {cliente.zonas && (
                <div className="text-xs text-[var(--color-ink-muted)]">
                  Zona: <strong>{cliente.zonas.nombre}</strong>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
