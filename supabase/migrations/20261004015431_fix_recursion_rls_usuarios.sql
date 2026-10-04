-- ============================================================
-- FIX: RECURSIÓN INFINITA EN RLS DE USUARIOS
-- ============================================================

-- 1. Eliminar políticas recursivas de usuarios
DROP POLICY IF EXISTS "tenant_isolation_usuarios" ON usuarios;
DROP POLICY IF EXISTS "super_admin_puede_ver_todos_los_usuarios" ON usuarios;

-- 2. Reemplazar función get_user_tenant_id() con SECURITY DEFINER
-- (NO usamos DROP porque otras políticas dependen de ella)
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM usuarios WHERE id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Crear función is_super_admin() con SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Recrear políticas de usuarios SIN recursión
CREATE POLICY "usuarios_self_select" ON usuarios
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "usuarios_tenant_select" ON usuarios
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "usuarios_super_admin_select" ON usuarios
  FOR SELECT USING (is_super_admin());

CREATE POLICY "usuarios_self_update" ON usuarios
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "usuarios_super_admin_update" ON usuarios
  FOR UPDATE USING (is_super_admin());

-- 5. Asegurar que las políticas de tenants usen las funciones no recursivas
DROP POLICY IF EXISTS "super_admin_puede_ver_todos_los_tenants" ON tenants;
DROP POLICY IF EXISTS "super_admin_puede_actualizar_tenants" ON tenants;

CREATE POLICY "super_admin_puede_ver_todos_los_tenants" ON tenants
  FOR SELECT USING (is_super_admin());

CREATE POLICY "super_admin_puede_actualizar_tenants" ON tenants
  FOR UPDATE USING (is_super_admin());