'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null)
  const [tenantNombre, setTenantNombre] = useState<string>('')

  useEffect(() => {
    async function cargarUsuario() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre, rol, tenants(nombre_comercial)')
        .eq('id', user.id)
        .single()

      if (usuarioData) {
        setUsuario({ nombre: usuarioData.nombre, rol: usuarioData.rol })
        // @ts-ignore
        setTenantNombre(usuarioData.tenants?.nombre_comercial || '')
      }

      setLoading(false)
    }
    cargarUsuario()
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    )
  }

  const menuItems = [
    { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
    { href: '/productos', label: 'Productos', icon: Package },
    { href: '/ventas', label: 'Ventas', icon: Receipt },
    { href: '/turnos', label: 'Turnos / Caja', icon: Wallet },
    { href: '/mermas', label: 'Mermas', icon: Trash2 },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-red-900 text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Beef className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Carnicería</h1>
              <p className="text-xs text-red-200 truncate max-w-[140px]">
                {tenantNombre || 'SaaS'}
              </p>
            </div>
          </div>
        </div>
        {/* Estado de Caja */}
        <div className="p-4 border-b border-red-800">
          <EstadoCaja />
        </div>

        {/* Menu */}
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

        {/* User Footer */}
        <div className="p-4 border-t border-red-800">
          <div className="mb-3">
            <p className="text-sm font-semibold">{usuario?.nombre}</p>
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}