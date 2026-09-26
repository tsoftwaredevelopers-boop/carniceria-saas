'use client'

import { useState } from 'react'
import { BuscadorProducto, Producto } from '@/components/pos/BuscadorProducto'
import { CarritoVenta } from '@/components/pos/CarritoVenta'
import { useCarritoStore } from '@/stores/carritoStore'
import { useTurno } from '@/hooks/useTurno'
import { createClient } from '@/lib/supabase/client'
import { BuscadorCodigoBarras } from '@/components/pos/BuscadorCodigoBarras'
import { useSupabase } from '@/hooks/useSupabase'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { TicketVenta } from '@/components/pos/TicketVenta'

export default function POSPage() {
  const supabase = useSupabase()
  const { turnoActivo, loading: loadingTurno } = useTurno()
  const {
    items,
    agregarItem,
    limpiarCarrito,
    calcularTotal,
    metodoPago,
    montoEfectivo,
    montoTarjeta,
    montoTransferencia,
  } = useCarritoStore()

  const [procesando, setProcesando] = useState(false)
  const [ventaParaTicket, setVentaParaTicket] = useState<any>(null)

  function handleSelectProducto(producto: Producto) {
    agregarItem({
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      peso: 1,
      precio_unitario: producto.precio_venta_kg,
    })
  }

  async function handleCobrar() {
    if (items.length === 0) return
    if (!turnoActivo) {
      alert('❌ Debes abrir la caja antes de vender')
      return
    }

    setProcesando(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!usuarioData) throw new Error('Usuario no encontrado')

      const tenantId = usuarioData.tenant_id
      const total = calcularTotal()

      // 1. Generar número de venta
      const { data: numeroData, error: numError } = await supabase
        .rpc('generar_numero_venta', { p_tenant_id: tenantId })

      if (numError) throw numError
      const numeroVenta = numeroData as number

      // 2. Insertar cabecera de venta CON turno_id
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          tenant_id: tenantId,
          numero_venta: numeroVenta,
          usuario_id: user.id,
          turno_id: turnoActivo.id,
          subtotal: calcularTotal(),
          total: total,
          metodo_pago: metodoPago,
          monto_efectivo: metodoPago === 'efectivo' || metodoPago === 'mixto' ? total : 0,
          monto_tarjeta: metodoPago === 'tarjeta' ? total : 0,
          monto_transferencia: metodoPago === 'transferencia' ? total : 0,
        })
        .select()
        .single()

      if (ventaError) throw ventaError

      // 3. Insertar detalle de venta
      const detalles = items.map((item) => ({
        tenant_id: tenantId,
        venta_id: ventaData.id,
        producto_id: item.producto_id,
        producto_nombre: item.producto_nombre,
        peso: item.peso,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }))

      const { error: detalleError } = await supabase
        .from('detalle_ventas')
        .insert(detalles)

      if (detalleError) throw detalleError

      // Guardar los datos del ticket para mostrarlo en el modal
      setVentaParaTicket({
        numeroVenta,
        fecha: new Date().toLocaleString('es-AR'),
        cajero: user.email || 'Cajero',
        tenant: {
          nombre_comercial: 'Carnicería Don Pepe', // TODO: Cargar dinámicamente
          direccion: 'Av. Principal #123',
          telefono: '+54 11 1234-5678',
          ruc_nit: '12345678901',
        },
        items: [...items],
        subtotal: calcularTotal(),
        descuento: 0,
        total,
        metodoPago,
        montoRecibido: montoEfectivo,
        cambio: montoEfectivo > total ? montoEfectivo - total : 0,
      })

      limpiarCarrito()
    } catch (error: any) {
      console.error(error)
      alert(`❌ Error al procesar la venta:\n${error.message}`)
    } finally {
      setProcesando(false)
    }
  }

  // Pantalla de bloqueo si la caja está cerrada
  if (!loadingTurno && !turnoActivo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Caja Cerrada</h1>
          <p className="text-gray-500 mb-8">
            Para comenzar a vender, primero debes abrir la caja del día.
          </p>
          <Link
            href="/turnos"
            className="inline-flex items-center justify-center gap-2 w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition"
          >
            <Lock className="w-5 h-5" />
            Ir a Abrir Caja
          </Link>
        </div>
      </div>
    )
  }

  if (loadingTurno) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando estado de caja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      {/* Buscador - izquierda */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-red-900 text-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🥩 Punto de Venta</h1>
            <p className="text-sm text-red-200">Selecciona los cortes para la venta</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-red-200">Caja abierta</p>
          </div>
        </div>
        <BuscadorCodigoBarras onSelectProducto={handleSelectProducto} />
        <BuscadorProducto onSelectProducto={handleSelectProducto} />
          {ventaParaTicket && (
          <TicketVenta
            venta={ventaParaTicket}
            onClose={() => setVentaParaTicket(null)}
          />
        )}
      </div>

      {/* Carrito - derecha */}
      <div className="w-96">
        <CarritoVenta onCobrar={handleCobrar} />
      </div>
    </div>
  )
}
