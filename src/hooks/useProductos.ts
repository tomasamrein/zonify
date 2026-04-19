import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import type { Producto } from '@/types/database'

export type ProductoConPrecio = Producto & { precio: number | null }

interface UseProductosOptions {
  listaPreciosId?: string | null
  soloActivos?: boolean
}

interface UseProductosResult {
  productos: ProductoConPrecio[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useProductos(opts: UseProductosOptions = {}): UseProductosResult {
  const { listaPreciosId, soloActivos = true } = opts
  const empresaId = useAuthStore((s) => s.empresaId)

  const [productos, setProductos] = useState<ProductoConPrecio[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const recargar = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!empresaId) return

    let cancelled = false
    setCargando(true)
    setError(null)

    async function cargar() {
      try {
        let query = supabase
          .from('productos')
          .select('*')
          .eq('empresa_id', empresaId!)
          .order('nombre')

        if (soloActivos) query = query.eq('activo', true)

        const { data: prods, error: errProds } = await query
        if (errProds) throw errProds
        if (cancelled) return

        let precioMap: Record<string, number> = {}

        if (listaPreciosId) {
          const { data: precios, error: errPrecios } = await supabase
            .from('lista_precios_items')
            .select('producto_id, precio')
            .eq('lista_id', listaPreciosId)
            .eq('empresa_id', empresaId!)

          if (errPrecios) throw errPrecios
          if (cancelled) return

          precioMap = Object.fromEntries((precios ?? []).map((p) => [p.producto_id, p.precio]))
        }

        setProductos(
          (prods ?? []).map((p) => ({ ...p, precio: precioMap[p.id] ?? null }))
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar productos')
      } finally {
        if (!cancelled) setCargando(false)
      }
    }

    cargar()
    return () => { cancelled = true }
  }, [empresaId, listaPreciosId, soloActivos, tick])

  return { productos, cargando, error, recargar }
}
