'use client'

import { useState } from 'react'
import { useCarritoStore } from '@/stores/carritoStore'
import { Minus, Plus, Trash2, ShoppingCart, DollarSign } from 'lucide-react'

interface Props {
  onCobrar: () => void
}

export function CarritoVenta({ onCobrar }: Props) {
  const {
    items,
    descuento,
    metodoPago,
    montoEfectivo,
    agregarItem,
    actualizarPeso,
    eliminarItem,
    limpiarCarrito,
    setDescuento,
    setMetodoPago,
    setMontos,
    calcularSubtotal,
    calcularTotal,
  } = useCarritoStore()

  const [mostrarPago, setMostrarPago] = useState(false)

  const subtotal = calcularSubtotal()
  const total = calcularTotal()
  const cambio = montoEfectivo > total ? montoEfectivo - total : 0

  function handleIncrementar(producto_id: string, pesoActual: number) {
    actualizarPeso(producto_id, pesoActual + 0.1)
  }

  function handleDecrementar(producto_id: string, pesoActual: number) {
    const nuevo = pesoActual - 0.1
    if (nuevo <= 0) {
      eliminarItem(producto_id)
    } else {
      actualizarPeso(producto_id, nuevo)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white border-l shadow-xl">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-red-700" />
            Carrito ({items.length})
          </h2>
          {items.length > 0 && (
            <button
              onClick={limpiarCarrito}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">El carrito está vacío</p>
            <p className="text-xs mt-1">Selecciona un producto para comenzar</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.producto_id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-sm text-gray-800 flex-1">
                  {item.producto_nombre}
                </p>
                <button
                  onClick={() => eliminarItem(item.producto_id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleDecrementar(item.producto_id, item.peso)}
                  className="w-8 h-8 bg-white border rounded flex items-center justify-center hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  step="0.001"
                  value={item.peso}
                  onChange={(e) => actualizarPeso(item.producto_id, parseFloat(e.target.value) || 0)}
                  className="w-20 text-center border rounded py-1 text-sm font-mono"
                />
                <span className="text-xs text-gray-500">kg</span>
                <button
                  onClick={() => handleIncrementar(item.producto_id, item.peso)}
                  className="w-8 h-8 bg-white border rounded flex items-center justify-center hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  ${item.precio_unitario.toLocaleString()} × {item.peso.toFixed(3)} kg
                </span>
                <span className="font-bold text-red-700">
                  ${item.subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totales y Pago */}
      {items.length > 0 && (
        <div className="border-t p-4 bg-gray-50 space-y-3">
          {/* Descuento */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 flex-1">Descuento:</label>
            <input
              type="number"
              value={descuento || ''}
              onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-24 text-right border rounded px-2 py-1 text-sm"
            />
          </div>

          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-mono">${subtotal.toLocaleString()}</span>
          </div>

          {descuento > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Descuento:</span>
              <span className="font-mono">-${descuento.toLocaleString()}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center border-t pt-3">
            <span className="text-lg font-semibold">TOTAL:</span>
            <span className="text-2xl font-bold text-red-700 font-mono">
              ${total.toLocaleString()}
            </span>
          </div>

          {/* Botón Cobrar */}
          {!mostrarPago ? (
            <button
              onClick={() => setMostrarPago(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <DollarSign className="w-5 h-5" />
              Cobrar ${total.toLocaleString()}
            </button>
          ) : (
            <div className="space-y-3 bg-white p-3 rounded-lg border-2 border-green-500">
              <p className="font-semibold text-sm mb-2">Método de pago:</p>
              <div className="grid grid-cols-3 gap-2">
                {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetodoPago(m)}
                    className={`py-2 rounded text-xs font-medium capitalize transition ${
                      metodoPago === m
                        ? 'bg-red-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {metodoPago === 'efectivo' && (
                <>
                  <input
                    type="number"
                    placeholder="Monto recibido"
                    value={montoEfectivo || ''}
                    onChange={(e) => setMontos({ montoEfectivo: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2 text-right font-mono"
                  />
                  {cambio > 0 && (
                    <div className="flex justify-between text-sm bg-green-50 p-2 rounded">
                      <span>Cambio:</span>
                      <span className="font-bold text-green-700 font-mono">
                        ${cambio.toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarPago(false)}
                  className="flex-1 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={onCobrar}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}