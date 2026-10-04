'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/hooks/useSupabase'
import {
  Beef,
  ShoppingCart,
  Package,
  Receipt,
  Wallet,
  Trash2,
  LogOut,
  Loader2,
} from 'lucide-react'
import { EstadoCaja } from '@/components/pos/EstadoCaja'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null)
  const [tenantNombre, setTenantNombre] = useState<string>('')

  // Marcar como montado cuando el cliente se hidrate
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          nombre,
          rol,
          tenant_id,
          tenants (nombre_comercial)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error cargando usuario:', error)
        setLoading(false)
        return
      }

      if (data) {
        setUsuario({ nombre: data.nombre, rol: data.rol })
        // @ts-ignore
        setTenantNombre(data.tenants?.nombre_comercial || '')

        // Si es super_admin, redirigir a /admin
        if (data.rol === 'super_admin') {
          if (pathname !== '/admin') {
            router.push('/admin')
          }
          setLoading(false)
          return
        }

        // Si es cliente normal, verificar suscripción
        const { data: sub, error: errorSub } = await supabase.rpc(
          'verificar_suscripcion',
          { p_tenant_id: data.tenant_id }
        )

        if (errorSub) {
          console.error('Error verificando suscripción:', errorSub)
        }

        const suscripcion = sub as any

        if (suscripcion && !suscripcion.activo) {
          if (pathname !== '/suscripcion-vencida') {
            router.push('/suscripcion-vencida')
          }
          setLoading(false)
          return
        }
      }

      setLoading(false)
    }

    verificar()
  }, [router, supabase, pathname])

    async function handleLogout() {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Error cerrando sesión:', err)
      }
      // Redirigir y recargar para limpiar estado
      router.push('/login')
      router.refresh()
    }

  // No renderizar hasta que el cliente esté montado
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  const esSuperAdmin = usuario?.rol === 'super_admin'

  const menuItems = esSuperAdmin
    ? [{ href: '/admin', label: 'Panel de Administración', icon: Package }]
    : [
        { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
        { href: '/productos', label: 'Productos', icon: Package },
        { href: '/ventas', label: 'Ventas', icon: Receipt },
        { href: '/turnos', label: 'Turnos / Caja', icon: Wallet },
        { href: '/mermas', label: 'Mermas', icon: Trash2 },
      ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-red-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Beef className="w-6 h-6 text-red-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm leading-tight truncate">
                {esSuperAdmin ? 'Carnicería SaaS' : (tenantNombre || 'Carnicería SaaS')}
              </h1>
              <p className="text-xs text-red-200">
                {esSuperAdmin ? 'Panel Admin' : 'Sistema POS'}
              </p>
            </div>
          </div>
        </div>

        {!esSuperAdmin && (
          <div className="p-4 border-b border-red-800">
            <EstadoCaja />
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-red-700 font-semibold'
                    : 'hover:bg-red-800 text-red-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-red-800">
          <div className="mb-3">
            <p className="text-sm font-semibold truncate">{usuario?.nombre}</p>
            <p className="text-xs text-red-200 capitalize">{usuario?.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-700 px-4 py-2 rounded-lg transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
