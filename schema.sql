-- ============================================================================
-- ZONIFY - Schema inicial
-- Distribuidora de consumo masivo - Single tenant
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
create type rol_usuario as enum ('admin', 'preventista', 'supervisor', 'deposito');
create type estado_pedido as enum ('borrador', 'pendiente', 'confirmado', 'facturado', 'entregado', 'cancelado');
create type tipo_movimiento_stock as enum ('ingreso', 'egreso', 'ajuste', 'devolucion', 'transferencia');
create type dia_semana as enum ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado');
create type condicion_iva as enum ('responsable_inscripto', 'monotributo', 'exento', 'consumidor_final', 'no_responsable');

-- ============================================================================
-- PERFILES (extiende auth.users de Supabase)
-- ============================================================================
create table perfiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nombre_completo text not null,
    email text unique not null,
    telefono text,
    rol rol_usuario not null default 'preventista',
    activo boolean not null default true,
    zonas_asignadas uuid[] default '{}', -- FK lógica a zonas (un preventista puede tener varias)
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_perfiles_rol on perfiles(rol) where activo = true;

-- ============================================================================
-- ZONAS (áreas geográficas de venta)
-- ============================================================================
create table zonas (
    id uuid primary key default uuid_generate_v4(),
    nombre text not null unique,
    descripcion text,
    dia_visita dia_semana not null, -- día principal de visita
    activo boolean not null default true,
    created_at timestamptz not null default now()
);

-- ============================================================================
-- CATEGORÍAS DE PRODUCTOS
-- ============================================================================
create table categorias (
    id uuid primary key default uuid_generate_v4(),
    nombre text not null unique,
    descripcion text,
    activo boolean not null default true,
    created_at timestamptz not null default now()
);

-- ============================================================================
-- UNIDADES DE MEDIDA
-- Clave para distribuidoras: un producto se vende por unidad, caja, bulto, pack...
-- ============================================================================
create table unidades_medida (
    id uuid primary key default uuid_generate_v4(),
    codigo text not null unique, -- 'UN', 'CJ', 'BL', 'PK', 'KG'
    nombre text not null,        -- 'Unidad', 'Caja', 'Bulto'
    activo boolean not null default true
);

-- ============================================================================
-- DEPÓSITOS (un solo depósito al inicio, pero queda escalable)
-- ============================================================================
create table depositos (
    id uuid primary key default uuid_generate_v4(),
    nombre text not null unique,
    direccion text,
    es_principal boolean not null default false,
    activo boolean not null default true,
    created_at timestamptz not null default now()
);

