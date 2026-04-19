import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import type { Database } from '@/types/database'

type Perfil = Database['public']['Tables']['perfiles']['Row']

type DiaSemana = Database['public']['Enums']['dia_semana']
export type ClienteConZona = Database['public']['Tables']['clientes']['Row'] & {
  zonas: { nombre: string } | null
}

function getDiaActual(): DiaSemana | null {
  const dias: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return dias[new Date().getDay()]
}

interface UseClientesOpts {
  soloHoy?: boolean
}

export function useClientes({ soloHoy = false }: UseClientesOpts = {}) {
  const { empresaId, perfil } = useAuthStore()
  const [clientes, setClientes] = useState<ClienteConZona[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    if (soloHoy && !perfil) return

    const diaActual = getDiaActual()

    if (soloHoy && diaActual === null) {
      setClientes([])
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)
    try {
      let query = supabase
        .from('clientes')
        .select('*, zonas(nombre)')
        .eq('empresa_id', empresaId)
        .eq('activo', true)

      if (soloHoy && diaActual) {
        query = query.eq('dia_visita', diaActual)

        if (perfil?.rol === 'preventista' && perfil.zonas_asignadas?.length) {
          query = query.in('zona_id', perfil.zonas_asignadas)
        }
      }

      const { data, error: err } = await query.order('razon_social')
      if (err) throw err

      setClientes((data as ClienteConZona[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setCargando(false)
    }
  }, [soloHoy, empresaId, perfil?.rol, perfil?.zonas_asignadas])

  useEffect(() => { cargar() }, [cargar])

  return { clientes, cargando, error, recargar: cargar }
}
