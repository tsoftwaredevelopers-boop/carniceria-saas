'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { useMermas, Merma } from '@/hooks/useMermas'
import { toast } from 'sonner'
import {
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  Clock,
  TrendingDown,
  X,
} from 'lucide-react'

interface Producto {
  id: string
  nombre: string
  stock_actual: number
  unidad_medida: string
  categorias?: { nombre: string; color: string } | null
}

const MOTIVOS = [
  { value: 'vencimiento', label: 'Vencimiento', color: 'bg-red-100 text-red-800' },
  { value: 'mal_corte', label: 'Mal corte', color: 'bg-orange-100 text-orange-800' },
  { value: 'decomiso', label: 'Decomiso', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'error', label: 'Error', color: 'bg-blue-100 text-blue-800' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-100 text-gray-800' },
]

export default function MermasPage() {
  const supabase = useSupabase()
  const { crearMerma, listarMermas, loading: loadingAccion } = useMermas()

  const [mermas, setMermas] = useState<Merma[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Filtros
  const [filtroMes, setFiltroMes] = useState(() => {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  })

  // Formulario
  const [formulario, setFormulario] = useState({
    producto_id: '',
    cantidad: '',
    motivo: 'vencimiento' as Merma['motivo'],
    observaciones: '',
  })

  // Cargar datos
  useEffect(() => {
    async function cargar() {
      setLoading(true)

      // Productos
      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, stock_actual, unidad_medida, categorias(nombre, color)')
        .eq('activo', true)
        .order('nombre')
      setProductos(prods || [])

      // Mermas del mes
      const [year, month] = filtroMes.split('-').map(Number)
      const desde = new Date(year, month - 1, 1).toISOString()
      const hasta = new Date(year, month, 0, 23, 59, 59).toISOString()

      const mermasData = await listarMermas({ desde, hasta })
      setMermas(mermasData)

      setLoading(false)
    }
    cargar()
  }, [supabase, filtroMes, listarMermas])

  // Recargar cuando cambia el filtro
  async function recargarMermas() {
    const [year, month] = filtroMes.split('-').map(Number)
    const desde = new Date(year, month - 1, 1).toISOString()
    const hasta = new Date(year, month, 0, 23, 59, 59).toISOString()

    const mermasData = await listarMermas({ desde, hasta })
    setMermas(mermasData)
  }

  // Guardar merma
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formulario.producto_id) {
      toast.error('Selecciona un producto')
      return
    }

    const cantidad = parseFloat(formulario.cantidad.replace(',', '.')) || 0
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    const producto = productos.find((p) => p.id === formulario.producto_id)
    if (!producto) return

    if (cantidad > producto.stock_actual) {
      toast.error('La cantidad no puede superar el stock actual', {
        description: `Stock disponible: ${producto.stock_actual} ${producto.unidad_medida}`,
      })
      return
    }

    try {
      setGuardando(true)
      await crearMerma({
        producto_id: formulario.producto_id,
        cantidad,
        motivo: formulario.motivo,
        observaciones: formulario.observaciones,
      })

      toast.success('Merma registrada', {
        description: `${producto.nombre}: ${cantidad} ${producto.unidad_medida}`,
      })

      // Limpiar formulario
      setFormulario({
        producto_id: '',
        cantidad: '',
        motivo: 'vencimiento',
        observaciones: '',
      })
      setMostrarFormulario(false)

      // Recargar
      await recargarMermas()

      // Actualizar stock del producto en memoria
      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, stock_actual, unidad_medida, categorias(nombre, color)')
        .eq('activo', true)
        .order('nombre')
      setProductos(prods || [])
    } catch (err: any) {
      toast.error('Error al registrar merma', { description: err.message })
    } finally {
      setGuardando(false)
    }
  }

  // Estadísticas
  const stats = {
    total: mermas.length,
    kg: mermas.reduce((sum, m) => sum + Number(m.cantidad), 0),
    porMotivo: MOTIVOS.map((mot) => ({
      ...mot,
      count: mermas.filter((m) => m.motivo === mot.value).length,
      kg: mermas
        .filter((m) => m.motivo === mot.value)
        .reduce((sum, m) => sum + Number(m.cantidad), 0),
    })).filter((m) => m.count > 0),
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-red-700" />
              Mermas y Pérdidas
            </h1>
            <p className="text-gray-500 mt-1">
              Registra las pérdidas de carne por vencimiento, mal corte o decomiso
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            {mostrarFormulario ? (
              <>
                <X className="w-5 h-5" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Nueva Merma
              </>
            )}
          </button>
        </div>

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Registrar Merma</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Producto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Producto *
                </label>
                <select
                  value={formulario.producto_id}
                  onChange={(e) =>
                    setFormulario({ ...formulario, producto_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                >
                  <option value="">Selecciona un producto...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — Stock: {Number(p.stock_actual).toFixed(2)} {p.unidad_medida}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad (kg) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formulario.cantidad}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      cantidad: e.target.value.replace(',', '.'),
                    })
                  }
                  placeholder="0.000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none font-mono text-lg"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {MOTIVOS.map((mot) => (
                    <button
                      key={mot.value}
                      type="button"
                      onClick={() =>
                        setFormulario({
                          ...formulario,
                          motivo: mot.value as Merma['motivo'],
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        formulario.motivo === mot.value
                          ? 'bg-red-700 text-white ring-2 ring-red-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={formulario.observaciones}
                  onChange={(e) =>
                    setFormulario({ ...formulario, observaciones: e.target.value })
                  }
                  placeholder="Ej: Se venció por falta de rotación, corte mal realizado, etc."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Registrar Merma
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Mermas del mes
              </span>
              <Trash2 className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-600 uppercase">
                Total perdido
              </span>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800 font-mono">
              {stats.kg.toFixed(2)} kg
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Filtro
              </span>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="month"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Motivos */}
        {stats.porMotivo.length > 0 && (
          <div className="bg-white rounded-lg shadow p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Desglose por motivo
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats.porMotivo.map((mot) => (
                <div
                  key={mot.value}
                  className={`px-3 py-2 rounded-lg ${mot.color} flex items-center gap-2`}
                >
                  <span className="font-semibold">{mot.label}:</span>
                  <span>
                    {mot.count} {mot.count === 1 ? 'merma' : 'mermas'}
                  </span>
                  <span className="font-mono">({mot.kg.toFixed(2)} kg)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de mermas */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">Historial de Mermas</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-700 mx-auto mb-4" />
              <p className="text-gray-500">Cargando mermas...</p>
            </div>
          ) : mermas.length === 0 ? (
            <div className="p-12 text-center">
              <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                No hay mermas registradas
              </h3>
              <p className="text-gray-500 text-sm">
                Las mermas que registres aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold">Producto</th>
                    <th className="text-right px-4 py-3 font-semibold">Cantidad</th>
                    <th className="text-left px-4 py-3 font-semibold">Motivo</th>
                    <th className="text-left px-4 py-3 font-semibold">Usuario</th>
                    <th className="text-left px-4 py-3 font-semibold">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mermas.map((m) => {
                    const motivoInfo = MOTIVOS.find((mot) => mot.value === m.motivo)
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(m.created_at).toLocaleDateString('es-AR')}
                          <br />
                          <span className="text-xs text-gray-400">
                            {new Date(m.created_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {m.productos?.nombre || 'Producto eliminado'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-red-600">
                          -{Number(m.cantidad).toFixed(3)} kg
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${motivoInfo?.color || 'bg-gray-100'}`}
                          >
                            {motivoInfo?.label || m.motivo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {m.usuarios?.nombre || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                          {m.observaciones || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}