'use client'

import { useState } from 'react'
import { BuscadorProducto, Producto } from '@/components/pos/BuscadorProducto'
import { CarritoVenta } from '@/components/pos/CarritoVenta'
import { useCarritoStore } from '@/stores/carritoStore'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner' // Si no lo tienes, quitamos esto después

export default function POSPage() {
  const supabase = createClient()
  const { items, agregarItem, limpiarCarrito, calcularTotal, metodoPago, montoEfectivo, montoTarjeta, montoTransferencia } = useCarritoStore()
  const [procesando, setProcesando] = useState(false)

  async function handleSelectProducto(producto: Producto) {
    // Agregar con peso por defecto de 1 kg
    agregarItem({
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      peso: 1,
      precio_unitario: producto.precio_venta_kg,
    })
  }

  async function handleCobrar() {
    if (items.length === 0) return
    setProcesando(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      // Obtener tenant_id del usuario
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

      // 2. Insertar cabecera de venta
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          tenant_id: tenantId,
          numero_venta: numeroVenta,
          usuario_id: user.id,
          subtotal: calcularTotal(),
          total: total,
          metodo_pago: metodoPago,
          monto_efectivo: montoEfectivo,
          monto_tarjeta: montoTarjeta,
          monto_transferencia: montoTransferencia,
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

      // 4. Éxito
      alert(`✅ Venta #${numeroVenta} registrada\nTotal: $${total.toLocaleString()}`)
      limpiarCarrito()
    } catch (error: any) {
      console.error(error)
      alert(`❌ Error al procesar la venta:\n${error.message}`)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="h-screen flex">
      {/* Buscador - izquierda */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-red-900 text-white">
          <h1 className="text-xl font-bold">🥩 Punto de Venta</h1>
          <p className="text-sm text-red-200">Selecciona los cortes para la venta</p>
        </div>
        <BuscadorProducto onSelectProducto={handleSelectProducto} />
      </div>

      {/* Carrito - derecha */}
      <div className="w-96">
        <CarritoVenta onCobrar={handleCobrar} />
      </div>
    </div>
  )
}