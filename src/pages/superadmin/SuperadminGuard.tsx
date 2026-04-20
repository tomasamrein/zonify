import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function SuperadminGuard() {
  const [estado, setEstado] = useState<'cargando' | 'autorizado' | 'no_autorizado'>('cargando')

  useEffect(() => {
    supabase.rpc('es_superadmin').then(({ data, error }) => {
      if (error || !data) setEstado('no_autorizado')
      else setEstado('autorizado')
    })
  }, [])

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (estado === 'no_autorizado') return <Navigate to="/login" replace />

  return <Outlet />
}
