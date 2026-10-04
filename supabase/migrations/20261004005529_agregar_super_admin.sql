-- ============================================================
-- AGREGAR ROL SUPER_ADMIN
-- ============================================================

-- Modificar el CHECK constraint de la columna rol
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('super_admin', 'admin', 'supervisor', 'cajero'));

-- ============================================================
-- ACTUALIZAR POLÍTICAS RLS
-- ============================================================

-- Permitir que super_admin vea todos los tenants
DROP POLICY IF EXISTS "super_admin_puede_ver_todos_los_tenants" ON tenants;

CREATE POLICY "super_admin_puede_ver_todos_los_tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- Permitir que super_admin actualice cualquier tenant
DROP POLICY IF EXISTS "super_admin_puede_actualizar_tenants" ON tenants;

CREATE POLICY "super_admin_puede_actualizar_tenants" ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- Permitir que super_admin vea todos los usuarios
DROP POLICY IF EXISTS "super_admin_puede_ver_todos_los_usuarios" ON usuarios;

CREATE POLICY "super_admin_puede_ver_todos_los_usuarios" ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- ============================================================
-- CREAR VISTA DE ESTADÍSTICAS DEL SAAS
-- ============================================================

CREATE OR REPLACE VIEW v_admin_tenants AS
SELECT
  t.id,
  t.nombre_comercial,
  t.email_contacto,
  t.telefono,
  t.plan_id,
  t.status,
  t.trial_ends_at,
  t.current_period_ends_at,
  t.created_at,
  -- Cantidad de usuarios por tenant
  (SELECT COUNT(*) FROM usuarios u WHERE u.tenant_id = t.id) AS total_usuarios,
  -- Cantidad de productos por tenant
  (SELECT COUNT(*) FROM productos p WHERE p.tenant_id = t.id AND p.activo = true) AS total_productos,
  -- Cantidad de ventas por tenant
  (SELECT COUNT(*) FROM ventas v WHERE v.tenant_id = t.id AND v.estado = 'completada') AS total_ventas,
  -- Total facturado por tenant
  (SELECT COALESCE(SUM(v.total), 0) FROM ventas v WHERE v.tenant_id = t.id AND v.estado = 'completada') AS total_facturado,
  -- Días hasta vencimiento
  CASE
    WHEN t.status = 'trial' AND t.trial_ends_at IS NOT NULL THEN
      EXTRACT(DAY FROM t.trial_ends_at - NOW())::INTEGER
    WHEN t.current_period_ends_at IS NOT NULL THEN
      EXTRACT(DAY FROM t.current_period_ends_at - NOW())::INTEGER
    ELSE NULL
  END AS dias_hasta_vencimiento
FROM tenants t
ORDER BY t.created_at DESC;

GRANT SELECT ON v_admin_tenants TO authenticated;

-- ============================================================
-- MARCAR AL USUARIO ADMIN EXISTENTE COMO SUPER_ADMIN
-- ============================================================
-- ⚠️ IMPORTANTE: Esto hace que admin@donpepe.com sea el super admin
-- En producción, deberías crear un usuario separado para el SaaS

UPDATE usuarios
SET rol = 'super_admin'
WHERE email = 'admin@donpepe.com';