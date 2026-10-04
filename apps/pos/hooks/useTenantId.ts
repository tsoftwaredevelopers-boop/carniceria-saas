'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'

export function useTenantId() {
  const supabase = useSupabase()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (data) {
        setTenantId(data.tenant_id)
      }
      setLoading(false)
    }
    cargar()
  }, [supabase])

  return { tenantId, loading }
}
