'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdmin, AdminTenant, MetricasAdmin } from '@/hooks/useAdmin'
import { useSupabase } from '@/hooks/useSupabase'
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Ban,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPage() {
  const supabase = useSupabase()
  const { listarTenants, cambiarEstado, cambiarPlan, extenderTrial, calcularMetricas, loading } = useAdmin()
  const [suspendiendoVencidos, setSuspendiendoVencidos] = useState(false)

  const [esSuperAdmin, setEsSuperAdmin] = useState<boolean | null>(null)
  const [tenants, setTenants] = useState<AdminTenant[]>([])
  const [metricas, setMetricas] = useState<MetricasAdmin | null>(null)
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [accionando, setAccionando] = useState<string | null>(null)

  // Verificar si es super_admin
  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setEsSuperAdmin(false)
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      setEsSuperAdmin(data?.rol === 'super_admin')
    }
    verificar()
  }, [supabase])

  // Cargar tenants
  const cargarTenants = useCallback(async () => {
    setCargando(true)
    try {
      const data = await listarTenants()
      setTenants(data)
      setMetricas(calcularMetricas(data))
    } finally {
      setCargando(false)
    }
  }, [listarTenants, calcularMetricas])

  useEffect(() => {
    if (esSuperAdmin) {
      cargarTenants()
    }
  }, [esSuperAdmin, cargarTenants])

  // Filtrar por búsqueda
  const tenantsFiltrados = tenants.filter((t) =>
    t.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.email_contacto.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Acción: suspender / reactivar
  async function handleCambiarEstado(tenant: AdminTenant) {
    const nuevoEstado = tenant.status === 'suspended' ? 'active' : 'suspended'
    const verbo = nuevoEstado === 'active' ? 'reactivar' : 'suspender'

    if (!confirm(`¿${verbo.charAt(0).toUpperCase() + verbo.slice(1)} ${tenant.nombre_comercial}?`)) {
      return
    }

    setAccionando(tenant.id)
    try {
      const ok = await cambiarEstado(tenant.id, nuevoEstado)
      if (ok) {
        toast.success(`Tenant ${nuevoEstado === 'active' ? 'reactivado' : 'suspendido'}`)
        await cargarTenants()
      } else {
        toast.error('Error al cambiar estado')
      }
    } finally {
      setAccionando(null)
    }
  }
  // Acción: suspender tenants vencidos (ejecuta la función SQL)
  async function handleSuspenderVencidos() {
    if (!confirm('¿Suspender todas las carnicerías con trial/suscripción vencidos hace más de 7 días?')) {
      return
    }

    setSuspendiendoVencidos(true)
    try {
      const { data, error } = await supabase.rpc('suspender_tenants_vencidos')

      if (error) throw error

      const suspendidos = data as Array<{ tenant_id: string; nombre_comercial: string; razon: string }>

      if (suspendidos && suspendidos.length > 0) {
        toast.success(`${suspendidos.length} carnicería(s) suspendida(s)`, {
          description: suspendidos.map(s => s.nombre_comercial).join(', '),
        })
        await cargarTenants()
      } else {
        toast.info('No hay carnicerías vencidas para suspender')
      }
    } catch (err: any) {
      toast.error('Error al suspender vencidos', {
        description: err.message,
      })
    } finally {
      setSuspendiendoVencidos(false)
    }
  }
  // Acción: cambiar plan
  async function handleCambiarPlan(tenant: AdminTenant, nuevoPlan: string) {
    if (nuevoPlan === tenant.plan_id) return

    if (!confirm(`¿Cambiar el plan de ${tenant.nombre_comercial} a ${nuevoPlan.toUpperCase()}?`)) {
      return
    }

    setAccionando(tenant.id)
    try {
      const ok = await cambiarPlan(tenant.id, nuevoPlan)
      if (ok) {
        toast.success(`Plan cambiado a ${nuevoPlan.toUpperCase()}`)
        await cargarTenants()
      } else {
        toast.error('Error al cambiar plan')
      }
    } finally {
      setAccionando(null)
    }
  }
  // Acción: extender trial
  async function handleExtenderTrial(tenant: AdminTenant) {
    if (!confirm(`¿Extender 30 días de trial a ${tenant.nombre_comercial}?`)) return

    setAccionando(tenant.id)
    try {
      const ok = await extenderTrial(tenant.id, 30)
      if (ok) {
        toast.success('Trial extendido 30 días')
        await cargarTenants()
      } else {
        toast.error('Error al extender trial')
      }
    } finally {
      setAccionando(null)
    }
  }

  // Estado de carga inicial
  if (esSuperAdmin === null || cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-700 mx-auto mb-4" />
          <p className="text-gray-500">Cargando panel admin...</p>
        </div>
      </div>
    )
  }

  // Sin permisos
  if (!esSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Acceso Denegado</h1>
          <p className="text-gray-500">
            Esta sección es solo para administradores del sistema SaaS.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              👑 Panel de Administración
            </h1>
            <p className="text-gray-500 mt-1">
              Gestión de carnicerías registradas en el sistema
            </p>
          </div>
          <button
            onClick={handleSuspenderVencidos}
            disabled={suspendiendoVencidos}
            className="text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded-lg flex items-center gap-2 transition"
            title="Suspende automáticamente las carnicerías vencidas hace más de 7 días"
          >
            {suspendiendoVencidos ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                Suspender Vencidos
              </>
            )}
          </button>
          <button
            onClick={cargarTenants}
            className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Métricas */}
        {metricas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Total Clientes
              </p>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                {metricas.totalTenants}
              </p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-green-600">
                  ✓ {metricas.tenantsActivos} activos
                </span>
                <span className="text-yellow-600">
                  ⏱ {metricas.tenantsEnTrial} trial
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-700">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                MRR Estimado
              </p>
              <p className="text-2xl font-bold text-green-700 font-mono">
                ${metricas.mrrEstimado.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-500 mt-2">Ingreso mensual recurrente</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                En Prueba
              </p>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                {metricas.tenantsEnTrial}
              </p>
              <p className="text-xs text-gray-500 mt-2">Carnicerías en trial</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-700">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Suspendidos
              </p>
              <p className="text-2xl font-bold text-red-700 font-mono">
                {metricas.tenantsSuspendidos}
              </p>
              <p className="text-xs text-gray-500 mt-2">Requieren atención</p>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Tabla de tenants */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">
              Carnicerías ({tenantsFiltrados.length})
            </h2>
          </div>

          {tenantsFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No hay carnicerías que coincidan con la búsqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Carnicería</th>
                    <th className="text-center px-4 py-3 font-semibold">Plan</th>
                    <th className="text-center px-4 py-3 font-semibold">Estado</th>
                    <th className="text-center px-4 py-3 font-semibold">Vence en</th>
                    <th className="text-right px-4 py-3 font-semibold">Ventas</th>
                    <th className="text-right px-4 py-3 font-semibold">Facturado</th>
                    <th className="text-center px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenantsFiltrados.map((t) => {
                    const dias = t.dias_hasta_vencimiento
                    const estadoColor = {
                      active: 'bg-green-100 text-green-800',
                      trial: 'bg-yellow-100 text-yellow-800',
                      suspended: 'bg-red-100 text-red-800',
                      expired: 'bg-red-100 text-red-800',
                      cancelled: 'bg-gray-100 text-gray-800',
                    }[t.status]

                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-gray-800">
                            {t.nombre_comercial}
                          </div>
                          <div className="text-xs text-gray-400">{t.email_contacto}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={t.plan_id}
                            onChange={(e) => handleCambiarPlan(t, e.target.value)}
                            disabled={accionando === t.id}
                            className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800 uppercase border-none cursor-pointer hover:bg-blue-200 transition disabled:opacity-50"
                          >
                            <option value="basico">BÁSICO</option>
                            <option value="pro">PRO</option>
                            <option value="premium">PREMIUM</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded uppercase ${estadoColor}`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {dias !== null ? (
                            <span
                              className={
                                dias < 0
                                  ? 'text-red-600 font-bold'
                                  : dias <= 7
                                    ? 'text-yellow-600 font-semibold'
                                    : 'text-gray-600'
                              }
                            >
                              {dias < 0 ? `Vencido hace ${Math.abs(dias)}d` : `${dias} días`}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                          {t.total_ventas}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-800 font-semibold">
                          ${Number(t.total_facturado).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {t.status === 'trial' && (
                              <button
                                onClick={() => handleExtenderTrial(t)}
                                disabled={accionando === t.id}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                title="Extender trial 30 días"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                            {t.status === 'suspended' ? (
                              <button
                                onClick={() => handleCambiarEstado(t)}
                                disabled={accionando === t.id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                title="Reactivar"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCambiarEstado(t)}
                                disabled={accionando === t.id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                title="Suspender"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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