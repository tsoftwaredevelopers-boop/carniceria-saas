'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Beef, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const PLANES = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: 1990,
    features: ['Hasta 100 productos', '2 usuarios', 'POS completo'],
  },
  {
    id: 'pro',
    nombre: 'Profesional',
    precio: 3990,
    features: ['Hasta 500 productos', '5 usuarios', 'Reportes avanzados'],
    destacado: true,
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: 7990,
    features: ['Productos ilimitados', '15 usuarios', 'Soporte prioritario'],
  },
]

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [paso, setPaso] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formulario, setFormulario] = useState({
    nombre_comercial: '',
    email: '',
    password: '',
    confirmarPassword: '',
    telefono: '',
    direccion: '',
    ruc_nit: '',
    plan_id: 'pro',
  })

  function validarPaso1(): boolean {
    if (!formulario.nombre_comercial.trim()) {
      setError('Ingresá el nombre de la carnicería')
      return false
    }
    if (!formulario.email.trim() || !formulario.email.includes('@')) {
      setError('Ingresá un email válido')
      return false
    }
    if (formulario.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    if (formulario.password !== formulario.confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    return true
  }

  function handleContinuar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (validarPaso1()) {
      setPaso(2)
    }
  }

  async function handleRegistrar() {
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crear-tenant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            nombre_comercial: formulario.nombre_comercial,
            email: formulario.email,
            password: formulario.password,
            telefono: formulario.telefono || null,
            direccion: formulario.direccion || null,
            ruc_nit: formulario.ruc_nit || null,
            plan_id: formulario.plan_id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar')
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formulario.email,
        password: formulario.password,
      })

      if (loginError) {
        toast.success('¡Registro exitoso!', {
          description: 'Iniciá sesión con tus credenciales',
        })
        router.push('/login')
        return
      }

      toast.success('¡Bienvenido a Carnicería SaaS!', {
        description: 'Tenés 30 días de prueba gratis',
      })

      router.push('/pos')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setPaso(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-950 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Beef className="w-12 h-12 text-red-700" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Creá tu cuenta
          </h1>
          <p className="text-red-200">
            30 días de prueba gratis. Sin tarjeta de crédito.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  paso >= 1
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {paso > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span
                className={`text-sm font-medium ${paso >= 1 ? 'text-gray-800' : 'text-gray-400'}`}
              >
                Tus datos
              </span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  paso >= 2
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${paso >= 2 ? 'text-gray-800' : 'text-gray-400'}`}
              >
                Elegí tu plan
              </span>
            </div>
          </div>

          {paso === 1 && (
            <form onSubmit={handleContinuar} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la carnicería *
                </label>
                <input
                  type="text"
                  value={formulario.nombre_comercial}
                  onChange={(e) =>
                    setFormulario({ ...formulario, nombre_comercial: e.target.value })
                  }
                  placeholder="Ej: Carnicería Don Pepe"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario({ ...formulario, email: e.target.value })
                  }
                  placeholder="tucarniceria@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lo usarás para iniciar sesión
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formulario.password}
                    onChange={(e) =>
                      setFormulario({ ...formulario, password: e.target.value })
                    }
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña *
                  </label>
                  <input
                    type="password"
                    value={formulario.confirmarPassword}
                    onChange={(e) =>
                      setFormulario({ ...formulario, confirmarPassword: e.target.value })
                    }
                    placeholder="Repetí la contraseña"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formulario.telefono}
                    onChange={(e) =>
                      setFormulario({ ...formulario, telefono: e.target.value })
                    }
                    placeholder="+54 11 1234-5678"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC / NIT (opcional)
                  </label>
                  <input
                    type="text"
                    value={formulario.ruc_nit}
                    onChange={(e) =>
                      setFormulario({ ...formulario, ruc_nit: e.target.value })
                    }
                    placeholder="12345678901"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección (opcional)
                </label>
                <input
                  type="text"
                  value={formulario.direccion}
                  onChange={(e) =>
                    setFormulario({ ...formulario, direccion: e.target.value })
                  }
                  placeholder="Av. Principal #123, Ciudad"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition"
              >
                Continuar
              </button>
            </form>
          )}

          {paso === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Elegí tu plan
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Empezá gratis 30 días. Después pagás solo si te sirve.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANES.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormulario({ ...formulario, plan_id: plan.id })}
                    className={`relative text-left p-4 rounded-xl border-2 transition ${
                      formulario.plan_id === plan.id
                        ? 'border-red-600 bg-red-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.destacado && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                        RECOMENDADO
                      </div>
                    )}

                    {formulario.plan_id === plan.id && (
                      <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-red-700" />
                    )}

                    <h3 className="font-bold text-gray-800 mb-1">{plan.nombre}</h3>
                    <p className="text-2xl font-bold text-red-700 mb-3">
                      ${plan.precio.toLocaleString('es-AR')}
                      <span className="text-xs text-gray-500 font-normal">/mes</span>
                    </p>
                    <ul className="space-y-1.5">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-600 flex items-start gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Prueba gratis de 30 días.</strong> No te vamos a cobrar
                  nada hasta que termine el período. Podés cancelar cuando quieras.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  disabled={loading}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleRegistrar}
                  disabled={loading}
                  className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creando tu cuenta...
                    </>
                  ) : (
                    'Crear mi cuenta y empezar'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-red-200 text-sm mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/login"
            className="text-white font-semibold hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
