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
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
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
        Relationships: []
      }
      depositos: {
        Row: {
          activo: boolean
          created_at: string
          direccion: string | null
          es_principal: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          es_principal?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          es_principal?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      lista_precios_items: {
        Row: {
          created_at: string
          id: string
          lista_id: string
          precio: number
          producto_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lista_id: string
          precio: number
          producto_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lista_id?: string
          precio?: number
          producto_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      listas_precios: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          es_default: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          es_default?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          es_default?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      pedido_detalles: {
        Row: {
          cantidad: number
          created_at: string
          descuento_porcentaje: number
          id: string
          iva_porcentaje: number
          observaciones: string | null
          pedido_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          total_linea: number
        }
        Insert: {
          cantidad: number
          created_at?: string
          descuento_porcentaje?: number
          id?: string
          iva_porcentaje?: number
          observaciones?: string | null
          pedido_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          total_linea: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          descuento_porcentaje?: number
          id?: string
          iva_porcentaje?: number
          observaciones?: string | null
          pedido_id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          total_linea?: number
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string
          deposito_id: string | null
          dispositivo_origen: string | null
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
        Relationships: []
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono: string | null
          updated_at: string
          zonas_asignadas: string[] | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          id: string
          nombre_completo: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          updated_at?: string
          zonas_asignadas?: string[] | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          updated_at?: string
          zonas_asignadas?: string[] | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          categoria_id: string | null
          codigo_barras: string | null
          codigo_interno: string
          costo: number
          created_at: string
          descripcion: string | null
          id: string
          iva_porcentaje: number
          nombre: string
          peso_kg: number | null
          stock_actual: number
          stock_minimo: number
          stock_reservado: number
          unidad_medida_id: string
          unidades_por_bulto: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          codigo_interno: string
          costo?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          iva_porcentaje?: number
          nombre: string
          peso_kg?: number | null
          stock_actual?: number
          stock_minimo?: number
          stock_reservado?: number
          unidad_medida_id: string
          unidades_por_bulto?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          codigo_interno?: string
          costo?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          iva_porcentaje?: number
          nombre?: string
          peso_kg?: number | null
          stock_actual?: number
          stock_minimo?: number
          stock_reservado?: number
          unidad_medida_id?: string
          unidades_por_bulto?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_movimientos: {
        Row: {
          cantidad: number
          created_at: string
          deposito_id: string | null
          id: string
          motivo: string | null
          pedido_id: string | null
          producto_id: string
          stock_posterior: number
          stock_previo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_stock"]
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          deposito_id?: string | null
          id?: string
          motivo?: string | null
          pedido_id?: string | null
          producto_id: string
          stock_posterior: number
          stock_previo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_stock"]
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          deposito_id?: string | null
          id?: string
          motivo?: string | null
          pedido_id?: string | null
          producto_id?: string
          stock_posterior?: number
          stock_previo?: number
          tipo?: Database["public"]["Enums"]["tipo_movimiento_stock"]
          usuario_id?: string | null
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          activo: boolean
          codigo: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      zonas: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          dia_visita: Database["public"]["Enums"]["dia_semana"]
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          dia_visita: Database["public"]["Enums"]["dia_semana"]
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          dia_visita?: Database["public"]["Enums"]["dia_semana"]
          id?: string
          nombre?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      stock_disponible: { Args: { p_producto_id: string }; Returns: number }
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
      rol_usuario: "admin" | "preventista" | "supervisor" | "deposito"
      tipo_movimiento_stock:
        | "ingreso"
        | "egreso"
        | "ajuste"
        | "devolucion"
        | "transferencia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos de conveniencia derivados del schema generado
export type Producto = Database["public"]["Tables"]["productos"]["Row"]
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"]
export type Pedido = Database["public"]["Tables"]["pedidos"]["Row"]
export type PedidoDetalle = Database["public"]["Tables"]["pedido_detalles"]["Row"]
export type ListaPrecios = Database["public"]["Tables"]["listas_precios"]["Row"]
export type ListaPreciosItem = Database["public"]["Tables"]["lista_precios_items"]["Row"]
export type Categoria = Database["public"]["Tables"]["categorias"]["Row"]
export type UnidadMedida = Database["public"]["Tables"]["unidades_medida"]["Row"]

export type RolUsuario = Database["public"]["Enums"]["rol_usuario"]
export type EstadoPedido = Database["public"]["Enums"]["estado_pedido"]
export type DiaSemana = Database["public"]["Enums"]["dia_semana"]
export type CondicionIva = Database["public"]["Enums"]["condicion_iva"]
