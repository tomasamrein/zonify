CREATE OR REPLACE FUNCTION exportar_ventas_mes(
  p_empresa_id uuid,
  p_desde date,
  p_hasta date
)
RETURNS TABLE (
  numero_comprobante integer,
  fecha date,
  cliente_razon_social text,
  cliente_cuit text,
  cliente_condicion_iva text,
  producto_codigo text,
  producto_nombre text,
  cantidad numeric,
  precio_unitario numeric,
  descuento_porcentaje numeric,
  subtotal_linea numeric,
  iva_porcentaje numeric,
  iva_linea numeric,
  total_linea numeric
) AS $$
SELECT
  c.numero::integer,
  c.fecha_emision::date,
  cl.razon_social,
  cl.cuit,
  cl.condicion_iva::text,
  p.codigo_interno,
  p.nombre,
  pd.cantidad,
  pd.precio_unitario,
  pd.descuento_porcentaje,
  pd.subtotal,
  pd.iva_porcentaje,
  (pd.total_linea * pd.iva_porcentaje / (100 + pd.iva_porcentaje))::numeric(12,2) as iva_linea,
  pd.total_linea
FROM comprobantes c
JOIN pedidos pe ON pe.id = c.pedido_id
JOIN clientes cl ON cl.id = pe.cliente_id
JOIN pedido_detalles pd ON pd.pedido_id = pe.id
LEFT JOIN productos p ON p.id = pd.producto_id
WHERE c.empresa_id = p_empresa_id
  AND c.estado = 'emitido'
  AND c.fecha_emision::date >= p_desde
  AND c.fecha_emision::date <= p_hasta
ORDER BY c.numero, pd.id
$$ LANGUAGE sql STABLE;
