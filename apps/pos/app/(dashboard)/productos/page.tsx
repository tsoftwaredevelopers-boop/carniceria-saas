'use client'

import { useEffect, useState, useCallback } from 'react'
import { useReportes, ProductoMasVendido } from '@/hooks/useReportes'
import { RankingProductos } from '@/components/reportes/RankingProductos'
import { GraficoProductos } from '@/components/reportes/GraficoProductos'
import { Loader2, Package, TrendingUp, DollarSign, Weight } from 'lucide-react'
import { TablaGanancias } from '@/components/reportes/TablaGanancias'
import { AlertasStock } from '@/components/reportes/AlertasStock'
import { GananciaProducto, StockBajo } from '@/hooks/useReportes'

export default function ProductosPage() {
  const { obtenerProductosMasVendidos, obtenerGanancias, obtenerStockBajo, obtenerValorInventario } = useReportes()

  const [productos, setProductos] = useState<ProductoMasVendido[]>([])
  const [cargando, setCargando] = useState(true)
  const [ganancias, setGanancias] = useState<GananciaProducto[]>([])
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([])
  const [valorInventario, setValorInventario] = useState<{costo: number; venta: number; gananciaPotencial: number} | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const [productosData, gananciasData, stockData, inventarioData] = await Promise.all([
        obtenerProductosMasVendidos(50),
        obtenerGanancias(50),
        obtenerStockBajo(),
        obtenerValorInventario(),
      ])
      setProductos(productosData)
      setGanancias(gananciasData)
      setStockBajo(stockData)
      setValorInventario(inventarioData)
    } finally {
      setCargando(false)
    }
  }, [obtenerProductosMasVendidos, obtenerGanancias, obtenerStockBajo, obtenerValorInventario])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const stats = {
    totalProductos: productos.length,
    totalKg: productos.reduce((sum, p) => sum + Number(p.total_kg), 0),
    totalFacturado: productos.reduce(
      (sum, p) => sum + Number(p.total_facturado),
      0
    ),
    kgPromedio:
      productos.length > 0
        ? productos.reduce((sum, p) => sum + Number(p.total_kg), 0) /
          productos.length
        : 0,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Package className="w-8 h-8 text-red-700" />
            Ranking de Productos
          </h1>
          <p className="text-gray-500 mt-1">
            Descubre cuáles son tus cortes más vendidos y rentables
          </p>
        </div>

        {cargando ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-red-700 mx-auto mb-4" />
            <p className="text-gray-500">Cargando ranking...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Productos Vendidos
                </p>
                <p className="text-2xl font-bold text-gray-800 font-mono">
                  {stats.totalProductos}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700">
                    <Weight className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Total Vendido
                </p>
                <p className="text-2xl font-bold text-gray-800 font-mono">
                  {stats.totalKg.toFixed(2)} kg
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-700">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Total Facturado
                </p>
                <p className="text-2xl font-bold text-gray-800 font-mono">
                  ${stats.totalFacturado.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Promedio por Producto
                </p>
                <p className="text-2xl font-bold text-gray-800 font-mono">
                  {stats.kgPromedio.toFixed(2)} kg
                </p>
              </div>
            </div>

            <RankingProductos datos={productos} ordenarPor="kg" limite={10} />

            <RankingProductos
              datos={productos}
              ordenarPor="facturacion"
              limite={10}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraficoProductos datos={productos} metrica="kg" />
              <GraficoProductos datos={productos} metrica="facturacion" />
            </div>
            {/* Tabla de ganancias */}
            <TablaGanancias datos={ganancias} limite={15} />

            {/* Alertas de stock */}
            <AlertasStock datos={stockBajo} valorInventario={valorInventario || undefined} />
          </>
        )}
      </div>
    </div>
  )
}
