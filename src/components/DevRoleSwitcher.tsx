import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import type { RolUsuario } from '@/types/database'

const ROLES: RolUsuario[] = ['admin', 'preventista', 'deposito', 'chofer', 'supervisor']

const ROL_COLORS: Record<RolUsuario, string> = {
  admin:       'bg-purple-600',
  preventista: 'bg-brand-600',
  deposito:    'bg-amber-600',
  chofer:      'bg-emerald-600',
  supervisor:  'bg-blue-600',
}

export function DevRoleSwitcher() {
  const perfil = useAuthStore((s) => s.perfil)
  const inicializar = useAuthStore((s) => s.inicializar)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  if (!perfil) return null

  async function cambiarRol(rol: RolUsuario) {
    if (!perfil) return
    setLoading(true)
    setOpen(false)
    try {
      await supabase.from('perfiles').update({ rol }).eq('id', perfil.id)
      await inicializar()
    } finally {
      setLoading(false)
    }
  }

  const color = ROL_COLORS[perfil.rol] ?? 'bg-gray-600'

  return (
    <div className="fixed bottom-24 right-4 z-[100] lg:bottom-6">
      {open && (
        <div className="mb-2 flex flex-col gap-1.5 items-end">
          {ROLES.filter((r) => r !== perfil.rol).map((rol) => (
            <button
              key={rol}
              onClick={() => cambiarRol(rol)}
              className={`${ROL_COLORS[rol]} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:opacity-90 transition-opacity`}
            >
              → {rol}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`${color} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60`}
      >
        {loading ? (
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-white/70" />
        )}
        {perfil.rol}
      </button>
    </div>
  )
}
