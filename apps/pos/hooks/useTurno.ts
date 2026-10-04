'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTurnoStore, Turno } from '@/stores/turnoStore'
import { useSupabase } from '@/hooks/useSupabase'

export function useTurno() {
  const supabase = useSupabase()
  const { turnoActivo, setTurnoActivo, loading, setLoading, limpiarTurno } = useTurnoStore()

  // Cargar el turno activo del usuario logueado
  const cargarTurnoActivo = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        limpiarTurno()
        return
      }

      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('estado', 'abierto')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error cargando turno:', error)
        limpiarTurno()
        return
      }

      if (data) {
        setTurnoActivo(data as Turno)
      } else {
        limpiarTurno()
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, setTurnoActivo, setLoading, limpiarTurno])

  // Cargar al montar
  useEffect(() => {
    cargarTurnoActivo()
  }, [cargarTurnoActivo])

  // Abrir caja (crear turno)
  async function abrirCaja(montoInicial: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay sesión activa')

    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!usuarioData) throw new Error('Usuario no encontrado')

    const { data, error } = await supabase
      .from('turnos')
      .insert({
        tenant_id: usuarioData.tenant_id,
        usuario_id: user.id,
        monto_inicial: montoInicial,
        estado: 'abierto',
      })
      .select()
      .single()

    if (error) throw error
    setTurnoActivo(data as Turno)
    return data as Turno
  }

  // Cerrar caja (actualizar turno)
  async function cerrarCaja(params: {
    montoEfectivo: number
    montoTarjeta: number
    montoTransferencia: number
    montoDeclarado: number
    observaciones?: string
  }) {
    if (!turnoActivo) throw new Error('No hay turno abierto')

    // Calcular el total de ventas del turno
    const { data: ventasTurno } = await supabase
      .from('ventas')
      .select('metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia, total')
      .eq('turno_id', turnoActivo.id)
      .eq('estado', 'completada')

        const totales = {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        total: 0,
        cantidadVentas: 0,
      }

      ;(ventasTurno || []).forEach((v: any) => {
        totales.total += Number(v.total)
        totales.cantidadVentas += 1

        if (v.metodo_pago === 'efectivo') totales.efectivo += Number(v.monto_efectivo || v.total)
        else if (v.metodo_pago === 'tarjeta') totales.tarjeta += Number(v.monto_tarjeta || v.total)
        else if (v.metodo_pago === 'transferencia') totales.transferencia += Number(v.monto_transferencia || v.total)
        else if (v.metodo_pago === 'mixto') {
          totales.efectivo += Number(v.monto_efectivo || 0)
          totales.tarjeta += Number(v.monto_tarjeta || 0)
          totales.transferencia += Number(v.monto_transferencia || 0)
        }
      })

    // Efectivo esperado = monto inicial + ventas en efectivo
    const efectivoEsperado = turnoActivo.monto_inicial + totales.efectivo
    const diferencia = params.montoDeclarado - efectivoEsperado

    const { data, error } = await supabase
      .from('turnos')
      .update({
        fecha_cierre: new Date().toISOString(),
        monto_final_efectivo: params.montoDeclarado,
        monto_final_tarjeta: totales.tarjeta,
        monto_final_transferencia: totales.transferencia,
        diferencia: diferencia,
        estado: 'cerrado',
        observaciones: params.observaciones || null,
      })
      .eq('id', turnoActivo.id)
      .select()
      .single()

    if (error) throw error
    limpiarTurno()
    return { turno: data as Turno, totales, efectivoEsperado, diferencia }
  }

    // Listar turnos cerrados (historial)
    const listarTurnosCerrados = useCallback(
      async (limite: number = 20) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            // Silencioso: no loguear, no es un error, simplemente no hay sesión
            return []
          }

          const { data: usuarioData, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

          if (errorUsuario || !usuarioData) {
            return []
          }

          const { data, error } = await supabase
            .from('turnos')
            .select('*')
            .eq('tenant_id', usuarioData.tenant_id)
            .eq('estado', 'cerrado')
            .order('fecha_cierre', { ascending: false })
            .limit(limite)

          if (error) {
            // Silencioso si es un error de sesión
            return []
          }

          return (data || []) as Turno[]
        } catch {
          return []
        }
      },
      [supabase]
    )

  // Obtener estadísticas del turno activo
  async function obtenerEstadisticasTurno() {
    if (!turnoActivo) return null

    const { data: ventasTurno } = await supabase
      .from('ventas')
      .select('metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia, total')
      .eq('turno_id', turnoActivo.id)
      .eq('estado', 'completada')

    const totales = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      total: 0,
      cantidadVentas: 0,
    }

    ;(ventasTurno || []).forEach((v: any) => {
      totales.total += Number(v.total)
      totales.cantidadVentas += 1
      if (v.metodo_pago === 'efectivo') totales.efectivo += Number(v.monto_efectivo || v.total)
      else if (v.metodo_pago === 'tarjeta') totales.tarjeta += Number(v.monto_tarjeta || v.total)
      else if (v.metodo_pago === 'transferencia') totales.transferencia += Number(v.monto_transferencia || v.total)
      else if (v.metodo_pago === 'mixto') {
        totales.efectivo += Number(v.monto_efectivo || 0)
        totales.tarjeta += Number(v.monto_tarjeta || 0)
        totales.transferencia += Number(v.monto_transferencia || 0)
      }
    })

    return {
      ...totales,
      efectivoEsperado: turnoActivo.monto_inicial + totales.efectivo,
    }
  }

  return {
    turnoActivo,
    loading,
    abrirCaja,
    cerrarCaja,
    obtenerEstadisticasTurno,
    listarTurnosCerrados,
    recargar: cargarTurnoActivo,
  }
}