-- ============================================================================
-- SCRIPT: Datos de prueba iniciales para una distribuidora
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Reemplaza '??' con tu empresa_id y preventista_id reales
-- 2. Ejecuta este script en Supabase SQL Editor
-- ============================================================================

-- VARIABLES: Reemplaza estos valores
-- \set empresa_id 'tu-empresa-uuid'
-- \set preventista_id 'tu-preventista-uuid'

-- Para obtener tus IDs:
-- - empresa_id: desde la tabla empresas o desde useAuthStore()
-- - preventista_id: desde la tabla perfiles (tu usuario)

-- ============================================================================
-- 1. CREAR ZONAS (si no existen)
-- ============================================================================

INSERT INTO zonas (empresa_id, nombre, descripcion, dia_visita, activo)
VALUES
  ('??', 'Centro', 'Zona céntrica de la ciudad', 'lunes', true),
  ('??', 'Norte', 'Barrios al norte', 'martes', true),
  ('??', 'Sur', 'Barrios al sur', 'miercoles', true),
  ('??', 'Este', 'Zona este y alrededores', 'jueves', true),
  ('??', 'Oeste', 'Zona oeste', 'viernes', true),
  ('??', 'Zona Industrial', 'Parque industrial', 'sabado', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. CREAR CATEGORÍAS (si no existen)
-- ============================================================================

INSERT INTO categorias (empresa_id, nombre, descripcion, activo)
VALUES
  ('??', 'Bebidas', 'Bebidas en general', true),
  ('??', 'Lácteos', 'Leche y derivados', true),
  ('??', 'Almacén', 'Productos de almacén', true),
  ('??', 'Congelados', 'Productos congelados', true),
  ('??', 'Frescos', 'Productos frescos', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. CREAR PRODUCTOS (de prueba)
-- ============================================================================

-- Primero obtén el id de unidad_medida 'UN' (unidad)
-- SELECT id FROM unidades_medida WHERE codigo = 'UN';

-- Luego inserta productos (reemplaza el id de unidad_medida si es diferente)
INSERT INTO productos (
  empresa_id, codigo_interno, codigo_barras, nombre, categoria_id,
  unidad_medida_id, unidades_por_bulto, stock_actual, stock_minimo,
  costo, iva_porcentaje, activo
)
SELECT
  '??', 'COCA-001', '7790090000129', 'Coca Cola 2L',
  (SELECT id FROM categorias WHERE empresa_id = '??' AND nombre = 'Bebidas' LIMIT 1),
  (SELECT id FROM unidades_medida WHERE codigo = 'UN'),
  6, 100, 20, 150.00, 21, true
UNION ALL
SELECT
  '??', 'SPRITE-001', '7790090000136', 'Sprite 2L',
  (SELECT id FROM categorias WHERE empresa_id = '??' AND nombre = 'Bebidas' LIMIT 1),
  (SELECT id FROM unidades_medida WHERE codigo = 'UN'),
  6, 80, 20, 140.00, 21, true
UNION ALL
SELECT
  '??', 'LECHE-001', '7790000000000', 'Leche La Serenísima 1L',
  (SELECT id FROM categorias WHERE empresa_id = '??' AND nombre = 'Lácteos' LIMIT 1),
  (SELECT id FROM unidades_medida WHERE codigo = 'UN'),
  12, 200, 50, 120.00, 21, true
UNION ALL
SELECT
  '??', 'YOGURT-001', '7790000000017', 'Yogurt Sancor 1L',
  (SELECT id FROM categorias WHERE empresa_id = '??' AND nombre = 'Lácteos' LIMIT 1),
  (SELECT id FROM unidades_medida WHERE codigo = 'UN'),
  6, 150, 40, 110.00, 21, true
UNION ALL
SELECT
  '??', 'AZUCAR-001', '7790000000024', 'Azúcar Ledesma 1kg',
  (SELECT id FROM categorias WHERE empresa_id = '??' AND nombre = 'Almacén' LIMIT 1),
  (SELECT id FROM unidades_medida WHERE codigo = 'UN'),
  20, 300, 100, 85.00, 21, true
UNION ALL
SELECT
  '??', 'HARINA-001', '7790000000031', 'Harina 000 1kg',
  (SELECT id FROM categorias WHERE empresa_id = '??' AND nombre = 'Almacén' LIMIT 1),
  (SELECT id FROM unidades_medida WHERE codigo = 'UN'),
  20, 250, 80, 90.00, 21, true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. CREAR CLIENTES (de prueba)
-- ============================================================================
-- Asigna los clientes a las zonas y preventistas

INSERT INTO clientes (
  empresa_id, codigo, razon_social, nombre_fantasia, cuit,
  condicion_iva, zona_id, dia_visita, preventista_id,
  direccion, localidad, provincia, email, telefono,
  limite_credito, saldo_cuenta_corriente, activo
)
SELECT
  '??', 'CLI-001', 'Supermercado El Centro', 'El Centro', '20123456789',
  'responsable_inscripto',
  (SELECT id FROM zonas WHERE empresa_id = '??' AND nombre = 'Centro' LIMIT 1),
  'lunes', '??',
  'Calle 1 123', 'CABA', 'Buenos Aires', 'centro@email.com', '1123456789',
  50000, 0, true
UNION ALL
SELECT
  '??', 'CLI-002', 'Almacén La Zona', 'La Zona', '20234567890',
  'monotributo',
  (SELECT id FROM zonas WHERE empresa_id = '??' AND nombre = 'Centro' LIMIT 1),
  'lunes', '??',
  'Calle 2 456', 'CABA', 'Buenos Aires', 'lazona@email.com', '1123456790',
  30000, 0, true
UNION ALL
SELECT
  '??', 'CLI-003', 'Kiosco Del Barrio', 'Del Barrio', '27123456789',
  'monotributo',
  (SELECT id FROM zonas WHERE empresa_id = '??' AND nombre = 'Norte' LIMIT 1),
  'martes', '??',
  'Av. de Mayo 789', 'CABA', 'Buenos Aires', 'delbarrio@email.com', '1123456791',
  15000, 0, true
UNION ALL
SELECT
  '??', 'CLI-004', 'Verdulería Don Pedro', 'Don Pedro', '23456789012',
  'responsable_inscripto',
  (SELECT id FROM zonas WHERE empresa_id = '??' AND nombre = 'Sur' LIMIT 1),
  'miercoles', '??',
  'Calle 3 111', 'CABA', 'Buenos Aires', 'donpedro@email.com', '1123456792',
  20000, 0, true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ASIGNAR ZONAS AL PREVENTISTA (si lo deseas)
-- ============================================================================

UPDATE perfiles
SET zonas_asignadas = ARRAY[
  (SELECT id FROM zonas WHERE empresa_id = '??' AND nombre = 'Centro' LIMIT 1),
  (SELECT id FROM zonas WHERE empresa_id = '??' AND nombre = 'Norte' LIMIT 1),
  (SELECT id FROM zonas WHERE empresa_id = '??' AND nombre = 'Sur' LIMIT 1)
]
WHERE id = '??' AND rol = 'preventista';

-- ============================================================================
-- LISTO!
-- ============================================================================
-- Después de ejecutar:
-- 1. Refresh en la app
-- 2. Preventista debe ver en /ruta los clientes de sus zonas para su día
-- 3. Admin puede ir a /admin/productos, /admin/zonas, etc para ver los datos
