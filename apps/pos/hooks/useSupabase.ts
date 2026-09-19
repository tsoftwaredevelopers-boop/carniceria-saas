'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook para obtener una instancia ESTABLE de Supabase en el cliente.
 * 
 * ¿Por qué es necesario?
 * - `createBrowserClient` debe instanciarse UNA SOLA VEZ por componente.
 * - Si se crea en cada render, las consultas pueden fallar por RLS (sin sesión).
 * - `useMemo` garantiza que el cliente se mantenga estable durante todo el ciclo de vida.
 */
export function useSupabase() {
  return useMemo(() => createClient(), [])
}