'use client'

import { useCallback, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'

export interface Merma {
  id: string
  tenant_id: string
  producto_id: string
  usuario_id: string
  cantidad: number
  motivo: 'vencimiento' | 'mal_corte' | 'decomiso' | 'error' | 'otro'
  observaciones: string | null
  created_at: string
  // Relaciones
  productos?: { nombre: string; categoria_id: string | null }
  usuarios?: { nombre: string }
}

export interface NuevaMerma {
  producto_id: string
  cantidad: number
  motivo: Merma['motivo']
  observaciones?: string
}

export function useMermas() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Crear merma
  const crearMerma = useCallback(
    async (merma: NuevaMerma) => {
      setLoading(true)
      setError(null)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No hay sesión activa')

        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('tenant_id')
          .eq('id', user.id)
          .single()

        if (!usuarioData) throw new Error('Usuario no encontrado')

        const { data, error: insertError } = await supabase
          .from('mermas')
          .insert({
            tenant_id: usuarioData.tenant_id,
            usuario_id: user.id,
            producto_id: merma.producto_id,
            cantidad: merma.cantidad,
            motivo: merma.motivo,
            observaciones: merma.observaciones || null,
          })
          .select()
          .single()

        if (insertError) throw insertError

        return data as Merma
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Listar mermas (con filtro de fechas opcional)
  const listarMermas = useCallback(
    async (params?: { desde?: string; hasta?: string }) => {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('mermas')
          .select(`
            id,
            tenant_id,
            producto_id,
            usuario_id,
            cantidad,
            motivo,
            observaciones,
            created_at,
            productos(nombre, categoria_id),
            usuarios(nombre)
          `)
          .order('created_at', { ascending: false })

        if (params?.desde) {
          query = query.gte('created_at', params.desde)
        }
        if (params?.hasta) {
          query = query.lte('created_at', params.hasta)
        }

        const { data, error: selectError } = await query

        if (selectError) throw selectError

        return (data || []) as Merma[]
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Eliminar merma (no debería usarse en producción, pero útil para correcciones)
  const eliminarMerma = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        const { error: deleteError } = await supabase
          .from('mermas')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  return {
    loading,
    error,
    crearMerma,
    listarMermas,
    eliminarMerma,
  }
}