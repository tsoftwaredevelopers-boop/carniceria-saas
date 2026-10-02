'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts'
import { VentaPorDia } from '@/hooks/useReportes'

interface Props {
  datos: VentaPorDia[]
}

// Formatear fecha "2026-10-02" → "02/10" (o "02/10/26" si cruza años)
function formatearFechaCorta(isoFecha: string, mostrarAnio: boolean): string {
  const [year, month, day] = isoFecha.split('T')[0].split('-')
  return mostrarAnio ? `${day}/${month}/${year.slice(-2)}` : `${day}/${month}`
}

export function GraficoVentas({ datos }: Props) {
  // Formatear los datos con memoización
  const datosFormateados = useMemo(() => {
    if (datos.length === 0) return []

    // Detectar si el rango cruza diferentes años
    const anios = new Set(datos.map((d) => d.fecha.split('-')[0]))
    const mostrarAnio = anios.size > 1

    return datos.map((d) => ({
      fecha: formatearFechaCorta(d.fecha, mostrarAnio),
      fechaCompleta: d.fecha,
      ventas: Number(d.total_vendido),
      cantidad: Number(d.cantidad_ventas),
      ticket: Number(d.ticket_promedio),
    }))
  }, [datos])

  // Estadísticas del período
  const stats = useMemo(() => {
    if (datosFormateados.length === 0) {
      return { total: 0, promedio: 0, maximo: 0, diaMax: '', mejorDia: null }
    }

    const total = datosFormateados.reduce((sum, d) => sum + d.ventas, 0)
    const promedio = total / datosFormateados.length
    const maximo = Math.max(...datosFormateados.map((d) => d.ventas))
    const mejorDia = datosFormateados.find((d) => d.ventas === maximo)

    return {
      total,
      promedio,
      maximo,
      diaMax: mejorDia?.fecha || '',
      mejorDia,
    }
  }, [datosFormateados])

  // Estado vacío
  if (datosFormateados.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          📈 Ventas por Día
        </h3>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <div className="text-4xl mb-2">📉</div>
          <p>No hay datos disponibles para el período</p>
          <p className="text-xs mt-1">Prueba con otro rango de fechas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header con estadísticas */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            📈 Ventas por Día
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {datosFormateados.length} {datosFormateados.length === 1 ? 'día' : 'días'} con actividad
            {' · '}
            Total: <span className="font-semibold text-gray-700">${stats.total.toLocaleString('es-AR')}</span>
            {' · '}
            Promedio: <span className="font-semibold text-gray-700">${Math.round(stats.promedio).toLocaleString('es-AR')}</span>
          </p>
        </div>

        {stats.mejorDia && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Mejor día</p>
            <p className="text-sm font-bold text-gray-800">
              {stats.diaMax} · ${stats.maximo.toLocaleString('es-AR')}
            </p>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={datosFormateados}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradientVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

            <XAxis
              dataKey="fecha"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />

            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => (value === 0 ? '0' : `$${(value / 1000).toFixed(0)}k`)}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              width={50}
            />

            {/* Línea de promedio (referencia) */}
            <ReferenceLine
              y={stats.promedio}
              stroke="#6b7280"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{
                value: `Prom: $${Math.round(stats.promedio).toLocaleString('es-AR')}`,
                position: 'right',
                fill: '#6b7280',
                fontSize: 10,
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name, props) => {
                const numValue = Number(value)
                if (name === 'ventas') {
                  const cantidad = props?.payload?.cantidad ?? 0
                  return [
                    `$${numValue.toLocaleString('es-AR')}`,
                    `${cantidad} ${cantidad === 1 ? 'venta' : 'ventas'}`,
                  ]
                }
                return [numValue, String(name)]
              }}
              labelFormatter={(label) => `Fecha: ${label}`}
            />

            {/* Área con gradiente */}
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#dc2626"
              strokeWidth={3}
              fill="url(#gradientVentas)"
              dot={{ fill: '#dc2626', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Nota al pie */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        💡 La línea punteada muestra el promedio del período
      </p>
    </div>
  )
}