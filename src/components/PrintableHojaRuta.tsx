interface ClienteConPedidos {
  id: string
  codigo: string | null
  razon_social: string
  direccion: string | null
  localidad: string | null
  zona: { nombre: string } | null
  pedidos: Array<{
    numero_pedido: number
    fecha_pedido: string
    total: number
    estado: string
    detalles: Array<{ cantidad: number }>
  }>
}

interface HojaRutaData {
  camion?: string
  reparto?: string
  preventista?: string
  zona?: string
  fecha?: string
  clientes: ClienteConPedidos[]
}

export function PrintableHojaRuta({ data }: { data: HojaRutaData }) {
  const totalPedidos = data.clientes.reduce((sum, c) => sum + c.pedidos.length, 0)
  const totalClientes = data.clientes.length
  const totalMonto = data.clientes.reduce(
    (sum, c) => sum + c.pedidos.reduce((ps, p) => ps + p.total, 0),
    0
  )

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .printable-page { page-break-after: always; margin: 0; padding: 0.5rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="printable-page">
        {/* Encabezado */}
        <div className="text-center text-sm font-bold mb-3 pb-2 border-b border-gray-400">
          Hoja de Ruta
        </div>

        {/* Info de ruta */}
        <div className="grid grid-cols-4 gap-4 mb-4 text-xs">
          {data.camion && (
            <div>
              <p className="font-semibold">Camión</p>
              <p>{data.camion}</p>
            </div>
          )}
          {data.preventista && (
            <div>
              <p className="font-semibold">Preventista</p>
              <p>{data.preventista}</p>
            </div>
          )}
          {data.fecha && (
            <div>
              <p className="font-semibold">Fecha</p>
              <p>{new Date(data.fecha).toLocaleDateString('es-AR')}</p>
            </div>
          )}
          {data.zona && (
            <div>
              <p className="font-semibold">Zona</p>
              <p>{data.zona}</p>
            </div>
          )}
        </div>

        {/* Clientes */}
        <div className="space-y-3">
          {data.clientes.map((cliente, idx) => {
            const totalCliente = cliente.pedidos.reduce((sum, p) => sum + p.total, 0)
            const totalBultos = cliente.pedidos.reduce((sum, p) => sum + p.detalles.reduce((ds, d) => ds + d.cantidad, 0), 0)

            return (
              <div key={cliente.id} className="border-b border-gray-400 pb-3">
                {/* Cliente header */}
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <p className="font-semibold">
                      Cliente: {cliente.codigo} {cliente.razon_social}
                    </p>
                    <p>Dirección: {cliente.direccion ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{cliente.zona?.nombre ?? '—'}</p>
                    <p>{cliente.localidad ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Total: ${totalCliente.toFixed(2)}</p>
                    <p>Bultos: {totalBultos}</p>
                  </div>
                </div>

                {/* Pedidos del cliente */}
                {cliente.pedidos.map((pedido) => (
                  <div key={pedido.numero_pedido} className="ml-4 text-xs mb-1 grid grid-cols-6 gap-2">
                    <div>
                      <span className="font-semibold">Pedido:</span> #{pedido.numero_pedido}
                    </div>
                    <div>
                      <span className="font-semibold">Fecha:</span>{' '}
                      {new Date(pedido.fecha_pedido).toLocaleDateString('es-AR')}
                    </div>
                    <div>
                      <span className="font-semibold">Estado:</span> {pedido.estado}
                    </div>
                    <div>
                      <span className="font-semibold">Monto:</span> ${pedido.total.toFixed(2)}
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold">Bultos:</span>{' '}
                      {pedido.detalles.reduce((sum, d) => sum + d.cantidad, 0)}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Resumen */}
        <div className="mt-4 pt-3 border-t-2 border-gray-400 text-xs font-semibold">
          <p>Transporte: {totalPedidos} pedidos para {totalClientes} clientes</p>
          <p>Total: ${totalMonto.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
