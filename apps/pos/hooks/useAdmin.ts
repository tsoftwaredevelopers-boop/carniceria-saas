'use client'

import { useCallback, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'

export interface AdminTenant {
  id: string
  nombre_comercial: string
  email_contacto: string
  telefono: string | null
  plan_id: string
  status: 'trial' | 'active' | 'suspended' | 'expired' | 'cancelled'
  trial_ends_at: string | null
  current_period_ends_at: string | null
  created_at: string
  total_usuarios: number
  total_productos: number
  total_ventas: number
  total_facturado: number
  dias_hasta_vencimiento: number | null
}

export interface MetricasAdmin {
  totalTenants: number
  tenantsActivos: number
  tenantsEnTrial: number
  tenantsSuspendidos: number
  mrrEstimado: number
}

export function useAdmin() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Listar todos los tenants
  const listarTenants = useCallback(async (): Promise<AdminTenant[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('v_admin_tenants')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err

      return (data || []) as AdminTenant[]
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Cambiar estado de un tenant
  const cambiarEstado = useCallback(
    async (tenantId: string, nuevoEstado: AdminTenant['status']) => {
      setLoading(true)
      setError(null)

      try {
        const { error: err } = await supabase
          .from('tenants')
          .update({ status: nuevoEstado })
          .eq('id', tenantId)

        if (err) throw err
        return true
      } catch (err: any) {
        setError(err.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Cambiar plan de un tenant
  const cambiarPlan = useCallback(
    async (tenantId: string, nuevoPlan: string) => {
      setLoading(true)
      setError(null)

      try {
        const { error: err } = await supabase
          .from('tenants')
          .update({ plan_id: nuevoPlan })
          .eq('id', tenantId)

        if (err) throw err
        return true
      } catch (err: any) {
        setError(err.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Extender trial 30 días
  const extenderTrial = useCallback(
    async (tenantId: string, dias: number = 30) => {
      setLoading(true)
      setError(null)

      try {
        const nuevaFecha = new Date()
        nuevaFecha.setDate(nuevaFecha.getDate() + dias)

        const { error: err } = await supabase
          .from('tenants')
          .update({
            trial_ends_at: nuevaFecha.toISOString(),
            status: 'trial',
          })
          .eq('id', tenantId)

        if (err) throw err
        return true
      } catch (err: any) {
        setError(err.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Calcular métricas
  const calcularMetricas = useCallback((tenants: AdminTenant[]): MetricasAdmin => {
    const PRECIOS: Record<string, number> = {
      basico: 1990,
      pro: 3990,
      premium: 7990,
    }

    return {
      totalTenants: tenants.length,
      tenantsActivos: tenants.filter((t) => t.status === 'active').length,
      tenantsEnTrial: tenants.filter((t) => t.status === 'trial').length,
      tenantsSuspendidos: tenants.filter(
        (t) => t.status === 'suspended' || t.status === 'expired'
      ).length,
      mrrEstimado: tenants
        .filter((t) => t.status === 'active')
        .reduce((sum, t) => sum + (PRECIOS[t.plan_id] || 0), 0),
    }
  }, [])

  return {
    loading,
    error,
    listarTenants,
    cambiarEstado,
    cambiarPlan,
    extenderTrial,
    calcularMetricas,
  }
}