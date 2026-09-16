'use client'

import { useEffect, useState } from 'react'
import { useTurno } from '@/hooks/useTurno'
import {
  CircleDollarSign,
  Lock,
  Unlock,
  Loader2,
  TrendingUp,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export default function TurnosPage() {
  const {
    turnoActivo,
    loading,
    abrirCaja,
    cerrarCaja,
    obtenerEstadisticasTurno,
    recargar,
  } = useTurno()

  const [montoInicial, setMontoInicial] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // Estadísticas del turno activo
  const [stats, setStats] = useState<any>(null)

  // Formulario de cierre
  const [mostrarCierre, setMostrarCierre] = useState(false)
  const [montoDeclarado, setMontoDeclarado] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [resultadoCierre, setResultadoCierre] = useState<any>(null)

  // Cargar stats cuando hay turno activo
  useEffect(() => {
    if (turnoActivo) {
      obtenerEstadisticasTurno().then(setStats)
    } else {
      setStats(null)
    }
  }, [turnoActivo, obtenerEstadisticasTurno])

  async function handleAbrirCaja(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setProcesando(true)

    try {
      const monto = parseFloat(montoInicial) || 0
      if (monto < 0) throw new Error('El monto no puede ser negativo')

      await abrirCaja(monto)
      setMontoInicial('')
      setExito('✅ Caja abierta correctamente')
      setTimeout(() => setExito(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  async function handleCerrarCaja(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setProcesando(true)

    try {
      const declarado = parseFloat(montoDeclarado) || 0
      const resultado = await cerrarCaja({
        montoEfectivo: declarado,
        montoTarjeta: stats?.tarjeta || 0,
        montoTransferencia: stats?.transferencia || 0,
        montoDeclarado: declarado,
        observaciones,
      })

      setResultadoCierre(resultado)
      setMostrarCierre(false)
      setMontoDeclarado('')
      setObservaciones('')
      setStats(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    )
  }

  // ============================================================
  // VISTA 1: CAJA CERRADA → ABRIR CAJA
  // ============================================================
  if (!turnoActivo && !resultadoCierre) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Lock className="w-8 h-8 text-red-700" />
              Caja Cerrada
            </h1>
            <p className="text-gray-500 mt-1">
              Abre la caja para comenzar a registrar ventas del día
            </p>
          </div>

          {/* Card de apertura */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <Unlock className="w-7 h-7 text-red-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Apertura de Caja</h2>
                <p className="text-sm text-gray-500">
                  Registra el monto inicial en efectivo con el que comienzas el día
                </p>
              </div>
            </div>

            <form onSubmit={handleAbrirCaja} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto inicial en efectivo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value.replace(',', '.'))}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-2xl font-mono text-right"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Este es el fondo fijo para dar cambio a los clientes
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {exito && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{exito}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={procesando}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition text-lg"
              >
                {procesando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Abriendo...
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    Abrir Caja
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // VISTA 2: RESULTADO DE CIERRE (después de cerrar)
  // ============================================================
  if (resultadoCierre) {
    const { turno, totales, efectivoEsperado, diferencia } = resultadoCierre
    const cuadra = Math.abs(diferencia) < 0.01

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  cuadra ? 'bg-green-100' : 'bg-yellow-100'
                }`}
              >
                {cuadra ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Caja Cerrada</h1>
              <p className="text-gray-500 mt-2">
                Corte Z generado el {new Date().toLocaleDateString('es-AR')} a las{' '}
                {new Date().toLocaleTimeString('es-AR')}
              </p>
            </div>

            {/* Resumen por método de pago */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="w-4 h-4 text-green-700" />
                  <span className="text-xs font-semibold text-green-700 uppercase">Efectivo</span>
                </div>
                <p className="text-2xl font-bold text-green-800 font-mono">
                  ${totales.efectivo.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-semibold text-blue-700 uppercase">Tarjeta</span>
                </div>
                <p className="text-2xl font-bold text-blue-800 font-mono">
                  ${totales.tarjeta.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-semibold text-purple-700 uppercase">Transf.</span>
                </div>
                <p className="text-2xl font-bold text-purple-800 font-mono">
                  ${totales.transferencia.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Conciliación de caja */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monto inicial:</span>
                <span className="font-mono">${turno.monto_inicial.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">+ Ventas en efectivo:</span>
                <span className="font-mono">${totales.efectivo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Efectivo esperado:</span>
                <span className="font-mono">${efectivoEsperado.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monto declarado:</span>
                <span className="font-mono">${turno.monto_final_efectivo?.toLocaleString()}</span>
              </div>
              <div
                className={`flex justify-between border-t pt-2 font-bold text-lg ${
                  cuadra ? 'text-green-700' : 'text-yellow-700'
                }`}
              >
                <span>{cuadra ? '✓ Cuadra perfecto' : diferencia > 0 ? '↑ Sobrante' : '↓ Faltante'}:</span>
                <span className="font-mono">
                  {diferencia > 0 ? '+' : ''}${diferencia.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total del turno */}
            <div className="bg-red-900 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 text-sm">Total vendido</p>
                  <p className="text-3xl font-bold font-mono">
                    ${(totales.efectivo + totales.tarjeta + totales.transferencia).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-200 text-sm">Ventas</p>
                  <p className="text-2xl font-bold">{totales.cantidadVentas || 0}</p>
                </div>
              </div>
            </div>

            {/* Botón */}
            <button
              onClick={() => setResultadoCierre(null)}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition"
            >
              Nueva Apertura de Caja
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // VISTA 3: CAJA ABIERTA → MOSTRAR ESTADO Y CERRAR
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <CircleDollarSign className="w-8 h-8 text-green-600" />
              Caja Abierta
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Desde: {new Date(turnoActivo!.fecha_apertura).toLocaleString('es-AR')}
            </p>
          </div>
          <button
            onClick={recargar}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2 rounded border"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Estadísticas del turno */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Ventas</span>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.cantidadVentas}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-green-600 uppercase">Efectivo</span>
                <Banknote className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                ${stats.efectivo.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-600 uppercase">Tarjeta</span>
                <CreditCard className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                ${stats.tarjeta.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-600 uppercase">Transf.</span>
                <ArrowRightLeft className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                ${stats.transferencia.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Total del día */}
        {stats && (
          <div className="bg-gradient-to-br from-red-900 to-red-800 text-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm mb-1">Total vendido hoy</p>
                <p className="text-4xl font-bold font-mono">${stats.total.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-red-200 text-sm mb-1">Efectivo esperado en caja</p>
                <p className="text-2xl font-bold font-mono">
                  ${(stats.efectivoEsperado || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de cierre */}
        {!mostrarCierre ? (
          <button
            onClick={() => setMostrarCierre(true)}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition text-lg shadow-lg"
          >
            <Lock className="w-5 h-5" />
            Cerrar Caja (Corte Z)
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-yellow-600" />
              Cerrar Caja
            </h2>

            <form onSubmit={handleCerrarCaja} className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  💡 Ingresa el monto de efectivo que tienes <strong>físicamente</strong> en la caja.
                  El sistema calculará la diferencia automáticamente.
                </p>
              </div>

              {stats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Efectivo esperado:</span>
                    <span className="font-mono font-semibold">
                      ${(stats.efectivoEsperado || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Efectivo físico en caja *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={montoDeclarado}
                    onChange={(e) => setMontoDeclarado(e.target.value.replace(',', '.'))}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-2xl font-mono text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Faltante por error en vuelto, etc."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
                />
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
                  onClick={() => {
                    setMostrarCierre(false)
                    setMontoDeclarado('')
                    setObservaciones('')
                  }}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {procesando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cerrando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Confirmar Cierre
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}