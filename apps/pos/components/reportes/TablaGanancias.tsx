'use client'

import { useMemo } from 'react'
import { GananciaProducto } from '@/hooks/useReportes'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface Props {
  datos: GananciaProducto[]
  limite?: number
}

// Color del margen según porcentaje
function getColorMargen(margen: number): { bg: string; text: string; label: string } {
  if (margen >= 40) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Excelente',
    }
  }
  if (margen >= 25) {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Bueno',
    }
  }
  if (margen >= 15) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Aceptable',
    }
  }
  return {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: 'Bajo',
  }
}

export function TablaGanancias({ datos, limite = 15 }: Props) {
  // Ordenar por ganancia neta descendente
  const ranking = useMemo(() => {
    return [...datos]
      .sort((a, b) => Number(b.ganancia_neta) - Number(a.ganancia_neta))
      .slice(0, limite)
  }, [datos, limite])

  // Estadísticas generales
  const stats = useMemo(() => {
    if (datos.length === 0) {
      return {
        gananciaTotal: 0,
        margenPromedio: 0,
        productosMargenBajo: 0,
      }
    }

    const gananciaTotal = datos.reduce(
      (sum, d) => sum + Number(d.ganancia_neta),
      0
    )
    const margenPromedio =
      datos.reduce((sum, d) => sum + Number(d.margen_porcentaje), 0) /
      datos.length
    const productosMargenBajo = datos.filter(
      (d) => Number(d.margen_porcentaje) < 20
    ).length

    return { gananciaTotal, margenPromedio, productosMargenBajo }
  }, [datos])

  if (ranking.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Ganancias por Producto
        </h3>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <div className="text-4xl mb-2">💰</div>
          <p>No hay datos de ganancias en este período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header con stats */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Ganancias por Producto
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Ganancia total:{' '}
            <span className="font-semibold text-green-700">
              ${stats.gananciaTotal.toLocaleString('es-AR')}
            </span>
            {' · '}
            Margen promedio:{' '}
            <span className="font-semibold text-gray-700">
              {stats.margenPromedio.toFixed(1)}%
            </span>
          </p>
        </div>

        {stats.productosMargenBajo > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-800 font-medium">
              {stats.productosMargenBajo}{' '}
              {stats.productosMargenBajo === 1
                ? 'producto con margen bajo'
                : 'productos con margen bajo'}
            </span>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto -mx-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase text-gray-600 border-y">
              <th className="text-left px-6 py-3 font-semibold">Producto</th>
              <th className="text-right px-4 py-3 font-semibold">Cantidad</th>
              <th className="text-right px-4 py-3 font-semibold">Venta</th>
              <th className="text-right px-4 py-3 font-semibold">Costo</th>
              <th className="text-right px-4 py-3 font-semibold">Ganancia</th>
              <th className="text-center px-6 py-3 font-semibold">Margen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranking.map((producto) => {
              const margen = Number(producto.margen_porcentaje)
              const colorMargen = getColorMargen(margen)
              const ganancia = Number(producto.ganancia_neta)

              return (
                <tr key={producto.producto_id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-sm text-gray-800">
                      {producto.producto_nombre}
                    </div>
                    {producto.categoria_nombre && (
                      <div className="text-xs text-gray-400">
                        {producto.categoria_nombre}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 font-mono">
                    {Number(producto.total_kg_vendidos).toFixed(2)} kg
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-800 font-mono">
                    ${Number(producto.total_venta).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500 font-mono">
                    ${Number(producto.total_costo).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {ganancia >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-bold font-mono ${
                          ganancia >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        ${ganancia.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorMargen.bg} ${colorMargen.text}`}
                    >
                      {margen.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda de márgenes */}
      <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 justify-center text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span>Excelente (≥40%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Bueno (25-40%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span>Aceptable (15-25%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span>Bajo (&lt;15%)</span>
        </div>
      </div>
    </div>
  )
}
