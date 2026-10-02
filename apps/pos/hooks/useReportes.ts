'use client'

import { useCallback, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'

// ============================================================
// TIPOS
// ============================================================

export interface VentaPorDia {
  fecha: string
  cantidad_ventas: number
  total_vendido: number
  ticket_promedio: number
  total_efectivo: number
  total_tarjeta: number
  total_transferencia: number
}

export interface VentaPorHora {
  fecha: string
  hora: number
  cantidad_ventas: number
  total_vendido: number
}

export interface ProductoMasVendido {
  producto_id: string
  producto_nombre: string
  categoria_nombre: string | null
  categoria_color: string | null
  total_kg: number
  total_facturado: number
  cantidad_ventas: number
  precio_promedio: number
}

export interface GananciaProducto {
  producto_id: string
  producto_nombre: string
  categoria_nombre: string | null
  total_kg_vendidos: number
  total_venta: number
  total_costo: number
  ganancia_neta: number
  margen_porcentaje: number
}

export interface StockBajo {
  producto_id: string
  nombre: string
  categoria_nombre: string | null
  categoria_color: string | null
  stock_actual: number
  stock_minimo: number
  precio_venta_kg: number
  valor_inventario_costo: number
  valor_inventario_venta: number
  estado: 'normal' | 'bajo' | 'sin_stock'
}

export interface ResumenPeriodo {
  cantidad_ventas: number
  total_vendido: number
  ticket_promedio: number
  total_efectivo: number
  total_tarjeta: number
  total_transferencia: number
}

// ============================================================
// HOOK
// ============================================================

export function useReportes() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ----------------------------------------------------------
  // RESUMEN DEL PERÍODO
  // ----------------------------------------------------------
  const obtenerResumenPeriodo = useCallback(
    async (desde: string, hasta: string): Promise<ResumenPeriodo | null> => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: err } = await supabase
          .from('v_resumen_periodo')
          .select('*')
          .gte('fecha', desde)
          .lte('fecha', hasta)

        if (err) throw err

        if (!data || data.length === 0) {
          return {
            cantidad_ventas: 0,
            total_vendido: 0,
            ticket_promedio: 0,
            total_efectivo: 0,
            total_tarjeta: 0,
            total_transferencia: 0,
          }
        }

        const totales = data.reduce(
          (acc, row: any) => ({
            cantidad_ventas: acc.cantidad_ventas + Number(row.cantidad_ventas),
            total_vendido: acc.total_vendido + Number(row.total_vendido),
            ticket_promedio: 0,
            total_efectivo: acc.total_efectivo + Number(row.total_efectivo),
            total_tarjeta: acc.total_tarjeta + Number(row.total_tarjeta),
            total_transferencia:
              acc.total_transferencia + Number(row.total_transferencia),
          }),
          {
            cantidad_ventas: 0,
            total_vendido: 0,
            ticket_promedio: 0,
            total_efectivo: 0,
            total_tarjeta: 0,
            total_transferencia: 0,
          }
        )

        totales.ticket_promedio =
          totales.cantidad_ventas > 0
            ? totales.total_vendido / totales.cantidad_ventas
            : 0

        return totales
      } catch (err: any) {
        setError(err.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // ----------------------------------------------------------
  // VENTAS POR DÍA
  // ----------------------------------------------------------
  const obtenerVentasPorDia = useCallback(
    async (desde: string, hasta: string): Promise<VentaPorDia[]> => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: err } = await supabase
          .from('v_ventas_por_dia')
          .select('*')
          .gte('fecha', desde)
          .lte('fecha', hasta)
          .order('fecha', { ascending: true })

        if (err) throw err
        return (data || []) as VentaPorDia[]
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

// VENTAS POR HORA
// ----------------------------------------------------------
  const obtenerVentasPorHora = useCallback(
    async (fecha: string): Promise<VentaPorHora[]> => {
      setLoading(true)
      setError(null)

      try {
        // Normalizar la fecha: si viene con 'T' (ISO), cortarla
        const fechaLimpia = fecha.split('T')[0]

        const { data, error: err } = await supabase
          .from('v_ventas_por_hora')
          .select('*')
          .eq('fecha', fechaLimpia)
          .order('hora', { ascending: true })

        if (err) throw err
        return (data || []) as VentaPorHora[]
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // ----------------------------------------------------------
  // PRODUCTOS MÁS VENDIDOS
  // ----------------------------------------------------------
  const obtenerProductosMasVendidos = useCallback(
    async (limite: number = 10): Promise<ProductoMasVendido[]> => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: err } = await supabase
          .from('v_productos_mas_vendidos')
          .select('*')
          .limit(limite)

        if (err) throw err
        return (data || []) as ProductoMasVendido[]
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // ----------------------------------------------------------
  // GANANCIAS POR PRODUCTO
  // ----------------------------------------------------------
  const obtenerGanancias = useCallback(
    async (limite: number = 10): Promise<GananciaProducto[]> => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: err } = await supabase
          .from('v_ganancias_por_producto')
          .select('*')
          .limit(limite)

        if (err) throw err
        return (data || []) as GananciaProducto[]
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // ----------------------------------------------------------
  // STOCK BAJO O SIN STOCK
  // ----------------------------------------------------------
  const obtenerStockBajo = useCallback(async (): Promise<StockBajo[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('v_stock_bajo')
        .select('*')
        .in('estado', ['bajo', 'sin_stock'])

      if (err) throw err
      return (data || []) as StockBajo[]
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // ----------------------------------------------------------
  // VALOR TOTAL DEL INVENTARIO
  // ----------------------------------------------------------
  const obtenerValorInventario = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('v_stock_bajo')
        .select('valor_inventario_costo, valor_inventario_venta')

      if (err) throw err

      const totales = (data || []).reduce(
        (acc, row: any) => ({
          costo: acc.costo + Number(row.valor_inventario_costo || 0),
          venta: acc.venta + Number(row.valor_inventario_venta || 0),
        }),
        { costo: 0, venta: 0 }
      )

      return {
        costo: totales.costo,
        venta: totales.venta,
        gananciaPotencial: totales.venta - totales.costo,
      }
    } catch (err: any) {
      setError(err.message)
      return { costo: 0, venta: 0, gananciaPotencial: 0 }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    loading,
    error,
    obtenerResumenPeriodo,
    obtenerVentasPorDia,
    obtenerVentasPorHora,
    obtenerProductosMasVendidos,
    obtenerGanancias,
    obtenerStockBajo,
    obtenerValorInventario,
  }
}
