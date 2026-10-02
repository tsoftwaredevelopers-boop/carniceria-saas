'use client'

import { useMemo } from 'react'
import { ProductoMasVendido } from '@/hooks/useReportes'
import { Trophy, TrendingUp } from 'lucide-react'

interface Props {
  datos: ProductoMasVendido[]
  ordenarPor?: 'kg' | 'facturacion'
  limite?: number
}

// Medallas para el top 3
function getMedalla(posicion: number): string {
  if (posicion === 1) return '🥇'
  if (posicion === 2) return '🥈'
  if (posicion === 3) return '🥉'
  return `${posicion}.`
}

export function RankingProductos({
  datos,
  ordenarPor = 'kg',
  limite = 10,
}: Props) {
  // Ordenar y limitar los datos
  const ranking = useMemo(() => {
    const ordenados = [...datos].sort((a, b) => {
      if (ordenarPor === 'kg') {
        return Number(b.total_kg) - Number(a.total_kg)
      }
      return Number(b.total_facturado) - Number(a.total_facturado)
    })

    return ordenados.slice(0, limite)
  }, [datos, ordenarPor, limite])

  // Valor máximo (para la barra de progreso)
  const maxValor = useMemo(() => {
    if (ranking.length === 0) return 0
    return ordenarPor === 'kg'
      ? Math.max(...ranking.map((p) => Number(p.total_kg)))
      : Math.max(...ranking.map((p) => Number(p.total_facturado)))
  }, [ranking, ordenarPor])

  if (ranking.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Ranking de Productos
        </h3>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>No hay productos vendidos en este período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          {ordenarPor === 'kg'
            ? 'Top Productos por Cantidad Vendida'
            : 'Top Productos por Facturación'}
        </h3>
        <span className="text-xs text-gray-500">
          Mostrando {ranking.length} de {datos.length}
        </span>
      </div>

      <div className="space-y-3">
        {ranking.map((producto, index) => {
          const valor =
            ordenarPor === 'kg'
              ? Number(producto.total_kg)
              : Number(producto.total_facturado)

          const porcentaje = maxValor > 0 ? (valor / maxValor) * 100 : 0

          return (
            <div
              key={producto.producto_id}
              className="flex items-center gap-3 group"
            >
              {/* Posición */}
              <div className="w-10 text-center flex-shrink-0">
                <span className="text-lg font-bold text-gray-700">
                  {getMedalla(index + 1)}
                </span>
              </div>

              {/* Info del producto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-gray-800 truncate">
                      {producto.producto_nombre}
                    </span>
                    {producto.categoria_nombre && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{
                          backgroundColor: producto.categoria_color || '#6B7280',
                        }}
                      >
                        {producto.categoria_nombre}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-bold font-mono text-gray-800">
                      {ordenarPor === 'kg'
                        ? `${valor.toFixed(2)} kg`
                        : `$${valor.toLocaleString('es-AR')}`}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                            ? 'bg-orange-400'
                            : 'bg-red-600'
                    }`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>

                {/* Sub-info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  {ordenarPor === 'kg' ? (
                    <>
                      <span>
                        💰 ${Number(producto.total_facturado).toLocaleString('es-AR')}
                      </span>
                      <span>·</span>
                      <span>
                        {producto.cantidad_ventas}{' '}
                        {producto.cantidad_ventas === 1 ? 'venta' : 'ventas'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>⚖️ {Number(producto.total_kg).toFixed(2)} kg</span>
                      <span>·</span>
                      <span>
                        {producto.cantidad_ventas}{' '}
                        {producto.cantidad_ventas === 1 ? 'venta' : 'ventas'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
