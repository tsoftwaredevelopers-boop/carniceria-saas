'use client'

import { useMemo } from 'react'
import { StockBajo } from '@/hooks/useReportes'
import { AlertTriangle, PackageX, Package, DollarSign } from 'lucide-react'

interface Props {
  datos: StockBajo[]
  valorInventario?: { costo: number; venta: number; gananciaPotencial: number }
}

export function AlertasStock({ datos, valorInventario }: Props) {
  // Separar productos por estado
  const { productosSinStock, productosBajoStock } = useMemo(() => {
    return {
      productosSinStock: datos.filter((d) => d.estado === 'sin_stock'),
      productosBajoStock: datos.filter((d) => d.estado === 'bajo'),
    }
  }, [datos])

  const totalAlertas = productosSinStock.length + productosBajoStock.length

  return (
    <>
      {/* Tarjetas de inventario */}
      {valorInventario && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                <DollarSign className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Valor Inventario (Costo)
            </p>
            <p className="text-2xl font-bold text-gray-800 font-mono">
              ${valorInventario.costo.toLocaleString('es-AR')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Valor Inventario (Venta)
            </p>
            <p className="text-2xl font-bold text-gray-800 font-mono">
              ${valorInventario.venta.toLocaleString('es-AR')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-700">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Ganancia Potencial
            </p>
            <p className="text-2xl font-bold text-green-700 font-mono">
              ${valorInventario.gananciaPotencial.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      )}

      {/* Alertas */}
      {totalAlertas > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Alertas de Stock
            </h3>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
              {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Productos sin stock */}
            {productosSinStock.length > 0 && (
              <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <PackageX className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800 text-sm">
                    Sin Stock ({productosSinStock.length})
                  </h4>
                </div>
                <ul className="space-y-2">
                  {productosSinStock.map((p) => (
                    <li
                      key={p.producto_id}
                      className="flex items-center justify-between text-sm bg-white rounded px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-800 truncate">
                          {p.nombre}
                        </span>
                        {p.categoria_nombre && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded text-white flex-shrink-0"
                            style={{
                              backgroundColor: p.categoria_color || '#6B7280',
                            }}
                          >
                            {p.categoria_nombre}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-red-600 font-semibold flex-shrink-0 ml-2">
                        0 kg
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Productos con stock bajo */}
            {productosBajoStock.length > 0 && (
              <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800 text-sm">
                    Stock Bajo ({productosBajoStock.length})
                  </h4>
                </div>
                <ul className="space-y-2">
                  {productosBajoStock.map((p) => (
                    <li
                      key={p.producto_id}
                      className="flex items-center justify-between text-sm bg-white rounded px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-800 truncate">
                          {p.nombre}
                        </span>
                        {p.categoria_nombre && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded text-white flex-shrink-0"
                            style={{
                              backgroundColor: p.categoria_color || '#6B7280',
                            }}
                          >
                            {p.categoria_nombre}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-yellow-700 font-semibold flex-shrink-0 ml-2">
                        {Number(p.stock_actual).toFixed(2)} kg
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
