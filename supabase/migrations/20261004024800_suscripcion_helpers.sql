-- ============================================================
-- HELPERS PARA VERIFICACIÓN DE SUSCRIPCIONES
-- ============================================================

-- 1. Función que devuelve el estado de suscripción de un tenant
CREATE OR REPLACE FUNCTION verificar_suscripcion(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tenant RECORD;
  v_estado TEXT;
  v_dias_restantes INTEGER;
  v_mensaje TEXT;
BEGIN
  SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'activo', false,
      'estado', 'no_encontrado',
      'mensaje', 'Carnicería no encontrada'
    );
  END IF;

  -- Suspensiones explícitas
  IF v_tenant.status = 'suspended' THEN
    RETURN jsonb_build_object(
      'activo', false,
      'estado', 'suspendido',
      'mensaje', 'Tu cuenta está suspendida. Contactanos para reactivarla.'
    );
  END IF;

  IF v_tenant.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'activo', false,
      'estado', 'cancelado',
      'mensaje', 'Tu suscripción fue cancelada.'
    );
  END IF;

  -- Trial: verificar si el período de prueba venció
  IF v_tenant.status = 'trial' THEN
    IF v_tenant.trial_ends_at IS NULL OR v_tenant.trial_ends_at > NOW() THEN
      v_dias_restantes := GREATEST(0, EXTRACT(DAY FROM v_tenant.trial_ends_at - NOW())::INTEGER);
      RETURN jsonb_build_object(
        'activo', true,
        'estado', 'trial',
        'dias_restantes', v_dias_restantes,
        'trial_ends_at', v_tenant.trial_ends_at,
        'mensaje', 'Estás en período de prueba'
      );
    ELSE
      -- Trial vencido
      RETURN jsonb_build_object(
        'activo', false,
        'estado', 'trial_vencido',
        'trial_ends_at', v_tenant.trial_ends_at,
        'mensaje', 'Tu período de prueba venció. Elegí un plan para seguir usando el sistema.'
      );
    END IF;
  END IF;

  -- Active: verificar si el período pagado venció
  IF v_tenant.status = 'active' THEN
    IF v_tenant.current_period_ends_at IS NULL OR v_tenant.current_period_ends_at > NOW() THEN
      v_dias_restantes := GREATEST(0, EXTRACT(DAY FROM v_tenant.current_period_ends_at - NOW())::INTEGER);
      RETURN jsonb_build_object(
        'activo', true,
        'estado', 'activo',
        'dias_restantes', v_dias_restantes,
        'current_period_ends_at', v_tenant.current_period_ends_at,
        'mensaje', 'Tu suscripción está activa'
      );
    ELSE
      -- Suscripción vencida: dar 7 días de gracia
      v_dias_restantes := EXTRACT(DAY FROM NOW() - v_tenant.current_period_ends_at)::INTEGER;
      
      IF v_dias_restantes <= 7 THEN
        RETURN jsonb_build_object(
          'activo', true,
          'estado', 'gracia',
          'dias_gracia_restantes', 7 - v_dias_restantes,
          'current_period_ends_at', v_tenant.current_period_ends_at,
          'mensaje', 'Tu suscripción venció pero estás en período de gracia'
        );
      ELSE
        RETURN jsonb_build_object(
          'activo', false,
          'estado', 'vencido',
          'current_period_ends_at', v_tenant.current_period_ends_at,
          'mensaje', 'Tu suscripción venció. Renová para seguir usando el sistema.'
        );
      END IF;
    END IF;
  END IF;

  -- Estado desconocido
  RETURN jsonb_build_object(
    'activo', false,
    'estado', 'desconocido',
    'mensaje', 'Estado de suscripción desconocido'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- FUNCIÓN: Suspender tenants vencidos (para cron job)
-- ============================================================
CREATE OR REPLACE FUNCTION suspender_tenants_vencidos()
RETURNS TABLE(
  tenant_id UUID,
  nombre_comercial TEXT,
  razon TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH vencidos AS (
    -- Trials vencidos hace más de 7 días
    SELECT t.id, t.nombre_comercial, 'trial_vencido'::TEXT AS razon
    FROM tenants t
    WHERE t.status = 'trial'
      AND t.trial_ends_at < NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    -- Activos vencidos hace más de 7 días
    SELECT t.id, t.nombre_comercial, 'suscripcion_vencida'::TEXT AS razon
    FROM tenants t
    WHERE t.status = 'active'
      AND t.current_period_ends_at < NOW() - INTERVAL '7 days'
  )
  UPDATE tenants t
  SET status = 'suspended',
      updated_at = NOW()
  FROM vencidos v
  WHERE t.id = v.id
  RETURNING t.id, t.nombre_comercial, v.razon;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Permisos
-- ============================================================
GRANT EXECUTE ON FUNCTION verificar_suscripcion(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION suspender_tenants_vencidos() TO authenticated;

-- ============================================================
-- Verificación
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Helpers de suscripción creados';
END $$;