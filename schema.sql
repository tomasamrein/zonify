-- ============================================================================
-- ZONIFY - Schema SaaS Multi-tenant
-- Distribuidora de consumo masivo
-- Aislamiento de datos por empresa_id (discriminación por columna + RLS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE rol_usuario            AS ENUM ('admin', 'preventista', 'supervisor', 'deposito');
CREATE TYPE estado_pedido          AS ENUM ('borrador', 'pendiente', 'confirmado', 'facturado', 'entregado', 'cancelado');
CREATE TYPE tipo_movimiento_stock  AS ENUM ('ingreso', 'egreso', 'ajuste', 'devolucion', 'transferencia');
CREATE TYPE dia_semana             AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado');
CREATE TYPE condicion_iva          AS ENUM ('responsable_inscripto', 'monotributo', 'exento', 'consumidor_final', 'no_responsable');

-- ============================================================================
-- EMPRESAS (tenant raíz — una fila por distribuidora)
-- ============================================================================
CREATE TABLE empresas (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          text        NOT NULL,
    slug            text        UNIQUE NOT NULL,   -- identificador URL-friendly
    cuit            text,
    email_contacto  text,
    plan            text        NOT NULL DEFAULT 'trial', -- 'trial' | 'basic' | 'pro'
    activo          boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- PERFILES (extiende auth.users de Supabase)
-- ============================================================================
CREATE TABLE perfiles (
    id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id      uuid        REFERENCES empresas(id) ON DELETE RESTRICT,
    nombre_completo text        NOT NULL,
    email           text        UNIQUE NOT NULL,
    telefono        text,
    rol             rol_usuario NOT NULL DEFAULT 'preventista',
    activo          boolean     NOT NULL DEFAULT true,
    zonas_asignadas uuid[]      DEFAULT '{}',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_perfiles_empresa ON perfiles(empresa_id);
CREATE INDEX idx_perfiles_rol     ON perfiles(rol) WHERE activo = true;

-- ============================================================================
-- ZONAS
-- ============================================================================
CREATE TABLE zonas (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id  uuid        REFERENCES empresas(id) ON DELETE RESTRICT,
    nombre      text        NOT NULL,
    descripcion text,
    dia_visita  dia_semana  NOT NULL,
    activo      boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT zonas_nombre_empresa UNIQUE (empresa_id, nombre)
);

CREATE INDEX idx_zonas_empresa ON zonas(empresa_id);

-- ============================================================================
-- CATEGORÍAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE categorias (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id  uuid        REFERENCES empresas(id) ON DELETE RESTRICT,
    nombre      text        NOT NULL,
    descripcion text,
    activo      boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categorias_nombre_empresa UNIQUE (empresa_id, nombre)
);

CREATE INDEX idx_categorias_empresa ON categorias(empresa_id);

-- ============================================================================
-- UNIDADES DE MEDIDA (referencia compartida, sin empresa_id)
-- ============================================================================
CREATE TABLE unidades_medida (
    id      uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo  text    NOT NULL UNIQUE,  -- 'UN', 'CJ', 'BL', 'PK', 'KG', 'LT'
    nombre  text    NOT NULL,
    activo  boolean NOT NULL DEFAULT true
);

-- ============================================================================
-- DEPÓSITOS
-- ============================================================================
CREATE TABLE depositos (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id  uuid        REFERENCES empresas(id) ON DELETE RESTRICT,
    nombre      text        NOT NULL,
    direccion   text,
    es_principal boolean    NOT NULL DEFAULT false,
    activo      boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT depositos_nombre_empresa UNIQUE (empresa_id, nombre)
);

-- ============================================================================
-- PRODUCTOS
-- ============================================================================
CREATE TABLE productos (
    id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id        uuid        NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo_interno    text        NOT NULL,
    codigo_barras     text        UNIQUE,     -- EAN global único
    nombre            text        NOT NULL,
    descripcion       text,
    categoria_id      uuid        REFERENCES categorias(id) ON DELETE RESTRICT,
    unidad_medida_id  uuid        NOT NULL REFERENCES unidades_medida(id) ON DELETE RESTRICT,
    unidades_por_bulto integer    NOT NULL DEFAULT 1,
    stock_actual      numeric(12,2) NOT NULL DEFAULT 0,
    stock_minimo      numeric(12,2) NOT NULL DEFAULT 0,
    stock_reservado   numeric(12,2) NOT NULL DEFAULT 0,
    costo             numeric(12,2) NOT NULL DEFAULT 0,
    iva_porcentaje    numeric(5,2)  NOT NULL DEFAULT 21.00,
    peso_kg           numeric(10,3),
    activo            boolean     NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT productos_codigo_interno_empresa UNIQUE (empresa_id, codigo_interno)
);

CREATE INDEX idx_productos_empresa      ON productos(empresa_id);
CREATE INDEX idx_productos_categoria    ON productos(categoria_id);
CREATE INDEX idx_productos_stock_critico ON productos(id)
    WHERE stock_actual <= stock_minimo AND activo = true;

CREATE OR REPLACE FUNCTION stock_disponible(p_producto_id uuid)
RETURNS numeric AS $$
    SELECT COALESCE(stock_actual - stock_reservado, 0)
    FROM productos WHERE id = p_producto_id;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- LISTAS DE PRECIOS
-- ============================================================================
CREATE TABLE listas_precios (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id  uuid        NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    nombre      text        NOT NULL,
    descripcion text,
    activo      boolean     NOT NULL DEFAULT true,
    es_default  boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT listas_precios_nombre_empresa UNIQUE (empresa_id, nombre)
);

CREATE UNIQUE INDEX idx_lista_default_empresa ON listas_precios(empresa_id) WHERE es_default = true;
CREATE INDEX idx_listas_empresa ON listas_precios(empresa_id);

CREATE TABLE lista_precios_items (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id  uuid        NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    lista_id    uuid        NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,
    producto_id uuid        NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    precio      numeric(12,2) NOT NULL CHECK (precio >= 0),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (lista_id, producto_id)
);

CREATE INDEX idx_lista_items_producto ON lista_precios_items(producto_id);

-- ============================================================================
-- CLIENTES
-- ============================================================================
CREATE TABLE clientes (
    id                      uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id              uuid          NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo                  text,
    razon_social            text          NOT NULL,
    nombre_fantasia         text,
    cuit                    text,
    condicion_iva           condicion_iva NOT NULL DEFAULT 'consumidor_final',
    direccion               text,
    localidad               text,
    provincia               text,
    telefono                text,
    email                   text,
    zona_id                 uuid          REFERENCES zonas(id) ON DELETE SET NULL,
    dia_visita              dia_semana,
    lista_precios_id        uuid          REFERENCES listas_precios(id) ON DELETE SET NULL,
    preventista_id          uuid          REFERENCES perfiles(id) ON DELETE SET NULL,
    limite_credito          numeric(12,2) DEFAULT 0,
    saldo_cuenta_corriente  numeric(12,2) NOT NULL DEFAULT 0,
    observaciones           text,
    latitud                 numeric(10,7),
    longitud                numeric(10,7),
    activo                  boolean       NOT NULL DEFAULT true,
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT clientes_cuit_empresa UNIQUE (empresa_id, cuit)
);

CREATE INDEX idx_clientes_empresa    ON clientes(empresa_id);
CREATE INDEX idx_clientes_zona       ON clientes(zona_id)        WHERE activo = true;
CREATE INDEX idx_clientes_preventista ON clientes(preventista_id) WHERE activo = true;
CREATE INDEX idx_clientes_dia        ON clientes(dia_visita)      WHERE activo = true;

-- ============================================================================
-- PEDIDOS (cabecera)
-- ============================================================================
CREATE SEQUENCE pedidos_numero_seq START 1000;

CREATE TABLE pedidos (
    id                      uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id              uuid          NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    numero_pedido           bigint        NOT NULL UNIQUE DEFAULT nextval('pedidos_numero_seq'),
    cliente_id              uuid          NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    preventista_id          uuid          NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    deposito_id             uuid          REFERENCES depositos(id) ON DELETE SET NULL,
    lista_precios_id        uuid          NOT NULL REFERENCES listas_precios(id) ON DELETE RESTRICT,
    estado                  estado_pedido NOT NULL DEFAULT 'pendiente',
    fecha_pedido            timestamptz   NOT NULL DEFAULT now(),
    fecha_entrega_estimada  date,
    fecha_confirmacion      timestamptz,
    fecha_facturacion       timestamptz,
    subtotal                numeric(12,2) NOT NULL DEFAULT 0,
    total_iva               numeric(12,2) NOT NULL DEFAULT 0,
    total                   numeric(12,2) NOT NULL DEFAULT 0,
    observaciones           text,
    uuid_offline            uuid          UNIQUE,
    sincronizado_en         timestamptz,
    dispositivo_origen      text,
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedidos_empresa    ON pedidos(empresa_id);
CREATE INDEX idx_pedidos_cliente    ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_preventista ON pedidos(preventista_id);
CREATE INDEX idx_pedidos_estado     ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha      ON pedidos(fecha_pedido DESC);

-- ============================================================================
-- PEDIDO DETALLES (renglones — precios congelados)
-- ============================================================================
CREATE TABLE pedido_detalles (
    id                    uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id             uuid          NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id           uuid          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad              numeric(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario       numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento_porcentaje  numeric(5,2)  NOT NULL DEFAULT 0 CHECK (descuento_porcentaje BETWEEN 0 AND 100),
    iva_porcentaje        numeric(5,2)  NOT NULL DEFAULT 21.00,
    subtotal              numeric(12,2) NOT NULL,
    total_linea           numeric(12,2) NOT NULL,
    observaciones         text,
    created_at            timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedido_detalles_pedido   ON pedido_detalles(pedido_id);
CREATE INDEX idx_pedido_detalles_producto ON pedido_detalles(producto_id);

-- ============================================================================
-- KARDEX / MOVIMIENTOS DE STOCK
-- ============================================================================
CREATE TABLE stock_movimientos (
    id              uuid                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id     uuid                    NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    deposito_id     uuid                    REFERENCES depositos(id) ON DELETE SET NULL,
    tipo            tipo_movimiento_stock   NOT NULL,
    cantidad        numeric(12,2)           NOT NULL,
    stock_previo    numeric(12,2)           NOT NULL,
    stock_posterior numeric(12,2)           NOT NULL,
    pedido_id       uuid                    REFERENCES pedidos(id) ON DELETE SET NULL,
    usuario_id      uuid                    REFERENCES perfiles(id) ON DELETE SET NULL,
    motivo          text,
    created_at      timestamptz             NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_mov_producto ON stock_movimientos(producto_id, created_at DESC);
CREATE INDEX idx_stock_mov_pedido   ON stock_movimientos(pedido_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_updated      BEFORE UPDATE ON empresas          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_perfiles_updated      BEFORE UPDATE ON perfiles          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_productos_updated     BEFORE UPDATE ON productos         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clientes_updated      BEFORE UPDATE ON clientes          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pedidos_updated       BEFORE UPDATE ON pedidos           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lista_items_updated   BEFORE UPDATE ON lista_precios_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION calcular_totales_detalle()
RETURNS trigger AS $$
BEGIN
    new.subtotal   := ROUND(new.cantidad * new.precio_unitario * (1 - new.descuento_porcentaje / 100), 2);
    new.total_linea := ROUND(new.subtotal * (1 + new.iva_porcentaje / 100), 2);
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_totales_detalle
    BEFORE INSERT OR UPDATE ON pedido_detalles
    FOR EACH ROW EXECUTE FUNCTION calcular_totales_detalle();

CREATE OR REPLACE FUNCTION recalcular_total_pedido()
RETURNS trigger AS $$
DECLARE v_pedido_id uuid;
BEGIN
    v_pedido_id := COALESCE(new.pedido_id, old.pedido_id);
    UPDATE pedidos SET
        subtotal  = COALESCE((SELECT SUM(subtotal)              FROM pedido_detalles WHERE pedido_id = v_pedido_id), 0),
        total_iva = COALESCE((SELECT SUM(total_linea - subtotal) FROM pedido_detalles WHERE pedido_id = v_pedido_id), 0),
        total     = COALESCE((SELECT SUM(total_linea)            FROM pedido_detalles WHERE pedido_id = v_pedido_id), 0)
    WHERE id = v_pedido_id;
    RETURN COALESCE(new, old);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_pedido
    AFTER INSERT OR UPDATE OR DELETE ON pedido_detalles
    FOR EACH ROW EXECUTE FUNCTION recalcular_total_pedido();

CREATE OR REPLACE FUNCTION gestionar_stock_por_estado()
RETURNS trigger AS $$
DECLARE r record; v_stock numeric(12,2);
BEGIN
    IF (tg_op = 'UPDATE' AND old.estado != 'confirmado' AND new.estado = 'confirmado') THEN
        FOR r IN SELECT producto_id, cantidad FROM pedido_detalles WHERE pedido_id = new.id LOOP
            SELECT stock_actual - stock_reservado INTO v_stock FROM productos WHERE id = r.producto_id FOR UPDATE;
            IF v_stock < r.cantidad THEN
                RAISE EXCEPTION 'Stock insuficiente para producto % (disponible: %, solicitado: %)',
                    r.producto_id, v_stock, r.cantidad;
            END IF;
            UPDATE productos SET stock_reservado = stock_reservado + r.cantidad WHERE id = r.producto_id;
        END LOOP;

    ELSIF (tg_op = 'UPDATE' AND old.estado != 'facturado' AND new.estado = 'facturado') THEN
        FOR r IN SELECT producto_id, cantidad FROM pedido_detalles WHERE pedido_id = new.id LOOP
            SELECT stock_actual INTO v_stock FROM productos WHERE id = r.producto_id FOR UPDATE;
            UPDATE productos SET
                stock_actual   = stock_actual - r.cantidad,
                stock_reservado = GREATEST(stock_reservado - r.cantidad, 0)
            WHERE id = r.producto_id;
            INSERT INTO stock_movimientos
                (producto_id, deposito_id, tipo, cantidad, stock_previo, stock_posterior, pedido_id, usuario_id, motivo)
            VALUES (r.producto_id, new.deposito_id, 'egreso', -r.cantidad, v_stock, v_stock - r.cantidad,
                    new.id, new.preventista_id, 'Facturación pedido #' || new.numero_pedido);
        END LOOP;
        new.fecha_facturacion := now();

    ELSIF (tg_op = 'UPDATE' AND old.estado = 'confirmado' AND new.estado = 'cancelado') THEN
        FOR r IN SELECT producto_id, cantidad FROM pedido_detalles WHERE pedido_id = new.id LOOP
            UPDATE productos SET stock_reservado = GREATEST(stock_reservado - r.cantidad, 0) WHERE id = r.producto_id;
        END LOOP;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gestionar_stock
    BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION gestionar_stock_por_estado();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE empresas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_detalles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE listas_precios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_precios_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movimientos  ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION auth_rol() RETURNS rol_usuario AS $$
    SELECT rol FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_empresa_id() RETURNS uuid AS $$
    SELECT empresa_id FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Empresas
CREATE POLICY "empresas_select" ON empresas FOR SELECT USING (id = auth_empresa_id());
CREATE POLICY "empresas_update" ON empresas FOR UPDATE USING (id = auth_empresa_id() AND auth_rol() = 'admin');

-- Perfiles
CREATE POLICY "perfiles_select"        ON perfiles FOR SELECT
    USING (id = auth.uid() OR (empresa_id = auth_empresa_id() AND auth_rol() IN ('admin','supervisor')));
CREATE POLICY "perfiles_update_propio" ON perfiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "perfiles_admin_all"     ON perfiles FOR ALL
    USING (empresa_id = auth_empresa_id() AND auth_rol() = 'admin');

-- Productos
CREATE POLICY "productos_select" ON productos FOR SELECT USING (empresa_id = auth_empresa_id());
CREATE POLICY "productos_write"  ON productos FOR ALL
    USING (empresa_id = auth_empresa_id() AND auth_rol() IN ('admin','deposito'));

-- Listas de precios
CREATE POLICY "listas_select"       ON listas_precios     FOR SELECT USING (empresa_id = auth_empresa_id());
CREATE POLICY "listas_write"        ON listas_precios     FOR ALL    USING (empresa_id = auth_empresa_id() AND auth_rol() = 'admin');
CREATE POLICY "listas_items_select" ON lista_precios_items FOR SELECT USING (empresa_id = auth_empresa_id());
CREATE POLICY "listas_items_write"  ON lista_precios_items FOR ALL    USING (empresa_id = auth_empresa_id() AND auth_rol() = 'admin');

-- Clientes
CREATE POLICY "clientes_select" ON clientes FOR SELECT
    USING (empresa_id = auth_empresa_id() AND (auth_rol() IN ('admin','supervisor') OR preventista_id = auth.uid()));
CREATE POLICY "clientes_write"  ON clientes FOR ALL
    USING (empresa_id = auth_empresa_id() AND (auth_rol() IN ('admin','supervisor') OR preventista_id = auth.uid()));

-- Pedidos
CREATE POLICY "pedidos_select" ON pedidos FOR SELECT
    USING (empresa_id = auth_empresa_id() AND (auth_rol() IN ('admin','supervisor') OR preventista_id = auth.uid()));
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT
    WITH CHECK (empresa_id = auth_empresa_id() AND (preventista_id = auth.uid() OR auth_rol() IN ('admin','supervisor')));
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE
    USING (empresa_id = auth_empresa_id()
        AND (auth_rol() IN ('admin','supervisor')
             OR (preventista_id = auth.uid() AND estado IN ('borrador','pendiente'))));

-- Pedido detalles (join a pedidos para el filtro de empresa)
CREATE POLICY "pedido_detalles_select" ON pedido_detalles FOR SELECT
    USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_id
        AND p.empresa_id = auth_empresa_id()
        AND (auth_rol() IN ('admin','supervisor') OR p.preventista_id = auth.uid())));
CREATE POLICY "pedido_detalles_write" ON pedido_detalles FOR ALL
    USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_id
        AND p.empresa_id = auth_empresa_id()
        AND (auth_rol() IN ('admin','supervisor')
             OR (p.preventista_id = auth.uid() AND p.estado IN ('borrador','pendiente')))));

-- Stock movimientos
CREATE POLICY "stock_mov_select" ON stock_movimientos FOR SELECT
    USING (auth_rol() IN ('admin','supervisor','deposito')
        AND EXISTS (SELECT 1 FROM productos pr WHERE pr.id = producto_id AND pr.empresa_id = auth_empresa_id()));

-- ============================================================================
-- FUNCIONES DE AUTENTICACIÓN PÚBLICA
-- ============================================================================

-- Usada por el login del preventista para resolver empresa sin estar autenticado
CREATE OR REPLACE FUNCTION buscar_empresa_por_slug(p_slug text)
RETURNS TABLE (id uuid, nombre text, slug text, activo boolean, plan text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT id, nombre, slug, activo, plan
    FROM empresas
    WHERE slug = p_slug
    LIMIT 1;
$$;

-- ============================================================================
-- CONTADORES DE NUMERACIÓN POR EMPRESA
-- ============================================================================
CREATE TABLE comprobantes_numeracion (
    empresa_id    uuid    PRIMARY KEY REFERENCES empresas(id) ON DELETE CASCADE,
    ultimo_numero integer NOT NULL DEFAULT 0
);

-- ============================================================================
-- COMPROBANTES NO FISCALES
-- ============================================================================
CREATE TABLE comprobantes (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id      uuid        NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    pedido_id       uuid        NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    numero          integer     NOT NULL,
    tipo            text        NOT NULL DEFAULT 'remito', -- 'remito' | 'comprobante_x' | 'nota_credito'
    fecha_emision   timestamptz NOT NULL DEFAULT now(),
    estado          text        NOT NULL DEFAULT 'emitido', -- 'emitido' | 'anulado'
    subtotal        numeric(12,2) NOT NULL,
    total_iva       numeric(12,2) NOT NULL,
    total           numeric(12,2) NOT NULL,
    pdf_url         text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT comprobantes_numero_empresa UNIQUE (empresa_id, numero)
);

CREATE INDEX idx_comprobantes_empresa ON comprobantes(empresa_id);
CREATE INDEX idx_comprobantes_pedido  ON comprobantes(pedido_id);
CREATE INDEX idx_comprobantes_fecha   ON comprobantes(fecha_emision DESC);

CREATE OR REPLACE FUNCTION get_next_numero_comprobante(p_empresa_id uuid)
RETURNS integer AS $$
DECLARE v_numero integer;
BEGIN
    INSERT INTO comprobantes_numeracion (empresa_id, ultimo_numero)
    VALUES (p_empresa_id, 1)
    ON CONFLICT (empresa_id) DO UPDATE
        SET ultimo_numero = comprobantes_numeracion.ultimo_numero + 1
    RETURNING ultimo_numero INTO v_numero;
    RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_comprobante_en_facturacion()
RETURNS trigger AS $$
BEGIN
    IF (tg_op = 'UPDATE' AND old.estado != 'facturado' AND new.estado = 'facturado') THEN
        INSERT INTO comprobantes (empresa_id, pedido_id, numero, subtotal, total_iva, total)
        VALUES (
            new.empresa_id,
            new.id,
            get_next_numero_comprobante(new.empresa_id),
            new.subtotal,
            new.total_iva,
            new.total
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_comprobante
    AFTER UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION generar_comprobante_en_facturacion();

ALTER TABLE comprobantes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes_numeracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comprobantes_select"  ON comprobantes FOR SELECT
    USING (empresa_id = auth_empresa_id());
CREATE POLICY "comprobantes_write"   ON comprobantes FOR ALL
    USING (empresa_id = auth_empresa_id() AND auth_rol() IN ('admin','supervisor'));
CREATE POLICY "numeracion_all"       ON comprobantes_numeracion FOR ALL
    USING (empresa_id = auth_empresa_id());

CREATE OR REPLACE VIEW vista_ventas_exportacion AS
SELECT
    c.numero                                    AS comprobante_nro,
    c.fecha_emision::date                       AS fecha,
    p.numero_pedido,
    cl.razon_social,
    cl.nombre_fantasia,
    cl.cuit,
    cl.condicion_iva,
    pr.nombre_completo                          AS preventista,
    z.nombre                                    AS zona,
    pd.producto_nombre,
    pd.cantidad,
    pd.precio_unitario,
    pd.descuento_porcentaje,
    pd.subtotal,
    pd.iva_porcentaje,
    pd.total_iva_linea,
    pd.total_linea,
    c.subtotal                                  AS subtotal_pedido,
    c.total_iva                                 AS total_iva_pedido,
    c.total                                     AS total_pedido,
    c.empresa_id
FROM comprobantes c
JOIN pedidos p          ON p.id = c.pedido_id
JOIN clientes cl        ON cl.id = p.cliente_id
LEFT JOIN perfiles pr   ON pr.id = p.preventista_id
LEFT JOIN zonas z       ON z.id = cl.zona_id
JOIN LATERAL (
    SELECT
        prod.nombre                                              AS producto_nombre,
        det.cantidad,
        det.precio_unitario,
        det.descuento_porcentaje,
        det.subtotal,
        det.iva_porcentaje,
        ROUND(det.total_linea - det.subtotal, 2)                AS total_iva_linea,
        det.total_linea
    FROM pedido_detalles det
    JOIN productos prod ON prod.id = det.producto_id
    WHERE det.pedido_id = p.id
) pd ON true
WHERE c.estado = 'emitido';

CREATE OR REPLACE FUNCTION exportar_ventas_mes(
    p_empresa_id uuid,
    p_desde date,
    p_hasta date
)
RETURNS TABLE (
    comprobante_nro      integer,
    fecha                date,
    numero_pedido        bigint,
    razon_social         text,
    nombre_fantasia      text,
    cuit                 text,
    condicion_iva        text,
    preventista          text,
    zona                 text,
    producto_nombre      text,
    cantidad             numeric,
    precio_unitario      numeric,
    descuento_porcentaje numeric,
    subtotal             numeric,
    iva_porcentaje       numeric,
    total_iva_linea      numeric,
    total_linea          numeric,
    subtotal_pedido      numeric,
    total_iva_pedido     numeric,
    total_pedido         numeric
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
        comprobante_nro, fecha, numero_pedido,
        razon_social, nombre_fantasia, cuit, condicion_iva::text,
        preventista, zona,
        producto_nombre, cantidad, precio_unitario, descuento_porcentaje,
        subtotal, iva_porcentaje, total_iva_linea, total_linea,
        subtotal_pedido, total_iva_pedido, total_pedido
    FROM vista_ventas_exportacion
    WHERE empresa_id = p_empresa_id
      AND fecha BETWEEN p_desde AND p_hasta
    ORDER BY comprobante_nro, producto_nombre;
$$;

-- ============================================================================
-- SEED MÍNIMO
-- ============================================================================
INSERT INTO unidades_medida (codigo, nombre) VALUES
    ('UN','Unidad'), ('CJ','Caja'), ('BL','Bulto'), ('PK','Pack'), ('KG','Kilogramo'), ('LT','Litro');
