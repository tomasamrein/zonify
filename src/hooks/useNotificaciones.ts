import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'

const MENSAJES: Record<string, string> = {
  confirmado:  'fue confirmado ✅',
  cancelado:   'fue cancelado ❌',
  facturado:   'fue facturado 🧾',
  entregado:   'fue entregado 🚚',
}

export function useNotificaciones() {
  const perfil = useAuthStore((s) => s.perfil)

  useEffect(() => {
    if (!perfil?.id) return

    const canal = supabase
      .channel(`notif_preventista_${perfil.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `preventista_id=eq.${perfil.id}`,
        },
        (payload) => {
          const nuevo = payload.new as { estado: string; numero_pedido: number }
          const viejo = payload.old as { estado: string }
          if (viejo.estado === nuevo.estado) return

          const msg = MENSAJES[nuevo.estado]
          if (!msg) return

          const texto = `Pedido #${nuevo.numero_pedido} ${msg}`
          if (nuevo.estado === 'cancelado') toast.error(texto)
          else toast.success(texto)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [perfil?.id])
}
