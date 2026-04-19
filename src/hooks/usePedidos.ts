import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type PedidoDB = Database['public']['Tables']['pedidos']['Row'] & {
  clientes: { razon_social: string } | null
}

export function usePedidos() {
  const [pedidos, setPedidos] = useState<PedidoDB[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pedidos')
        .select('*, clientes(razon_social)')
        .order('fecha_pedido', { ascending: false })

      if (err) throw err
      setPedidos((data as PedidoDB[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { pedidos, cargando, error, recargar: cargar }
}
