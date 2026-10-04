'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/hooks/useSupabase'
import { useSuscripcion } from '@/hooks/useSuscripcion'
import {
  AlertTriangle,
  MessageCircle,
  Mail,
  LogOut,
  Loader2,
  Clock,
  Ban,
  RefreshCw,
} from 'lucide-react'

const CONFIG_ESTADOS: Record<string, {
  icon: typeof AlertTriangle
  color: string
  titulo: string
  subtitulo: string
}> = {
  activo: {
    icon: AlertTriangle,
    color: 'bg-green-500',
    titulo: 'Cuenta Activa',
    subtitulo: 'Redirigiendo...',
  },
  trial: {
    icon: Clock,
    color: 'bg-blue-500',
    titulo: 'Período de Prueba',
    subtitulo: 'Estás en prueba gratuita',
  },
  gracia: {
    icon: Clock,
    color: 'bg-yellow-500',
    titulo: 'Período de Gracia',
    subtitulo: 'Tu suscripción venció pero estás en gracia',
  },
  suspendido: {
    icon: Ban,
    color: 'bg-red-500',
    titulo: 'Cuenta Suspendida',
    subtitulo: 'Tu cuenta ha sido suspendida por el administrador',
  },
  trial_vencido: {
    icon: Clock,
    color: 'bg-yellow-500',
    titulo: 'Período de Prueba Vencido',
    subtitulo: 'Tu prueba gratuita de 30 días ha terminado',
  },
  vencido: {
    icon: AlertTriangle,
    color: 'bg-orange-500',
    titulo: 'Suscripción Vencida',
    subtitulo: 'Tu período de pago ha expirado',
  },
  cancelado: {
    icon: Ban,
    color: 'bg-gray-500',
    titulo: 'Suscripción Cancelada',
    subtitulo: 'Cancelaste tu suscripción al sistema',
  },
  no_encontrado: {
    icon: AlertTriangle,
    color: 'bg-red-500',
    titulo: 'Cuenta No Encontrada',
    subtitulo: 'No pudimos encontrar tu carnicería',
  },
  desconocido: {
    icon: AlertTriangle,
    color: 'bg-gray-500',
    titulo: 'Estado Desconocido',
    subtitulo: 'Contactanos para más información',
  },
}

export default function SuscripcionVencidaPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const { suscripcion, loading, recargar } = useSuscripcion()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  // Si la suscripción se reactiva, redirigir al POS
  useEffect(() => {
    if (suscripcion?.activo) {
      router.push('/pos')
    }
  }, [suscripcion, router])

  async function handleLogout() {
    setCerrandoSesion(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-950">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Verificando tu suscripción...</p>
        </div>
      </div>
    )
  }

  const estado = suscripcion?.estado || 'desconocido'
  const mensaje = suscripcion?.mensaje || 'Tu suscripción no está activa'
  const configActual = CONFIG_ESTADOS[estado] || CONFIG_ESTADOS.desconocido
  const Icono = configActual.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-950 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className={`${configActual.color} p-8 text-center text-white`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icono className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{configActual.titulo}</h1>
            <p className="text-white/90">{configActual.subtitulo}</p>
          </div>

          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium">{mensaje}</p>
            </div>

            {suscripcion?.trial_ends_at && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-semibold">Tu prueba venció el:</span>{' '}
                {new Date(suscripcion.trial_ends_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            )}

            {suscripcion?.current_period_ends_at && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-semibold">Tu suscripción venció el:</span>{' '}
                {new Date(suscripcion.current_period_ends_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            )}

            <div className="mb-6">
              <h2 className="font-bold text-gray-800 mb-3">
                ¿Cómo reactivar tu cuenta?
              </h2>
              <div className="space-y-3">
                <a
                  href="https://wa.me/5491112345678?text=Hola,%20quiero%20reactivar%20mi%20cuenta%20de%20Carnicería%20SaaS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Contactar por WhatsApp</p>
                    <p className="text-xs text-green-700">
                      Respuesta rápida en horario comercial
                    </p>
                  </div>
                </a>

                <a
                  href="mailto:soporte@carniceria-saas.com?subject=Quiero reactivar mi cuenta&body=Hola, quiero reactivar mi cuenta de Carnicería SaaS."
                  className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Enviar email a soporte</p>
                    <p className="text-xs text-blue-700">soporte@carniceria-saas.com</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={recargar}
                className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar estado
              </button>
              <button
                onClick={handleLogout}
                disabled={cerrandoSesion}
                className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cerrandoSesion ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cerrando...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              💡 Una vez que reactives tu cuenta, podrás seguir usando el sistema
              inmediatamente.
            </p>
          </div>
        </div>

        <p className="text-center text-red-200 text-sm mt-6">
          © 2026 Carnicería SaaS — Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
