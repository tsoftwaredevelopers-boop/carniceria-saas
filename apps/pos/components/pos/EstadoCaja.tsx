'use client'

import Link from 'next/link'
import { useTurno } from '@/hooks/useTurno'
import { CircleDollarSign, Lock, Loader2 } from 'lucide-react'

export function EstadoCaja() {
  const { turnoActivo, loading } = useTurno()

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-red-200">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Cargando...</span>
      </div>
    )
  }

  const cajaAbierta = !!turnoActivo

  return (
    <Link
      href="/turnos"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
        cajaAbierta
          ? 'bg-green-600/20 hover:bg-green-600/30 border border-green-500/30'
          : 'bg-red-800/50 hover:bg-red-800 border border-red-700'
      }`}
    >
      {cajaAbierta ? (
        <>
          <CircleDollarSign className="w-4 h-4 text-green-400" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-green-300">Caja Abierta</span>
            <span className="text-[10px] text-green-200/70">
              Desde: {new Date(turnoActivo.fecha_apertura).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </>
      ) : (
        <>
          <Lock className="w-4 h-4 text-red-300" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-red-100">Caja Cerrada</span>
            <span className="text-[10px] text-red-200/70">Click para abrir</span>
          </div>
        </>
      )}
    </Link>
  )
}