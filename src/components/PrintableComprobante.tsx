import { Database } from '@/types/database'
import { useAuthStore } from '@/store/useAuthStore'

interface ComprobanteData {
  comprobante: {
    id: string
    numero: number
    fecha_emision: string
    subtotal: number
    total_iva: number
    total: number
  }
  pedido: {
    numero_pedido: number
    fecha_pedido: string
    observaciones: string | null
    detalles: Array<{
      cantidad: number
      precio_unitario: number
      descuento_porcentaje: number
      iva_porcentaje: number
      subtotal: number
      total_linea: number
      productos: { codigo: string; nombre: string } | null
    }>
    clientes: {
      razon_social: string
      cuit: string | null
      condicion_iva: Database['public']['Enums']['condicion_iva'] | null
      direccion: string | null
      localidad: string | null
      provincia: string | null
    } | null
  }
}

export function PrintableComprobante({ data }: { data: ComprobanteData }) {
  const { empresa } = useAuthStore()
  const nro = String(data.comprobante.numero).padStart(8, '0')
  const condicionLabel: Record<string, string> = {
    responsable_inscripto: 'R.I.',
    monotributo: 'Mono',
    exento: 'Exento',
    consumidor_final: 'C.F.',
    no_responsable: 'N.R.',
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .printable-page { page-break-after: always; margin: 0; padding: 1rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="printable-page">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b-2 pb-4">
          <div>
            <div className="text-2xl font-bold text-gray-700 mb-2 leading-tight">{empresa?.nombre || 'Empresa'}</div>
            <div className="text-sm">Comprobante {nro}</div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{empresa?.nombre}</p>
            {empresa?.cuit && <p>{empresa.cuit}</p>}
          </div>
        </div>

        {/* Información cliente */}
        <div className="grid grid-cols-2 gap-4 mb-6 border border-gray-300 p-3">
          <div>
            <p className="text-xs text-gray-600">Señor(es)</p>
            <p className="font-semibold text-sm">{data.pedido.clientes?.razon_social ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Factura</p>
            <p className="font-semibold text-sm">PEX{nro}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Domicilio</p>
            <p className="text-xs">{data.pedido.clientes?.direccion ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Fecha</p>
            <p className="text-xs">
              {new Date(data.comprobante.fecha_emision).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Localidad</p>
            <p className="text-xs">{data.pedido.clientes?.localidad ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Cond. Venta</p>
            <p className="text-xs">Contado</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Condición IVA</p>
            <p className="text-xs">
              {data.pedido.clientes?.condicion_iva
                ? condicionLabel[data.pedido.clientes.condicion_iva] ?? data.pedido.clientes.condicion_iva
                : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">CUIT</p>
            <p className="text-xs">{data.pedido.clientes?.cuit ?? '—'}</p>
          </div>
        </div>

        {/* Tabla de detalles */}
        <table className="w-full text-xs mb-4 border-collapse">
          <thead>
            <tr className="bg-gray-100 border border-gray-300">
              <th className="border border-gray-300 p-1 text-left">Código</th>
              <th className="border border-gray-300 p-1 text-left">Descripción</th>
              <th className="border border-gray-300 p-1 text-right w-12">Cantidad</th>
              <th className="border border-gray-300 p-1 text-right w-14">Precio Base</th>
              <th className="border border-gray-300 p-1 text-right w-10">% Dsc</th>
              <th className="border border-gray-300 p-1 text-right w-14">Precio</th>
              <th className="border border-gray-300 p-1 text-right w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.pedido.detalles.map((detalle, idx) => (
              <tr key={idx} className="border border-gray-300">
                <td className="border border-gray-300 p-1">{detalle.productos?.codigo ?? '—'}</td>
                <td className="border border-gray-300 p-1">{detalle.productos?.nombre ?? '—'}</td>
                <td className="border border-gray-300 p-1 text-right">{detalle.cantidad.toFixed(2)}</td>
                <td className="border border-gray-300 p-1 text-right">
                  ${detalle.precio_unitario.toFixed(2)}
                </td>
                <td className="border border-gray-300 p-1 text-right">
                  {detalle.descuento_porcentaje > 0 ? detalle.descuento_porcentaje.toFixed(0) : '-'}
                </td>
                <td className="border border-gray-300 p-1 text-right">
                  ${(detalle.precio_unitario * (1 - detalle.descuento_porcentaje / 100)).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-1 text-right font-semibold">
                  ${detalle.total_linea.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between border-t-2 border-gray-300 pt-2 text-sm">
              <span>Subtotal</span>
              <span>${data.comprobante.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA</span>
              <span>${data.comprobante.total_iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t-2 border-gray-400 pt-2 text-base">
              <span>Total</span>
              <span>${data.comprobante.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {data.pedido.observaciones && (
          <div className="bg-gray-50 p-2 rounded text-xs">
            <p className="font-semibold">Observaciones</p>
            <p>{data.pedido.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  )
}
