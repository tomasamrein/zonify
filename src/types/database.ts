export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
      comprobantes: {
        Row: {
          created_at: string
          empresa_id: string
          estado: string
          fecha_emision: string
          id: string
          numero: number
          pdf_url: string | null
          pedido_id: string
          subtotal: number
          tipo: string
          total: number
          total_iva: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado?: string
          fecha_emision?: string
          id?: string
          numero: number
          pdf_url?: string | null
          pedido_id: string
          subtotal: number
          tipo?: string
          total: number
          total_iva: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado?: string
          fecha_emision?: string
          id?: string
          numero?: number
          pdf_url?: string | null
          pedido_id?: string
          subtotal?: number
          tipo?: string
          total?: number
          total_iva?: number
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprobantes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      comprobantes_numeracion: {
        Row: {
          empresa_id: string
          ultimo_numero: number
        }
        Insert: {
          empresa_id: string
          ultimo_numero?: number
        }
        Update: {
          empresa_id?: string
          ultimo_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_numeracion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      depositos: {
        Row: {
          activo: boolean
          created_at: string
          direccion: string | null
          empresa_id: string | null
          es_principal: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          empresa_id?: string | null
          es_principal?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          empresa_id?: string | null
          es_principal?: boolean
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "depositos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activo: boolean
          created_at: string
          cuit: string | null
          email_contacto: string | null
          id: string
          nombre: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          cuit?: string | null
          email_contacto?: string | null
          id?: string
          nombre: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          cuit?: string | null
          email_contacto?: string | null
          id?: string
          nombre?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      lista_precios_items: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          lista_id: string
          precio: number
          producto_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          lista_id: string
          precio: number
          producto_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          lista_id?: string
          precio?: number
          producto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_precios_items_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_precios_items_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas_precios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_precios_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_precios: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          empresa_id: string | null
          es_default: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          es_default?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          es_default?: boolean
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "listas_precios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "pedido_detalles_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_detalles_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
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
            foreignKeyName: "pedidos_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
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
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          updated_at?: string
          zonas_asignadas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_unidad_medida_id_fkey"
            columns: ["unidad_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
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
        Relationships: [
          {
            foreignKeyName: "stock_movimientos_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movimientos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movimientos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movimientos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
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
          empresa_id: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          dia_visita: Database["public"]["Enums"]["dia_semana"]
          empresa_id?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          dia_visita?: Database["public"]["Enums"]["dia_semana"]
          empresa_id?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "zonas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_ventas_exportacion: {
        Row: {
          cantidad: number | null
          comprobante_nro: number | null
          condicion_iva: Database["public"]["Enums"]["condicion_iva"] | null
          cuit: string | null
          descuento_porcentaje: number | null
          empresa_id: string | null
          fecha: string | null
          iva_porcentaje: number | null
          nombre_fantasia: string | null
          numero_pedido: number | null
          precio_unitario: number | null
          preventista: string | null
          producto_nombre: string | null
          razon_social: string | null
          subtotal: number | null
          subtotal_pedido: number | null
          total_iva_linea: number | null
          total_iva_pedido: number | null
          total_linea: number | null
          total_pedido: number | null
          zona: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_empresa_id: { Args: never; Returns: string }
      auth_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      buscar_empresa_por_slug: {
        Args: { p_slug: string }
        Returns: {
          activo: boolean
          id: string
          nombre: string
          plan: string
          slug: string
        }[]
      }
      exportar_ventas_mes: {
        Args: { p_desde: string; p_empresa_id: string; p_hasta: string }
        Returns: {
          cantidad: number
          cliente_condicion_iva: string
          cliente_cuit: string
          cliente_razon_social: string
          descuento_porcentaje: number
          fecha: string
          iva_linea: number
          iva_porcentaje: number
          numero_comprobante: number
          precio_unitario: number
          producto_codigo: string
          producto_nombre: string
          subtotal_linea: number
          total_linea: number
        }[]
      }
      get_next_numero_comprobante: {
        Args: { p_empresa_id: string }
        Returns: number
      }
      stock_disponible: { Args: { p_producto_id: string }; Returns: number }
      verificar_slug_disponible: {
        Args: { p_slug: string }
        Returns: boolean
      }
      crear_empresa_con_admin: {
        Args: {
          p_nombre: string
          p_slug: string
          p_cuit: string
          p_email: string
          p_nombre_admin: string
          p_codigo_admin: string
          p_user_id: string
          p_plan?: string
        }
        Returns: string
      }
      es_superadmin: { Args: Record<never, never>; Returns: boolean }
      superadmin_listar_empresas: {
        Args: Record<never, never>
        Returns: {
          id: string
          nombre: string
          slug: string
          plan: string
          activo: boolean
          created_at: string
          email_contacto: string
          total_usuarios: number
          total_pedidos: number
        }[]
      }
      superadmin_cambiar_plan: {
        Args: { p_empresa_id: string; p_plan: string }
        Returns: void
      }
      superadmin_toggle_empresa: {
        Args: { p_empresa_id: string; p_activo: boolean }
        Returns: void
      }
    }
    Enums: {
      condicion_iva:
        | "responsable_inscripto"
        | "monotributo"
        | "exento"
        | "consumidor_final"
        | "no_responsable"
      dia_semana:
        | "domingo"
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
      rol_usuario:
        | "admin"
        | "preventista"
        | "supervisor"
        | "deposito"
        | "chofer"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      condicion_iva: [
        "responsable_inscripto",
        "monotributo",
        "exento",
        "consumidor_final",
        "no_responsable",
      ],
      dia_semana: [
        "domingo",
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
      ],
      estado_pedido: [
        "borrador",
        "pendiente",
        "confirmado",
        "facturado",
        "entregado",
        "cancelado",
      ],
      rol_usuario: ["admin", "preventista", "supervisor", "deposito", "chofer"],
      tipo_movimiento_stock: [
        "ingreso",
        "egreso",
        "ajuste",
        "devolucion",
        "transferencia",
      ],
    },
  },
} as const

// ── Convenience type aliases ──────────────────────────────────────────────────
export type Producto      = Database['public']['Tables']['productos']['Row']
export type Categoria     = Database['public']['Tables']['categorias']['Row']
export type Zona          = Database['public']['Tables']['zonas']['Row']
export type RolUsuario    = Database['public']['Enums']['rol_usuario']
export type UnidadMedida  = Database["public"]["Tables"]["unidades_medida"]["Row"]
