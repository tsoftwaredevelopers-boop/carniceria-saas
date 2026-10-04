-- ============================================================
-- MIGRACIÓN: Separar super_admin de clientes
-- ============================================================
-- 
-- Este script:
-- 1. Crea un tenant interno para el super_admin del SaaS
-- 2. Crea el usuario super_admin (tsoftwaredevelopers@gmail.com)
-- 3. Convierte admin@donpepe.com a cliente normal
-- 4. Marca el tenant interno como oculto
--
-- ============================================================

-- 1. Agregar columna para ocultar tenants internos
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS es_interno BOOLEAN DEFAULT false;

-- 2. Crear tenant interno para el SaaS
-- (necesitamos un tenant_id válido por las FK)
INSERT INTO tenants (
  id,
  nombre_comercial,
  email_contacto,
  plan_id,
  status,
  es_interno,
  trial_ends_at,
  current_period_ends_at
) VALUES (
  '00000000-0000-0000-0000-000000000999',
  'Carnicería SaaS - Admin',
  'tsoftwaredevelopers@gmail.com',
  'premium',
  'active',
  true,
  NULL,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- 3. Crear usuario en auth.users
-- Nota: Supabase recomienda crear usuarios via API, pero aquí usamos SQL directo para el setup inicial
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000998',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'tsoftwaredevelopers@gmail.com',
  crypt('MiClaveSegura123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 4. Crear usuario en la tabla usuarios
INSERT INTO usuarios (
  id,
  tenant_id,
  nombre,
  email,
  rol,
  activo
) VALUES (
  '00000000-0000-0000-0000-000000000998',
  '00000000-0000-0000-0000-000000000999',
  'Super Admin',
  'tsoftwaredevelopers@gmail.com',
  'super_admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- 5. Convertir admin@donpepe.com a cliente normal
UPDATE usuarios
SET rol = 'admin'
WHERE email = 'admin@donpepe.com';

-- 6. Actualizar la vista admin para excluir tenants internos
DROP VIEW IF EXISTS v_admin_tenants;

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
  (SELECT COUNT(*) FROM usuarios u WHERE u.tenant_id = t.id) AS total_usuarios,
  (SELECT COUNT(*) FROM productos p WHERE p.tenant_id = t.id AND p.activo = true) AS total_productos,
  (SELECT COUNT(*) FROM ventas v WHERE v.tenant_id = t.id AND v.estado = 'completada') AS total_ventas,
  (SELECT COALESCE(SUM(v.total), 0) FROM ventas v WHERE v.tenant_id = t.id AND v.estado = 'completada') AS total_facturado,
  CASE
    WHEN t.status = 'trial' AND t.trial_ends_at IS NOT NULL THEN
      EXTRACT(DAY FROM t.trial_ends_at - NOW())::INTEGER
    WHEN t.current_period_ends_at IS NOT NULL THEN
      EXTRACT(DAY FROM t.current_period_ends_at - NOW())::INTEGER
    ELSE NULL
  END AS dias_hasta_vencimiento
FROM tenants t
WHERE COALESCE(t.es_interno, false) = false
ORDER BY t.created_at DESC;

GRANT SELECT ON v_admin_tenants TO authenticated;

-- 7. Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Migración de roles completada';
  RAISE NOTICE '   Super admin: tsoftwaredevelopers@gmail.com';
  RAISE NOTICE '   Tenant interno: Carnicería SaaS - Admin';
  RAISE NOTICE '   Cliente convertido: admin@donpepe.com → admin';
END $$;