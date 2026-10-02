'use client'

import { useEffect, useState, useCallback } from 'react'
import { useReportes, VentaPorDia, VentaPorHora, ResumenPeriodo } from '@/hooks/useReportes'
import { TarjetasMetricas } from '@/components/reportes/TarjetasMetricas'
import { GraficoVentas } from '@/components/reportes/GraficoVentas'
import { GraficoPorHora } from '@/components/reportes/GraficoPorHora'
import { Loader2, Calendar, TrendingUp } from 'lucide-react'

type FiltroTipo = 'hoy' | 'semana' | 'mes' | 'personalizado'

export default function VentasPage() {
  const {
    loading,
    obtenerResumenPeriodo,
    obtenerVentasPorDia,
    obtenerVentasPorHora,
  } = useReportes()

  const [filtro, setFiltro] = useState<FiltroTipo>('semana')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [resumen, setResumen] = useState<ResumenPeriodo | null>(null)
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([])
  const [ventasPorHora, setVentasPorHora] = useState<VentaPorHora[]>([])
  const [cargando, setCargando] = useState(true)

// Calcular rangos según el filtro
// Nota: usamos fecha LOCAL (no UTC) para evitar desfase de zona horaria
  const calcularRango = useCallback((tipo: FiltroTipo) => {
    const hoy = new Date()
    let desde: Date

    switch (tipo) {
      case 'hoy':
        desde = new Date(hoy)
        break
      case 'semana':
        desde = new Date(hoy)
        desde.setDate(desde.getDate() - 6) // Últimos 7 días
        break
      case 'mes':
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        break
      case 'personalizado':
        return {
          desde: fechaDesde,
          hasta: fechaHasta,
        }
    }

    // Formatear fecha LOCAL como YYYY-MM-DD (sin convertir a UTC)
    const formatearFechaLocal = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      desde: formatearFechaLocal(desde),
      hasta: formatearFechaLocal(hoy),
    }
  }, [fechaDesde, fechaHasta])

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const { desde, hasta } = calcularRango(filtro)

      const [resumenData, diasData] = await Promise.all([
        obtenerResumenPeriodo(desde, hasta),
        obtenerVentasPorDia(desde, hasta),
      ])

      setResumen(resumenData)
      setVentasPorDia(diasData)

      // Para el gráfico por hora, cargamos solo el día más reciente con ventas
      let fechaParaHoras: string
      if (diasData.length > 0) {
        // Normalizar la fecha del último día (cortar en 'T' si existe)
        fechaParaHoras = diasData[diasData.length - 1].fecha.split('T')[0]
      } else {
        // Si no hay datos, usar hoy
        fechaParaHoras = new Date().toISOString().split('T')[0]
      }

      const horasData = await obtenerVentasPorHora(fechaParaHoras)
      setVentasPorHora(horasData)
    } finally {
      setCargando(false)
    }
  }, [filtro, calcularRango, obtenerResumenPeriodo, obtenerVentasPorDia, obtenerVentasPorHora])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Datos por defecto si no hay nada
  const resumenDefault: ResumenPeriodo = {
    cantidad_ventas: 0,
    total_vendido: 0,
    ticket_promedio: 0,
    total_efectivo: 0,
    total_tarjeta: 0,
    total_transferencia: 0,
  }

  const resumenMostrar = resumen || resumenDefault

  // Fecha del último día con ventas (para el gráfico por hora)
  // Fecha del último día con ventas (para el gráfico por hora)
  // Nota: NO usamos new Date() porque convertiría a UTC y retrocedería 1 día
  const fechaUltimoDia = (() => {
    const fechaStr = ventasPorDia.length > 0
      ? ventasPorDia[ventasPorDia.length - 1].fecha
      : new Date().toISOString()

    // Cortar en la 'T' si existe y separar
    const [year, month, day] = fechaStr.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  })()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-red-700" />
            Reportes de Ventas
          </h1>
          <p className="text-gray-500 mt-1">
            Analiza el rendimiento de tu carnicería en tiempo real
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Período:</span>

            <div className="flex flex-wrap gap-2">
              {(['hoy', 'semana', 'mes', 'personalizado'] as FiltroTipo[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltro(tipo)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                    filtro === tipo
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tipo === 'hoy'
                    ? 'Hoy'
                    : tipo === 'semana'
                      ? 'Últimos 7 días'
                      : tipo === 'mes'
                        ? 'Este mes'
                        : 'Personalizado'}
                </button>
              ))}
            </div>

            {filtro === 'personalizado' && (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <span className="text-gray-500">→</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <button
                  onClick={cargarDatos}
                  disabled={!fechaDesde || !fechaHasta}
                  className="bg-red-700 hover:bg-red-800 disabled:bg-red-300 text-white px-3 py-1.5 rounded text-sm font-medium"
                >
                  Aplicar
                </button>
              </div>
            )}

            <button
              onClick={cargarDatos}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-red-700 mx-auto mb-4" />
            <p className="text-gray-500">Cargando reportes...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de métricas */}
            <TarjetasMetricas
              totalVendido={resumenMostrar.total_vendido}
              cantidadVentas={resumenMostrar.cantidad_ventas}
              ticketPromedio={resumenMostrar.ticket_promedio}
              totalEfectivo={resumenMostrar.total_efectivo}
              totalTarjeta={resumenMostrar.total_tarjeta}
              totalTransferencia={resumenMostrar.total_transferencia}
            />

            {/* Gráfico de ventas por día */}
            <GraficoVentas datos={ventasPorDia} />

            {/* Gráfico de ventas por hora */}
            <GraficoPorHora datos={ventasPorHora} fecha={fechaUltimoDia} />
          </>
        )}
      </div>
    </div>
  )
}