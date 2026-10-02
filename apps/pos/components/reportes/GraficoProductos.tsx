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
import { ProductoMasVendido } from '@/hooks/useReportes'

interface Props {
  datos: ProductoMasVendido[]
  metrica?: 'kg' | 'facturacion'
}

// Colores para las barras (gradiente de rojo)
const COLORES = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444']

export function GraficoProductos({ datos, metrica = 'kg' }: Props) {
  // Preparar datos para el gráfico
  const datosGrafico = useMemo(() => {
    return [...datos]
      .sort((a, b) => {
        if (metrica === 'kg') {
          return Number(b.total_kg) - Number(a.total_kg)
        }
        return Number(b.total_facturado) - Number(a.total_facturado)
      })
      .slice(0, 5)
      .map((p) => ({
        nombre:
          p.producto_nombre.length > 18
            ? p.producto_nombre.substring(0, 18) + '...'
            : p.producto_nombre,
        nombreCompleto: p.producto_nombre,
        valor:
          metrica === 'kg'
            ? Number(p.total_kg)
            : Number(p.total_facturado),
        kg: Number(p.total_kg),
        facturado: Number(p.total_facturado),
      }))
  }, [datos, metrica])

  if (datosGrafico.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          📊 Top 5 {metrica === 'kg' ? 'por Cantidad' : 'por Facturación'}
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          📊 Top 5 {metrica === 'kg' ? 'por Cantidad' : 'por Facturación'}
        </h3>
        <span className="text-xs text-gray-500">
          {metrica === 'kg' ? 'kilogramos vendidos' : 'pesos facturados'}
        </span>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datosGrafico}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tickFormatter={(value) =>
                metrica === 'kg'
                  ? `${value}kg`
                  : `$${(value / 1000).toFixed(0)}k`
              }
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              width={130}
              tickLine={false}
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
                const item = props?.payload
                if (metrica === 'kg') {
                  return [
                    `${Number(value).toFixed(2)} kg · $${item?.facturado?.toLocaleString('es-AR') || 0}`,
                    'Cantidad',
                  ]
                }
                return [
                  `$${Number(value).toLocaleString('es-AR')} · ${item?.kg?.toFixed(2) || 0} kg`,
                  'Facturado',
                ]
              }}
              labelFormatter={(label, payload) => {
                return payload?.[0]?.payload?.nombreCompleto || label
              }}
            />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {datosGrafico.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORES[index % COLORES.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
