-- ============================================================
-- ESQUEMA MULTITENANT PARA CARNICERÍA
-- ============================================================

-- ============================================
-- 1. TABLA DE PLANES
-- ============================================
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio_mensual INTEGER NOT NULL, -- en centavos
  max_usuarios INTEGER DEFAULT 2,
  max_productos INTEGER DEFAULT 100,
  max_ventas_mensuales INTEGER DEFAULT 5000,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (id, nombre, precio_mensual, max_usuarios, max_productos, max_ventas_mensuales, features) VALUES
  ('basico', 'Básico', 1990, 2, 100, 3000, '{"reportes": false, "soporte": "email"}'),
  ('pro', 'Profesional', 3990, 5, 500, 10000, '{"reportes": true, "soporte": "email_prioritario"}'),
  ('premium', 'Premium', 7990, 15, 2000, 50000, '{"reportes": true, "soporte": "telefono", "api": true}');

-- ============================================
-- 2. TABLA DE TENANTS (Las carnicerías)
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_comercial TEXT NOT NULL,
  ruc_nit TEXT,
  direccion TEXT,
  telefono TEXT,
  email_contacto TEXT UNIQUE NOT NULL,
  plan_id TEXT REFERENCES plans(id) DEFAULT 'basico',
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  current_period_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_email ON tenants(email_contacto);

-- ============================================
-- 3. TABLA DE USUARIOS (vinculados a auth.users)
-- ============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cajero' CHECK (rol IN ('admin', 'supervisor', 'cajero')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ============================================
-- 4. CATEGORÍAS DE CARNE
-- ============================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categorias_tenant ON categorias(tenant_id);

-- ============================================
-- 5. PRODUCTOS (Cortes de carne)
-- ============================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  codigo_barras TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida TEXT DEFAULT 'kg' CHECK (unidad_medida IN ('kg', 'g', 'unidad', 'libra')),
  precio_compra_kg NUMERIC(10,2) DEFAULT 0,
  precio_venta_kg NUMERIC(10,2) NOT NULL,
  stock_actual NUMERIC(10,3) DEFAULT 0,
  stock_minimo NUMERIC(10,3) DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_productos_tenant ON productos(tenant_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_codigo ON productos(tenant_id, codigo_barras);
CREATE INDEX idx_productos_activo ON productos(tenant_id, activo);

-- ============================================
-- 6. TURNOS / CAJAS
-- ============================================
CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  monto_inicial NUMERIC(12,2) DEFAULT 0,
  monto_final_efectivo NUMERIC(12,2),
  monto_final_tarjeta NUMERIC(12,2),
  monto_final_transferencia NUMERIC(12,2),
  diferencia NUMERIC(12,2),
  estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turnos_tenant ON turnos(tenant_id, estado);
CREATE INDEX idx_turnos_usuario ON turnos(usuario_id);

-- ============================================
-- 7. VENTAS (Cabecera)
-- ============================================
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_venta INTEGER NOT NULL,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  turno_id UUID REFERENCES turnos(id),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(12,2) DEFAULT 0,
  impuesto NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'mixto')),
  monto_efectivo NUMERIC(12,2) DEFAULT 0,
  monto_tarjeta NUMERIC(12,2) DEFAULT 0,
  monto_transferencia NUMERIC(12,2) DEFAULT 0,
  cambio NUMERIC(12,2) DEFAULT 0,
  estado TEXT DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada', 'pendiente')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, numero_venta)
);

CREATE INDEX idx_ventas_tenant_fecha ON ventas(tenant_id, created_at DESC);
CREATE INDEX idx_ventas_turno ON ventas(turno_id);
CREATE INDEX idx_ventas_estado ON ventas(tenant_id, estado);

-- ============================================
-- 8. DETALLE DE VENTA
-- ============================================
CREATE TABLE detalle_ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  producto_nombre TEXT NOT NULL,
  peso NUMERIC(10,3) NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detalle_ventas_tenant ON detalle_ventas(tenant_id);
CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas(producto_id);

-- ============================================
-- 9. MERMAS (Pérdidas de carne)
-- ============================================
CREATE TABLE mermas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  cantidad NUMERIC(10,3) NOT NULL,
  motivo TEXT NOT NULL CHECK (motivo IN ('vencimiento', 'mal_corte', 'decomiso', 'error', 'otro')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mermas_tenant ON mermas(tenant_id, created_at DESC);
CREATE INDEX idx_mermas_producto ON mermas(producto_id);

-- ============================================
-- 10. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mermas ENABLE ROW LEVEL SECURITY;

-- Función helper: obtener el tenant_id del usuario logueado
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas: cada usuario solo ve datos de su tenant
CREATE POLICY "tenant_isolation_usuarios" ON usuarios
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "tenant_isolation_categorias" ON categorias
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "tenant_isolation_productos" ON productos
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "tenant_isolation_ventas" ON ventas
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "tenant_isolation_detalle_ventas" ON detalle_ventas
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "tenant_isolation_turnos" ON turnos
  FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "tenant_isolation_mermas" ON mermas
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- ============================================
-- 11. TRIGGER: Actualizar stock automáticamente al vender
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET stock_actual = stock_actual - NEW.peso,
      updated_at = NOW()
  WHERE id = NEW.producto_id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT ON detalle_ventas
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_venta();

-- ============================================
-- 12. TRIGGER: Actualizar stock automáticamente al registrar merma
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_stock_merma()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET stock_actual = stock_actual - NEW.cantidad,
      updated_at = NOW()
  WHERE id = NEW.producto_id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock_merma
AFTER INSERT ON mermas
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_merma();

-- ============================================
-- 13. FUNCIÓN: Generar número de venta por tenant
-- ============================================
CREATE OR REPLACE FUNCTION generar_numero_venta(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_ultimo INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_venta), 0) + 1 INTO v_ultimo
  FROM ventas WHERE tenant_id = p_tenant_id;
  RETURN v_ultimo;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();