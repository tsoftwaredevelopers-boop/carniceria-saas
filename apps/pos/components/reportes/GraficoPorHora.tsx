'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { VentaPorHora } from '@/hooks/useReportes'

interface Props {
  datos: VentaPorHora[]
  fecha?: string
}

// Formatear fecha ISO "2026-10-02" → "02/10/2026"
function formatearFecha(fecha: string | undefined): string {
  if (!fecha) return ''
  // Si viene en formato ISO (YYYY-MM-DD), convertir a DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [year, month, day] = fecha.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  }
  return fecha
}

export function GraficoPorHora({ datos, fecha }: Props) {
  // Formatear los datos: completar las 24 horas
  const datosFormateados = useMemo(() => {
    // Índice rápido: hora → ventas
    const mapaHoras = new Map<number, VentaPorHora>()
    datos.forEach((d) => mapaHoras.set(d.hora, d))

    return Array.from({ length: 24 }, (_, hora) => {
      const encontrado = mapaHoras.get(hora)
      return {
        hora,
        horaLabel: `${hora.toString().padStart(2, '0')}:00`,
        ventas: encontrado ? Number(encontrado.total_vendido) : 0,
        cantidad: encontrado ? Number(encontrado.cantidad_ventas) : 0,
      }
    })
  }, [datos])

  // Hora pico (para destacarla visualmente)
  const horaPico = useMemo(() => {
    let pico = 0
    let valorPico = 0
    datosFormateados.forEach((d) => {
      if (d.ventas > valorPico) {
        valorPico = d.ventas
        pico = d.hora
      }
    })
    return valorPico > 0 ? pico : -1
  }, [datosFormateados])

  // Estadísticas rápidas del día
  const stats = useMemo(() => {
    const totalDia = datosFormateados.reduce((sum, d) => sum + d.ventas, 0)
    const horasConVentas = datosFormateados.filter((d) => d.ventas > 0).length
    return { totalDia, horasConVentas }
  }, [datosFormateados])

  const fechaFormateada = formatearFecha(fecha)

  // Estado vacío
  if (datos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          ⏰ Ventas por Hora {fechaFormateada && `(${fechaFormateada})`}
        </h3>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>No hay ventas registradas en este día</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            ⏰ Ventas por Hora {fechaFormateada && `(${fechaFormateada})`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Total del día: <span className="font-semibold text-gray-700">${stats.totalDia.toLocaleString('es-AR')}</span>
            {' · '}
            {stats.horasConVentas} {stats.horasConVentas === 1 ? 'hora activa' : 'horas activas'}
          </p>
        </div>

        {horaPico >= 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Hora pico</p>
            <p className="text-lg font-bold text-red-700">
              {horaPico.toString().padStart(2, '0')}:00
            </p>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datosFormateados}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="horaLabel"
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
            <Tooltip
              cursor={{ fill: 'rgba(220, 38, 38, 0.05)' }}
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
                    `Total (${cantidad} ${cantidad === 1 ? 'venta' : 'ventas'})`,
                  ]
                }
                return [numValue, String(name)]
              }}
              labelFormatter={(label) => `Hora: ${label}`}
            />
            <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
              {datosFormateados.map((entry) => (
                <Cell
                  key={`cell-${entry.hora}`}
                  fill={entry.hora === horaPico ? '#7f1d1d' : '#dc2626'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}