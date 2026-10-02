'use client'

import { DollarSign, ShoppingCart, TrendingUp, Banknote } from 'lucide-react'

interface Props {
  totalVendido: number
  cantidadVentas: number
  ticketPromedio: number
  totalEfectivo: number
  totalTarjeta: number
  totalTransferencia: number
}

export function TarjetasMetricas({
  totalVendido,
  cantidadVentas,
  ticketPromedio,
  totalEfectivo,
  totalTarjeta,
  totalTransferencia,
}: Props) {
  const tarjetas = [
    {
      titulo: 'Total Vendido',
      valor: `$${totalVendido.toLocaleString('es-AR')}`,
      icono: DollarSign,
      color: 'bg-green-100 text-green-700',
      colorIcono: 'text-green-600',
    },
    {
      titulo: 'Cantidad Ventas',
      valor: cantidadVentas.toString(),
      icono: ShoppingCart,
      color: 'bg-blue-100 text-blue-700',
      colorIcono: 'text-blue-600',
    },
    {
      titulo: 'Ticket Promedio',
      valor: `$${ticketPromedio.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`,
      icono: TrendingUp,
      color: 'bg-purple-100 text-purple-700',
      colorIcono: 'text-purple-600',
    },
    {
      titulo: 'Efectivo',
      valor: `$${totalEfectivo.toLocaleString('es-AR')}`,
      icono: Banknote,
      color: 'bg-yellow-100 text-yellow-700',
      colorIcono: 'text-yellow-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {tarjetas.map((tarjeta) => {
        const Icono = tarjeta.icono
        return (
          <div
            key={tarjeta.titulo}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${tarjeta.color}`}>
                <Icono className={`w-5 h-5 ${tarjeta.colorIcono}`} />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {tarjeta.titulo}
            </p>
            <p className="text-2xl font-bold text-gray-800 font-mono">{tarjeta.valor}</p>
          </div>
        )
      })}

      <div className="md:col-span-2 lg:col-span-4 bg-gray-50 rounded-lg p-4 flex flex-wrap gap-6 justify-around text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-gray-600">Tarjeta:</span>
          <span className="font-bold font-mono text-gray-800">
            ${totalTarjeta.toLocaleString('es-AR')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
          <span className="text-gray-600">Transferencia:</span>
          <span className="font-bold font-mono text-gray-800">
            ${totalTransferencia.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </div>
  )
}
