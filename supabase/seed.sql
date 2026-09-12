-- ============================================================
-- SEED DATA: Carnicería Demo
-- Este archivo se ejecuta automáticamente con `supabase db reset`
-- ============================================================

-- ============================================
-- 1. CREAR UN USUARIO DEMO EN auth.users
-- ============================================
-- Nota: En producción, los usuarios se crean vía signUp.
-- Aquí lo creamos directo para poder insertar el tenant y usuarios.

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
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@donpepe.com',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- ============================================
-- 2. CREAR EL TENANT DEMO
-- ============================================
INSERT INTO tenants (
  id,
  nombre_comercial,
  ruc_nit,
  direccion,
  telefono,
  email_contacto,
  plan_id,
  status,
  trial_ends_at,
  current_period_ends_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Carnicería Don Pepe',
  '12345678901',
  'Av. Principal #123, Ciudad',
  '+54 11 1234-5678',
  'admin@donpepe.com',
  'pro',
  'active',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days'
);

-- ============================================
-- 3. CREAR EL USUARIO ADMIN (vinculado al auth.user)
-- ============================================
INSERT INTO usuarios (id, tenant_id, nombre, email, rol, activo) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Pepe Rodríguez',
  'admin@donpepe.com',
  'admin',
  true
);

-- ============================================
-- 4. CREAR CATEGORÍAS DE CARNE
-- ============================================
INSERT INTO categorias (id, tenant_id, nombre, descripcion, color) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Res', 'Cortes de carne vacuna', '#DC2626'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Cerdo', 'Cortes de carne de cerdo', '#F59E0B'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'Pollo', 'Cortes de pollo y aves', '#FCD34D'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'Embutidos', 'Chorizos, salchichas, jamones', '#7C3AED'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'Achuras', 'Vísceras y achuras', '#059669');

-- ============================================
-- 5. CREAR PRODUCTOS (Cortes realistas con precios)
-- ============================================
INSERT INTO productos (tenant_id, categoria_id, codigo_barras, nombre, descripcion, unidad_medida, precio_compra_kg, precio_venta_kg, stock_actual, stock_minimo) VALUES
  -- RES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '7790001000011', 'Asado de Tira', 'Corte clásico para parrilla', 'kg', 6500, 9500, 25.500, 5),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '7790001000028', 'Bife de Chorizo', 'Corte premium', 'kg', 8000, 12000, 15.200, 3),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '7790001000035', 'Milanesa de Nalga', 'Corte fino para milanesas', 'kg', 7000, 10500, 18.750, 4),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '7790001000042', 'Carne Picada Especial', 'Picada de primera calidad', 'kg', 5500, 8000, 12.300, 5),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '7790001000059', 'Roast Beef', 'Para horno o sartén', 'kg', 6000, 8800, 8.500, 3),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '7790001000066', 'Matambre', 'Para arrollar o a la parrilla', 'kg', 6800, 10000, 6.200, 2),
  
  -- CERDO
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', '7790002000010', 'Bondiola de Cerdo', 'Para parrilla o horno', 'kg', 5500, 8200, 10.500, 3),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', '7790002000027', 'Costillas de Cerdo', 'Costillar para parrilla', 'kg', 4800, 7200, 12.800, 4),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', '7790002000034', 'Panceta', 'Panceta fresca para horno', 'kg', 4200, 6500, 7.300, 2),
  
  -- POLLO
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', '7790003000019', 'Pollo Entero', 'Pollo fresco sin menudencias', 'kg', 2800, 4200, 20.000, 5),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', '7790003000026', 'Pechuga de Pollo', 'Filet de pechuga', 'kg', 4500, 6800, 14.500, 4),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', '7790003000033', 'Muslo de Pollo', 'Cuarto trasero', 'kg', 2500, 3800, 16.200, 5),
  
  -- EMBUTIDOS
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', '7790004000018', 'Chorizo Parrillero', 'Chorizo criollo artesanal', 'kg', 3800, 5800, 9.400, 3),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', '7790004000025', 'Salchicha Tipo Viena', 'Salchicha de viena', 'kg', 3500, 5200, 11.000, 4),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', '7790004000032', 'Morcilla', 'Morcilla criolla', 'kg', 3200, 4800, 5.500, 2),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', '7790004000049', 'Jamón Cocido', 'Jamón cocido en fetas', 'kg', 5500, 8500, 4.800, 2),
  
  -- ACHURAS
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222205', '7790005000017', 'Mollejas', 'Mollejas para parrilla', 'kg', 7500, 11000, 3.200, 1),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222205', '7790005000024', 'Riñones', 'Riñones frescos', 'kg', 3000, 4500, 2.500, 1),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222205', '7790005000031', 'Hígado', 'Hígado de res', 'kg', 2500, 3800, 4.100, 2);

-- ============================================
-- 6. VERIFICACIÓN
-- ============================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_product_count INTEGER;
  v_categoria_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tenant_count FROM tenants;
  SELECT COUNT(*) INTO v_product_count FROM productos;
  SELECT COUNT(*) INTO v_categoria_count FROM categorias;
  
  RAISE NOTICE '✅ Seed completado:';
  RAISE NOTICE '   - Tenants: %', v_tenant_count;
  RAISE NOTICE '   - Categorías: %', v_categoria_count;
  RAISE NOTICE '   - Productos: %', v_product_count;
END $$;