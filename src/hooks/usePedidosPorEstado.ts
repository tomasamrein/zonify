import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type EstadoPedido = Database['public']['Enums']['estado_pedido']

export type PedidoConDetalles = Database['public']['Tables']['pedidos']['Row'] & {
  clientes: (Pick<Database['public']['Tables']['clientes']['Row'], 'razon_social' | 'direccion' | 'localidad' | 'telefono'>) | null
  perfiles: (Pick<Database['public']['Tables']['perfiles']['Row'], 'nombre_completo'>) | null
  pedido_detalles: (Database['public']['Tables']['pedido_detalles']['Row'] & {
    productos: Pick<Database['public']['Tables']['productos']['Row'], 'nombre'> | null
  })[]
}

export function usePedidosPorEstado(estado: EstadoPedido | EstadoPedido[]) {
  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const estadoKey = Array.isArray(estado) ? estado.join(',') : estado

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const estados = Array.isArray(estado) ? estado : [estado]
      const { data, error: err } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes(razon_social, direccion, localidad, telefono),
          perfiles!pedidos_preventista_id_fkey(nombre_completo),
          pedido_detalles(*, productos(nombre))
        `)
        .in('estado', estados)
        .order('fecha_pedido', { ascending: true })

      if (err) throw err
      setPedidos((data as PedidoConDetalles[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      setCargando(false)
    }
  }, [estado])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar() }, [estadoKey])

  return { pedidos, cargando, error, recargar: cargar }
}
