-- ============================================================
-- VISTAS PARA REPORTES
-- ============================================================

-- ============================================
-- 1. VENTAS POR DÍA
-- ============================================
CREATE OR REPLACE VIEW v_ventas_por_dia AS
SELECT
  tenant_id,
  DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS fecha,
  COUNT(*) AS cantidad_ventas,
  SUM(total) AS total_vendido,
  AVG(total) AS ticket_promedio,
  SUM(CASE WHEN metodo_pago = 'efectivo' OR metodo_pago = 'mixto' THEN monto_efectivo ELSE 0 END) AS total_efectivo,
  SUM(CASE WHEN metodo_pago = 'tarjeta' OR metodo_pago = 'mixto' THEN monto_tarjeta ELSE 0 END) AS total_tarjeta,
  SUM(CASE WHEN metodo_pago = 'transferencia' OR metodo_pago = 'mixto' THEN monto_transferencia ELSE 0 END) AS total_transferencia
FROM ventas
WHERE estado = 'completada'
GROUP BY tenant_id, DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')
ORDER BY fecha DESC;

-- ============================================
-- 2. VENTAS POR HORA
-- ============================================
CREATE OR REPLACE VIEW v_ventas_por_hora AS
SELECT
  tenant_id,
  DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS fecha,
  EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::INTEGER AS hora,
  COUNT(*) AS cantidad_ventas,
  SUM(total) AS total_vendido
FROM ventas
WHERE estado = 'completada'
GROUP BY tenant_id, DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires'),
         EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')
ORDER BY fecha DESC, hora ASC;

-- ============================================
-- 3. PRODUCTOS MÁS VENDIDOS
-- ============================================
CREATE OR REPLACE VIEW v_productos_mas_vendidos AS
SELECT
  dv.tenant_id,
  dv.producto_id,
  dv.producto_nombre,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  c.color AS categoria_color,
  SUM(dv.peso) AS total_kg,
  SUM(dv.subtotal) AS total_facturado,
  COUNT(*) AS cantidad_ventas,
  AVG(dv.precio_unitario) AS precio_promedio
FROM detalle_ventas dv
JOIN productos p ON p.id = dv.producto_id
LEFT JOIN categorias c ON c.id = p.categoria_id
JOIN ventas v ON v.id = dv.venta_id
WHERE v.estado = 'completada'
GROUP BY dv.tenant_id, dv.producto_id, dv.producto_nombre, p.categoria_id,
         c.nombre, c.color
ORDER BY total_kg DESC;

-- ============================================
-- 4. GANANCIAS POR PRODUCTO
-- ============================================
CREATE OR REPLACE VIEW v_ganancias_por_producto AS
SELECT
  dv.tenant_id,
  dv.producto_id,
  dv.producto_nombre,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  SUM(dv.peso) AS total_kg_vendidos,
  SUM(dv.subtotal) AS total_venta,
  SUM(dv.peso * p.precio_compra_kg) AS total_costo,
  SUM(dv.subtotal) - SUM(dv.peso * p.precio_compra_kg) AS ganancia_neta,
  CASE
    WHEN SUM(dv.subtotal) > 0 THEN
      ((SUM(dv.subtotal) - SUM(dv.peso * p.precio_compra_kg)) / SUM(dv.subtotal)) * 100
    ELSE 0
  END AS margen_porcentaje
FROM detalle_ventas dv
JOIN productos p ON p.id = dv.producto_id
LEFT JOIN categorias c ON c.id = p.categoria_id
JOIN ventas v ON v.id = dv.venta_id
WHERE v.estado = 'completada'
GROUP BY dv.tenant_id, dv.producto_id, dv.producto_nombre, p.categoria_id,
         c.nombre
ORDER BY ganancia_neta DESC;

-- ============================================
-- 5. STOCK BAJO O SIN STOCK
-- ============================================
CREATE OR REPLACE VIEW v_stock_bajo AS
SELECT
  p.tenant_id,
  p.id AS producto_id,
  p.nombre,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  c.color AS categoria_color,
  p.stock_actual,
  p.stock_minimo,
  p.precio_venta_kg,
  p.precio_compra_kg,
  (p.stock_actual * p.precio_compra_kg) AS valor_inventario_costo,
  (p.stock_actual * p.precio_venta_kg) AS valor_inventario_venta,
  CASE
    WHEN p.stock_actual <= 0 THEN 'sin_stock'
    WHEN p.stock_actual <= p.stock_minimo THEN 'bajo'
    ELSE 'normal'
  END AS estado
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
WHERE p.activo = true
ORDER BY
  CASE
    WHEN p.stock_actual <= 0 THEN 1
    WHEN p.stock_actual <= p.stock_minimo THEN 2
    ELSE 3
  END,
  p.nombre;

-- ============================================
-- 6. RESUMEN DEL PERÍODO (para tarjetas)
-- ============================================
CREATE OR REPLACE VIEW v_resumen_periodo AS
SELECT
  tenant_id,
  DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS fecha,
  COUNT(*) AS cantidad_ventas,
  SUM(total) AS total_vendido,
  AVG(total) AS ticket_promedio,
  SUM(CASE WHEN metodo_pago = 'efectivo' OR metodo_pago = 'mixto' THEN monto_efectivo ELSE 0 END) AS total_efectivo,
  SUM(CASE WHEN metodo_pago = 'tarjeta' OR metodo_pago = 'mixto' THEN monto_tarjeta ELSE 0 END) AS total_tarjeta,
  SUM(CASE WHEN metodo_pago = 'transferencia' OR metodo_pago = 'mixto' THEN monto_transferencia ELSE 0 END) AS total_transferencia
FROM ventas
WHERE estado = 'completada'
GROUP BY tenant_id, DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires');

-- ============================================
-- PERMISOS (RLS se hereda de las tablas base)
-- ============================================
GRANT SELECT ON v_ventas_por_dia TO authenticated, anon;
GRANT SELECT ON v_ventas_por_hora TO authenticated, anon;
GRANT SELECT ON v_productos_mas_vendidos TO authenticated, anon;
GRANT SELECT ON v_ganancias_por_producto TO authenticated, anon;
GRANT SELECT ON v_stock_bajo TO authenticated, anon;
GRANT SELECT ON v_resumen_periodo TO authenticated, anon;