-- ============================================================================
-- PRODUCTOS
-- ============================================================================
create table productos (
    id uuid primary key default uuid_generate_v4(),
    codigo_interno text not null unique,      -- SKU interno
    codigo_barras text unique,                -- EAN / código de barras
    nombre text not null,
    descripcion text,
    categoria_id uuid references categorias(id) on delete restrict,
    unidad_medida_id uuid not null references unidades_medida(id) on delete restrict,
    unidades_por_bulto integer not null default 1, -- cuántas unidades trae un bulto
    stock_actual numeric(12,2) not null default 0,
    stock_minimo numeric(12,2) not null default 0, -- umbral de alerta (stock crítico)
    stock_reservado numeric(12,2) not null default 0, -- reservado por pedidos confirmados no facturados
    costo numeric(12,2) not null default 0,   -- costo de reposición (p/cálculo de margen)
    iva_porcentaje numeric(5,2) not null default 21.00,
    peso_kg numeric(10,3),
    activo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_productos_codigo_barras on productos(codigo_barras) where activo = true;
create index idx_productos_categoria on productos(categoria_id);
create index idx_productos_stock_critico on productos(id) where stock_actual <= stock_minimo and activo = true;

-- Stock disponible real = stock_actual - stock_reservado
create or replace function stock_disponible(p_producto_id uuid)
returns numeric as $$
    select coalesce(stock_actual - stock_reservado, 0)
    from productos where id = p_producto_id;
$$ language sql stable;

-- ============================================================================
-- LISTAS DE PRECIOS
-- ============================================================================
create table listas_precios (
    id uuid primary key default uuid_generate_v4(),
    nombre text not null unique, -- 'Mayorista', 'Minorista', 'Súper', 'Kiosco'
    descripcion text,
    activo boolean not null default true,
    es_default boolean not null default false, -- la lista por defecto para clientes nuevos
    created_at timestamptz not null default now()
);

-- Solo una lista puede ser default
create unique index idx_lista_default_unica on listas_precios(es_default) where es_default = true;

create table lista_precios_items (
    id uuid primary key default uuid_generate_v4(),
    lista_id uuid not null references listas_precios(id) on delete cascade,
    producto_id uuid not null references productos(id) on delete cascade,
    precio numeric(12,2) not null check (precio >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(lista_id, producto_id)
);

create index idx_lista_items_producto on lista_precios_items(producto_id);

-- ============================================================================
-- CLIENTES
-- ============================================================================
create table clientes (
    id uuid primary key default uuid_generate_v4(),
    codigo text unique, -- código interno del cliente (opcional, útil para migrar data vieja)
    razon_social text not null,
    nombre_fantasia text,
    cuit text unique, -- validación en aplicación; puede venir null si es consumidor final
    condicion_iva condicion_iva not null default 'consumidor_final',
    direccion text,
    localidad text,
    provincia text,
    telefono text,
    email text,
    zona_id uuid references zonas(id) on delete set null,
    dia_visita dia_semana, -- puede diferir del día de la zona (excepción)
    lista_precios_id uuid references listas_precios(id) on delete set null,
    preventista_id uuid references perfiles(id) on delete set null,
    limite_credito numeric(12,2) default 0,
    saldo_cuenta_corriente numeric(12,2) not null default 0,
    observaciones text,
    latitud numeric(10,7),   -- para ruteo futuro
    longitud numeric(10,7),
    activo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_clientes_zona on clientes(zona_id) where activo = true;
create index idx_clientes_preventista on clientes(preventista_id) where activo = true;
create index idx_clientes_dia on clientes(dia_visita) where activo = true;
create index idx_clientes_cuit on clientes(cuit);

-- ============================================================================
-- PEDIDOS (cabecera)
-- ============================================================================
create sequence pedidos_numero_seq start 1000;

create table pedidos (
    id uuid primary key default uuid_generate_v4(),
    numero_pedido bigint not null unique default nextval('pedidos_numero_seq'), -- identificador humano
    cliente_id uuid not null references clientes(id) on delete restrict,
    preventista_id uuid not null references perfiles(id) on delete restrict,
    deposito_id uuid references depositos(id) on delete set null,
    lista_precios_id uuid not null references listas_precios(id) on delete restrict,
    estado estado_pedido not null default 'pendiente',
    fecha_pedido timestamptz not null default now(),
    fecha_entrega_estimada date,
    fecha_confirmacion timestamptz,
    fecha_facturacion timestamptz,

    -- Totales (se recalculan por trigger, nunca confiar en frontend)
    subtotal numeric(12,2) not null default 0,
    total_iva numeric(12,2) not null default 0,
    total numeric(12,2) not null default 0,

    observaciones text,

    -- Campos de sincronización offline
    uuid_offline uuid unique, -- ID generado en el dispositivo antes de sincronizar
    sincronizado_en timestamptz,
    dispositivo_origen text,  -- identificador del dispositivo (para debugging)

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_pedidos_cliente on pedidos(cliente_id);
create index idx_pedidos_preventista on pedidos(preventista_id);
create index idx_pedidos_estado on pedidos(estado);
create index idx_pedidos_fecha on pedidos(fecha_pedido desc);

-- ============================================================================
-- PEDIDO DETALLES (renglones)
-- Precios CONGELADOS al momento de la venta
-- ============================================================================
create table pedido_detalles (
    id uuid primary key default uuid_generate_v4(),
    pedido_id uuid not null references pedidos(id) on delete cascade,
    producto_id uuid not null references productos(id) on delete restrict,
    cantidad numeric(12,2) not null check (cantidad > 0),
    precio_unitario numeric(12,2) not null check (precio_unitario >= 0), -- congelado
    descuento_porcentaje numeric(5,2) not null default 0 check (descuento_porcentaje between 0 and 100),
    iva_porcentaje numeric(5,2) not null default 21.00,
    subtotal numeric(12,2) not null, -- cantidad * precio_unitario * (1 - desc/100)
    total_linea numeric(12,2) not null, -- subtotal + iva
    observaciones text,
    created_at timestamptz not null default now()
);

create index idx_pedido_detalles_pedido on pedido_detalles(pedido_id);
create index idx_pedido_detalles_producto on pedido_detalles(producto_id);

-- ============================================================================
-- KARDEX / MOVIMIENTOS DE STOCK (auditoría absoluta)
-- ============================================================================
create table stock_movimientos (
    id uuid primary key default uuid_generate_v4(),
    producto_id uuid not null references productos(id) on delete restrict,
    deposito_id uuid references depositos(id) on delete set null,
    tipo tipo_movimiento_stock not null,
    cantidad numeric(12,2) not null, -- positivo ingreso, negativo egreso
    stock_previo numeric(12,2) not null,
    stock_posterior numeric(12,2) not null,
    pedido_id uuid references pedidos(id) on delete set null, -- si proviene de un pedido
    usuario_id uuid references perfiles(id) on delete set null,
    motivo text,
    created_at timestamptz not null default now()
);

create index idx_stock_mov_producto on stock_movimientos(producto_id, created_at desc);
create index idx_stock_mov_pedido on stock_movimientos(pedido_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: auto-updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_perfiles_updated before update on perfiles for each row execute function set_updated_at();
create trigger trg_productos_updated before update on productos for each row execute function set_updated_at();
create trigger trg_clientes_updated before update on clientes for each row execute function set_updated_at();
create trigger trg_pedidos_updated before update on pedidos for each row execute function set_updated_at();
create trigger trg_lista_items_updated before update on lista_precios_items for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Trigger: calcular subtotal/total de cada renglón automáticamente
-- ----------------------------------------------------------------------------
create or replace function calcular_totales_detalle()
returns trigger as $$
begin
    new.subtotal := round(new.cantidad * new.precio_unitario * (1 - new.descuento_porcentaje / 100), 2);
    new.total_linea := round(new.subtotal * (1 + new.iva_porcentaje / 100), 2);
    return new;
end;
$$ language plpgsql;

create trigger trg_calcular_totales_detalle
    before insert or update on pedido_detalles
    for each row execute function calcular_totales_detalle();

-- ----------------------------------------------------------------------------
-- Trigger: recalcular totales del pedido cuando cambian los detalles
-- ----------------------------------------------------------------------------
create or replace function recalcular_total_pedido()
returns trigger as $$
declare
    v_pedido_id uuid;
begin
    v_pedido_id := coalesce(new.pedido_id, old.pedido_id);

    update pedidos p
    set subtotal = coalesce((select sum(subtotal) from pedido_detalles where pedido_id = v_pedido_id), 0),
        total_iva = coalesce((select sum(total_linea - subtotal) from pedido_detalles where pedido_id = v_pedido_id), 0),
        total = coalesce((select sum(total_linea) from pedido_detalles where pedido_id = v_pedido_id), 0)
    where p.id = v_pedido_id;

    return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trg_recalcular_pedido
    after insert or update or delete on pedido_detalles
    for each row execute function recalcular_total_pedido();

-- ----------------------------------------------------------------------------
-- Trigger CLAVE: gestión de stock basada en CAMBIOS DE ESTADO del pedido
-- NO descontamos al insertar detalles. Descontamos cuando el pedido
-- cambia a 'confirmado' (reserva) y a 'facturado' (salida real).
-- ----------------------------------------------------------------------------
create or replace function gestionar_stock_por_estado()
returns trigger as $$
declare
    r record;
    v_stock_actual numeric(12,2);
begin
    -- Caso 1: pasa a CONFIRMADO → reservar stock (no descontar aún)
    if (tg_op = 'UPDATE' and old.estado != 'confirmado' and new.estado = 'confirmado') then
        for r in select producto_id, cantidad from pedido_detalles where pedido_id = new.id loop
            -- Verificar stock disponible
            select stock_actual - stock_reservado into v_stock_actual from productos where id = r.producto_id for update;
            if v_stock_actual < r.cantidad then
                raise exception 'Stock insuficiente para el producto % (disponible: %, solicitado: %)',
                    r.producto_id, v_stock_actual, r.cantidad;
            end if;

            update productos set stock_reservado = stock_reservado + r.cantidad where id = r.producto_id;
        end loop;

    -- Caso 2: pasa a FACTURADO → egreso real de stock + libera reserva
    elsif (tg_op = 'UPDATE' and old.estado != 'facturado' and new.estado = 'facturado') then
        for r in select producto_id, cantidad from pedido_detalles where pedido_id = new.id loop
            select stock_actual into v_stock_actual from productos where id = r.producto_id for update;

            update productos
            set stock_actual = stock_actual - r.cantidad,
                stock_reservado = greatest(stock_reservado - r.cantidad, 0)
            where id = r.producto_id;

            -- Registrar movimiento en kardex
            insert into stock_movimientos (producto_id, deposito_id, tipo, cantidad, stock_previo, stock_posterior, pedido_id, usuario_id, motivo)
            values (r.producto_id, new.deposito_id, 'egreso', -r.cantidad, v_stock_actual, v_stock_actual - r.cantidad,
                    new.id, new.preventista_id, 'Facturación pedido #' || new.numero_pedido);
        end loop;

        new.fecha_facturacion := now();

    -- Caso 3: pasa a CANCELADO → liberar stock reservado
    elsif (tg_op = 'UPDATE' and old.estado = 'confirmado' and new.estado = 'cancelado') then
        for r in select producto_id, cantidad from pedido_detalles where pedido_id = new.id loop
            update productos
            set stock_reservado = greatest(stock_reservado - r.cantidad, 0)
            where id = r.producto_id;
        end loop;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger trg_gestionar_stock
    before update on pedidos
    for each row execute function gestionar_stock_por_estado();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table perfiles enable row level security;
alter table clientes enable row level security;
alter table pedidos enable row level security;
alter table pedido_detalles enable row level security;
alter table productos enable row level security;
alter table listas_precios enable row level security;
alter table lista_precios_items enable row level security;
alter table stock_movimientos enable row level security;

-- Helper: obtener rol del usuario actual
create or replace function auth_rol() returns rol_usuario as $$
    select rol from perfiles where id = auth.uid();
$$ language sql stable security definer;

-- Perfiles: cada uno ve el suyo; admin ve todos
create policy "perfiles_select" on perfiles for select using (id = auth.uid() or auth_rol() in ('admin','supervisor'));
create policy "perfiles_update_propio" on perfiles for update using (id = auth.uid());
create policy "perfiles_admin_all" on perfiles for all using (auth_rol() = 'admin');

-- Productos: todos los usuarios autenticados pueden leer; solo admin/deposito modifican
create policy "productos_select" on productos for select using (auth.uid() is not null);
create policy "productos_write" on productos for all using (auth_rol() in ('admin','deposito'));

-- Listas de precios: lectura general, escritura admin
create policy "listas_select" on listas_precios for select using (auth.uid() is not null);
create policy "listas_items_select" on lista_precios_items for select using (auth.uid() is not null);
create policy "listas_write" on listas_precios for all using (auth_rol() = 'admin');
create policy "listas_items_write" on lista_precios_items for all using (auth_rol() = 'admin');

-- Clientes: preventista ve solo los suyos
create policy "clientes_select" on clientes for select
    using (auth_rol() in ('admin','supervisor') or preventista_id = auth.uid());
create policy "clientes_write" on clientes for all
    using (auth_rol() in ('admin','supervisor') or preventista_id = auth.uid());

-- Pedidos: preventista ve solo los suyos
create policy "pedidos_select" on pedidos for select
    using (auth_rol() in ('admin','supervisor') or preventista_id = auth.uid());
create policy "pedidos_insert" on pedidos for insert
    with check (preventista_id = auth.uid() or auth_rol() in ('admin','supervisor'));
create policy "pedidos_update" on pedidos for update
    using (auth_rol() in ('admin','supervisor') or (preventista_id = auth.uid() and estado in ('borrador','pendiente')));

create policy "pedido_detalles_select" on pedido_detalles for select
    using (exists (select 1 from pedidos p where p.id = pedido_id
        and (auth_rol() in ('admin','supervisor') or p.preventista_id = auth.uid())));
create policy "pedido_detalles_write" on pedido_detalles for all
    using (exists (select 1 from pedidos p where p.id = pedido_id
        and (auth_rol() in ('admin','supervisor') or (p.preventista_id = auth.uid() and p.estado in ('borrador','pendiente')))));

-- Stock movimientos: solo lectura para admin/supervisor/deposito
create policy "stock_mov_select" on stock_movimientos for select using (auth_rol() in ('admin','supervisor','deposito'));

-- ============================================================================
-- SEED MÍNIMO (datos que sí o sí van)
-- ============================================================================
insert into unidades_medida (codigo, nombre) values
    ('UN', 'Unidad'), ('CJ', 'Caja'), ('BL', 'Bulto'), ('PK', 'Pack'), ('KG', 'Kilogramo'), ('LT', 'Litro');

insert into depositos (nombre, es_principal) values ('Depósito Central', true);