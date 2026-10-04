'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { Search, Beef, Loader2 } from 'lucide-react'

export interface Producto {
  id: string
  nombre: string
  precio_venta_kg: number
  stock_actual: number
  stock_minimo: number
  unidad_medida: string
  categoria_id: string | null
  categorias?: { nombre: string; color: string } | null
}

interface Props {
  onSelectProducto: (producto: Producto) => void
}

export function BuscadorProducto({ onSelectProducto }: Props) {
  const supabase = useSupabase()
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nombre: string; color: string }[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas')
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      setLoading(true)

      // 1. Obtener tenant_id del usuario (SEGURIDAD EXTRA)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!usuarioData) {
        setLoading(false)
        return
      }

      setTenantId(usuarioData.tenant_id)

      // 2. Cargar categorías del tenant
      const { data: cats } = await supabase
        .from('categorias')
        .select('id, nombre, color')
        .eq('tenant_id', usuarioData.tenant_id)
        .order('nombre')
      setCategorias(cats || [])

      // 3. Cargar productos del tenant (con filtro explícito)
      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta_kg, stock_actual, stock_minimo, unidad_medida, categoria_id, categorias(nombre, color)')
        .eq('tenant_id', usuarioData.tenant_id)
        .eq('activo', true)
        .order('nombre')
      setProductos(prods || [])

      setLoading(false)
    }
    cargar()
  }, [supabase])

  const productosFiltrados = productos.filter((p) => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchCategoria = categoriaActiva === 'todas' || p.categoria_id === categoriaActiva
    return matchBusqueda && matchCategoria
  })

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white border-b">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar corte de carne..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none text-gray-900"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaActiva('todas')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              categoriaActiva === 'todas'
                ? 'bg-red-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                categoriaActiva === cat.id
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={categoriaActiva === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-red-700" />
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Beef className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-medium">
              {productos.length === 0
                ? 'No hay productos cargados'
                : 'No se encontraron productos'}
            </p>
            {productos.length === 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Andá a "Productos" para cargar tu catálogo
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {productosFiltrados.map((prod) => (
              <button
                key={prod.id}
                onClick={() => onSelectProducto(prod)}
                disabled={prod.stock_actual <= 0}
                className={`bg-white border rounded-lg p-3 text-left transition ${
                  prod.stock_actual <= 0
                    ? 'opacity-40 cursor-not-allowed border-gray-200'
                    : prod.stock_actual <= prod.stock_minimo
                      ? 'border-yellow-400 hover:border-yellow-600 hover:shadow-md'
                      : 'border-gray-200 hover:border-red-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                    {prod.nombre}
                  </p>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  {prod.categorias && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: prod.categorias.color }}
                    >
                      {prod.categorias.nombre}
                    </span>
                  )}
                </div>
                <p className="text-red-700 font-bold text-lg">
                  ${prod.precio_venta_kg.toLocaleString()}
                  <span className="text-xs text-gray-500 font-normal"> /kg</span>
                </p>
                <p
                  className={`text-xs mt-1 flex items-center gap-1 ${
                    prod.stock_actual <= 0
                      ? 'text-red-600 font-semibold'
                      : prod.stock_actual <= prod.stock_minimo
                        ? 'text-yellow-600 font-medium'
                        : 'text-gray-500'
                  }`}
                >
                  {prod.stock_actual <= 0 ? (
                    <>❌ Sin stock</>
                  ) : prod.stock_actual <= prod.stock_minimo ? (
                    <>⚠️ Stock bajo: {Number(prod.stock_actual).toFixed(2)} kg</>
                  ) : (
                    <>Stock: {Number(prod.stock_actual).toFixed(2)} kg</>
                  )}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
