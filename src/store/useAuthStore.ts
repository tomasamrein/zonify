import { create } from 'zustand/react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type Perfil  = Database['public']['Tables']['perfiles']['Row']
export type Empresa = Database['public']['Tables']['empresas']['Row']

interface AuthState {
  user:      User    | null
  perfil:    Perfil  | null
  empresa:   Empresa | null
  empresaId: string  | null
  cargando:  boolean

  inicializar:    () => Promise<void>
  loginVendedor:  (slug: string, codigoVendedor: string, password: string) => Promise<void>
  logout:         () => Promise<void>
}

async function fetchPerfil(userId: string): Promise<Perfil | null> {
  const { data } = await supabase.from('perfiles').select('*').eq('id', userId).single()
  return data ?? null
}

async function fetchEmpresa(empresaId: string): Promise<Empresa | null> {
  const { data } = await supabase.from('empresas').select('*').eq('id', empresaId).single()
  return data ?? null
}

export const useAuthStore = create<AuthState>()((set) => ({
  user:      null,
  perfil:    null,
  empresa:   null,
  empresaId: null,
  cargando:  true,

  inicializar: async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const perfil  = await fetchPerfil(session.user.id)
      const empresa = perfil?.empresa_id ? await fetchEmpresa(perfil.empresa_id) : null
      set({ user: session.user, perfil, empresa, empresaId: perfil?.empresa_id ?? null, cargando: false })
    } else {
      set({ cargando: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const perfil  = await fetchPerfil(session.user.id)
        const empresa = perfil?.empresa_id ? await fetchEmpresa(perfil.empresa_id) : null
        set({ user: session.user, perfil, empresa, empresaId: perfil?.empresa_id ?? null })
      } else {
        set({ user: null, perfil: null, empresa: null, empresaId: null })
      }
    })
  },

  loginVendedor: async (slug, codigoVendedor, password) => {
    set({ cargando: true })
    try {
      // Verificar que la empresa exista y esté activa (función SECURITY DEFINER, no requiere auth)
      const { data: empresaRows, error: empresaError } = await supabase
        .rpc('buscar_empresa_por_slug', { p_slug: slug.toLowerCase().trim() })

      const empresaData = empresaRows?.[0] ?? null

      if (empresaError || !empresaData) {
        throw new Error('No se encontró la distribuidora. Verificá el nombre de empresa.')
      }
      if (!empresaData.activo) {
        throw new Error('Esta distribuidora no está activa. Contactá a tu administrador.')
      }

      // El email es interno: nunca se muestra al usuario
      const email = `${codigoVendedor.trim()}@${slug.toLowerCase().trim()}.com`

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        throw new Error('Código de vendedor o contraseña incorrectos.')
      }
    } finally {
      set({ cargando: false })
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
  },
}))
