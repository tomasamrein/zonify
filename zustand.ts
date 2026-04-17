// stores/pedidosStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

type EstadoSync = 'pendiente' | 'sincronizando' | 'sincronizado' | 'error';

interface PedidoOffline {
  uuid_offline: string;           // UUID generado en el device
  id_servidor?: string;           // UUID que devuelve Supabase al sincronizar
  cliente_id: string;
  preventista_id: string;
  lista_precios_id: string;
  detalles: DetalleOffline[];
  subtotal: number;
  total: number;
  observaciones?: string;
  creado_en: string;              // ISO timestamp local
  estado_sync: EstadoSync;
  intentos_sync: number;
  ultimo_error?: string;
}

interface DetalleOffline {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;        // CONGELADO al momento de la carga
  descuento_porcentaje: number;
  iva_porcentaje: number;
}

interface PedidosState {
  cola: PedidoOffline[];
  sincronizando: boolean;
  ultimaSync: string | null;

  agregarPedido: (pedido: Omit<PedidoOffline, 'uuid_offline' | 'estado_sync' | 'intentos_sync' | 'creado_en'>) => string;
  marcarSincronizado: (uuid_offline: string, id_servidor: string) => void;
  marcarError: (uuid_offline: string, error: string) => void;
  sincronizarCola: () => Promise<void>;
  limpiarSincronizados: () => void;
}

export const usePedidosStore = create<PedidosState>()(
  persist(
    (set, get) => ({
      cola: [],
      sincronizando: false,
      ultimaSync: null,

      agregarPedido: (pedido) => {
        const uuid_offline = uuidv4();
        const nuevo: PedidoOffline = {
          ...pedido,
          uuid_offline,
          estado_sync: 'pendiente',
          intentos_sync: 0,
          creado_en: new Date().toISOString(),
        };
        set((s) => ({ cola: [...s.cola, nuevo] }));
        // Disparo inmediato de sync si hay red
        if (navigator.onLine) get().sincronizarCola();
        return uuid_offline;
      },

      marcarSincronizado: (uuid_offline, id_servidor) => {
        set((s) => ({
          cola: s.cola.map((p) =>
            p.uuid_offline === uuid_offline
              ? { ...p, estado_sync: 'sincronizado', id_servidor }
              : p
          ),
          ultimaSync: new Date().toISOString(),
        }));
      },

      marcarError: (uuid_offline, error) => {
        set((s) => ({
          cola: s.cola.map((p) =>
            p.uuid_offline === uuid_offline
              ? { ...p, estado_sync: 'error', intentos_sync: p.intentos_sync + 1, ultimo_error: error }
              : p
          ),
        }));
      },

      sincronizarCola: async () => {
        const { cola, sincronizando } = get();
        if (sincronizando || !navigator.onLine) return;

        set({ sincronizando: true });
        const pendientes = cola.filter(
          (p) => p.estado_sync === 'pendiente' || (p.estado_sync === 'error' && p.intentos_sync < 5)
        );

        for (const pedido of pendientes) {
          try {
            // Idempotencia vía uuid_offline (unique en Postgres)
            const { data, error } = await supabase.rpc('sincronizar_pedido_offline', {
              payload: pedido,
            });
            if (error) throw error;
            get().marcarSincronizado(pedido.uuid_offline, data.id);
          } catch (err: any) {
            get().marcarError(pedido.uuid_offline, err.message);
          }
        }

        set({ sincronizando: false });
      },

      limpiarSincronizados: () => {
        set((s) => ({ cola: s.cola.filter((p) => p.estado_sync !== 'sincronizado') }));
      },
    }),
    {
      name: 'zonify-pedidos',
      storage: createJSONStorage(() => localStorage),
      // Para volúmenes grandes, migrar a IndexedDB con idb-keyval
    }
  )
);

// Listener global: cuando vuelve la red, sincronizar
window.addEventListener('online', () => {
  usePedidosStore.getState().sincronizarCola();
});