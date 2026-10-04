'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'

export interface EstadoSuscripcion {
  activo: boolean
  estado: 'trial' | 'activo' | 'gracia' | 'suspendido' | 'trial_vencido' | 'vencido' | 'cancelado' | 'no_encontrado' | 'desconocido'
  mensaje: string
  dias_restantes?: number
  dias_gracia_restantes?: number
  trial_ends_at?: string
  current_period_ends_at?: string
}

interface UseSuscripcionReturn {
  suscripcion: EstadoSuscripcion | null
  loading: boolean
  error: string | null
  recargar: () => Promise<void>
}

export function useSuscripcion(): UseSuscripcionReturn {
  const supabase = useSupabase()
  const [suscripcion, setSuscripcion] = useState<EstadoSuscripcion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No hay sesión activa')
        setSuscripcion(null)
        return
      }

      // 2. Obtener el tenant_id del usuario
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (errorUsuario || !usuario) {
        setError('Usuario no encontrado')
        setSuscripcion(null)
        return
      }

      // 3. Llamar a la función verificar_suscripcion
      const { data, error: errorFn } = await supabase
        .rpc('verificar_suscripcion', { p_tenant_id: usuario.tenant_id })

      if (errorFn) {
        setError(errorFn.message)
        setSuscripcion(null)
        return
      }

      setSuscripcion(data as EstadoSuscripcion)
    } catch (err: any) {
      setError(err.message)
      setSuscripcion(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    suscripcion,
    loading,
    error,
    recargar: cargar,
  }
}