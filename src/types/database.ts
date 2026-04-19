export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          empresa_id: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean
          codigo: string | null
          condicion_iva: Database["public"]["Enums"]["condicion_iva"]
          created_at: string
          cuit: string | null
          dia_visita: Database["public"]["Enums"]["dia_semana"] | null
          direccion: string | null
          email: string | null
          empresa_id: string | null
          id: string
          latitud: number | null
          limite_credito: number | null
          lista_precios_id: string | null
          localidad: string | null
          longitud: number | null
          nombre_fantasia: string | null
          observaciones: string | null
          preventista_id: string | null
          provincia: string | null
          razon_social: string
          saldo_cuenta_corriente: number
          telefono: string | null
          updated_at: string
          zona_id: string | null
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          condicion_iva?: Database["public"]["Enums"]["condicion_iva"]
          created_at?: string
          cuit?: string | null
          dia_visita?: Database["public"]["Enums"]["dia_semana"] | null
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          latitud?: number | null
          limite_credito?: number | null
          lista_precios_id?: string | null
          localidad?: string | null
          longitud?: number | null
          nombre_fantasia?: string | null
          observaciones?: string | null
          preventista_id?: string | null
          provincia?: string | null
          razon_social: string
          saldo_cuenta_corriente?: number
          telefono?: string | null
          updated_at?: string
          zona_id?: string | null
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          condicion_iva?: Database["public"]["Enums"]["condicion_iva"]
          created_at?: string
          cuit?: string | null
          dia_visita?: Database["public"]["Enums"]["dia_semana"] | null
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          latitud?: number | null
          limite_credito?: number | null
          lista_precios_id?: string | null
          localidad?: string | null
          longitud?: number | null
          nombre_fantasia?: string | null
          observaciones?: string | null
          preventista_id?: string | null
          provincia?: string | null
          razon_social?: string
          saldo_cuenta_corriente?: number
          telefono?: string | null
          updated_at?: string
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_lista_precios_id_fkey"
            columns: ["lista_precios_id"]
            isOneToOne: false
            referencedRelation: "listas_precios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_preventista_id_fkey"
            columns: ["preventista_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      cobros: {
        Row: {
          cliente_id: string
          created_at: string
          empresa_id: string
          fecha: string
          forma_pago: string
          id: string
          monto: number
          observaciones: string | null
          pedido_id: string | null
          preventista_id: string
          rendicion_id: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          empresa_id: string
          fecha?: string
          forma_pago?: string
          id?: string
          monto: number
          observaciones?: string | null
          pedido_id?: string | null
          preventista_id: string
          rendicion_id?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          empresa_id?: string
          fecha?: string
          forma_pago?: string
          id?: string
          monto?: number
          observaciones?: string | null
          pedido_id?: string | null
          preventista_id?: string
          rendicion_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_preventista_id_fkey"
            columns: ["preventista_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_rendicion_id_fkey"
            columns: ["rendicion_id"]
            isOneToOne: false
            referencedRelation: "rendiciones"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string
          deposito_id: string | null
          dispositivo_origen: string | null
          empresa_id: string | null
          estado: Database["public"]["Enums"]["estado_pedido"]
          fecha_confirmacion: string | null
          fecha_entrega_estimada: string | null
          fecha_facturacion: string | null
          fecha_pedido: string
          id: string
          lista_precios_id: string
          numero_pedido: number
          observaciones: string | null
          preventista_id: string
          sincronizado_en: string | null
          subtotal: number
          total: number
          total_iva: number
          updated_at: string
          uuid_offline: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          deposito_id?: string | null
          dispositivo_origen?: string | null
          empresa_id?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          fecha_confirmacion?: string | null
          fecha_entrega_estimada?: string | null
          fecha_facturacion?: string | null
          fecha_pedido?: string
          id?: string
          lista_precios_id: string
          numero_pedido?: number
          observaciones?: string | null
          preventista_id: string
          sincronizado_en?: string | null
          subtotal?: number
          total?: number
          total_iva?: number
          updated_at?: string
          uuid_offline?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          deposito_id?: string | null
          dispositivo_origen?: string | null
          empresa_id?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          fecha_confirmacion?: string | null
          fecha_entrega_estimada?: string | null
          fecha_facturacion?: string | null
          fecha_pedido?: string
          id?: string
          lista_precios_id?: string
          numero_pedido?: number
          observaciones?: string | null
          preventista_id?: string
          sincronizado_en?: string | null
          subtotal?: number
          total?: number
          total_iva?: number
          updated_at?: string
          uuid_offline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_lista_precios_id_fkey"
            columns: ["lista_precios_id"]
            isOneToOne: false
            referencedRelation: "listas_precios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_preventista_id_fkey"
            columns: ["preventista_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rendiciones: {
        Row: {
          created_at: string
          empresa_id: string
          estado: string
          fecha: string
          id: string
          observaciones: string | null
          preventista_id: string
          total_cobrado: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado?: string
          fecha?: string
          id?: string
          observaciones?: string | null
          preventista_id: string
          total_cobrado?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado?: string
          fecha?: string
          id?: string
          observaciones?: string | null
          preventista_id?: string
          total_cobrado?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendiciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendiciones_preventista_id_fkey"
            columns: ["preventista_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      [key: string]: any
    }
    Enums: {
      condicion_iva:
        | "responsable_inscripto"
        | "monotributo"
        | "exento"
        | "consumidor_final"
        | "no_responsable"
      dia_semana:
        | "lunes"
        | "martes"
        | "miercoles"
        | "jueves"
        | "viernes"
        | "sabado"
      estado_pedido:
        | "borrador"
        | "pendiente"
        | "confirmado"
        | "facturado"
        | "entregado"
        | "cancelado"
      rol_usuario: "admin" | "preventista" | "supervisor" | "deposito" | "chofer"
      tipo_movimiento_stock:
        | "ingreso"
        | "egreso"
        | "ajuste"
        | "devolucion"
        | "transferencia"
    }
  }
}

export type RolUsuario = Database["public"]["Enums"]["rol_usuario"]
export type EstadoPedido = Database["public"]["Enums"]["estado_pedido"]
export type DiaSemana = Database["public"]["Enums"]["dia_semana"]
export type CondicionIva = Database["public"]["Enums"]["condicion_iva"]
