'use client'

import { Printer, X } from 'lucide-react'
import { ItemCarrito } from '@/stores/carritoStore'

interface VentaData {
  numeroVenta: number
  fecha: string
  cajero: string
  tenant: {
    nombre_comercial: string
    direccion?: string | null
    telefono?: string | null
    ruc_nit?: string | null
  }
  items: ItemCarrito[]
  subtotal: number
  descuento: number
  total: number
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  montoRecibido?: number
  cambio?: number
}

interface Props {
  venta: VentaData
  onClose: () => void
}

export function TicketVenta({ venta, onClose }: Props) {
  function handleImprimir() {
    // Abrir ventana nueva
    const ventana = window.open('', '_blank', 'width=400,height=600')
    if (!ventana) {
      alert('Por favor, permite las ventanas emergentes para imprimir el ticket')
      return
    }

    // Escribir el HTML del ticket
    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Ticket #${venta.numeroVenta}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 5mm;
            color: #000;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .separator {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .separator-double {
            border-top: 2px solid #000;
            margin: 8px 0;
          }
          .line {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .item {
            margin-bottom: 6px;
          }
          .item-name {
            font-weight: bold;
            text-transform: uppercase;
          }
          .item-detail {
            font-size: 10px;
            display: flex;
            justify-content: space-between;
            padding-left: 8px;
          }
          .total-line {
            font-size: 16px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
          }
          .footer {
            font-size: 10px;
            margin-top: 12px;
            text-align: center;
          }
          h1 { font-size: 16px; margin-bottom: 4px; }
          h2 { font-size: 12px; margin-bottom: 8px; font-weight: normal; }
          @media print {
            body { margin: 0; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <h1>${venta.tenant.nombre_comercial}</h1>
          ${venta.tenant.direccion ? `<div>${venta.tenant.direccion}</div>` : ''}
          ${venta.tenant.telefono ? `<div>Tel: ${venta.tenant.telefono}</div>` : ''}
          ${venta.tenant.ruc_nit ? `<div>RUC/NIT: ${venta.tenant.ruc_nit}</div>` : ''}
        </div>

        <div class="separator-double"></div>

        <div class="line">
          <span class="bold">Ticket #${venta.numeroVenta}</span>
          <span>${venta.fecha}</span>
        </div>
        <div class="line">
          <span>Cajero:</span>
          <span>${venta.cajero}</span>
        </div>

        <div class="separator"></div>

        ${venta.items
          .map(
            (item) => `
          <div class="item">
            <div class="item-name">${item.producto_nombre}</div>
            <div class="item-detail">
              <span>${item.peso.toFixed(3)} kg × $${item.precio_unitario.toLocaleString('es-AR')}/kg</span>
              <span class="bold">$${item.subtotal.toLocaleString('es-AR')}</span>
            </div>
          </div>
        `
          )
          .join('')}

        <div class="separator"></div>

        <div class="line">
          <span>SUBTOTAL</span>
          <span>$${venta.subtotal.toLocaleString('es-AR')}</span>
        </div>

        ${
          venta.descuento > 0
            ? `
          <div class="line">
            <span>DESCUENTO</span>
            <span>-$${venta.descuento.toLocaleString('es-AR')}</span>
          </div>
        `
            : ''
        }

        <div class="separator-double"></div>

        <div class="total-line">
          <span>TOTAL</span>
          <span>$${venta.total.toLocaleString('es-AR')}</span>
        </div>

        <div class="separator-double"></div>

        <div class="line">
          <span>PAGO:</span>
          <span class="bold">${venta.metodoPago.toUpperCase()}</span>
        </div>

        ${
          venta.metodoPago === 'efectivo' && venta.montoRecibido
            ? `
          <div class="line">
            <span>RECIBIDO:</span>
            <span>$${venta.montoRecibido.toLocaleString('es-AR')}</span>
          </div>
          <div class="line">
            <span>CAMBIO:</span>
            <span>$${(venta.cambio || 0).toLocaleString('es-AR')}</span>
          </div>
        `
            : ''
        }

        <div class="separator-double"></div>

        <div class="footer">
          ¡Gracias por su compra!<br>
          Vuelva pronto<br>
          <br>
          ${new Date().toLocaleString('es-AR')}
        </div>
      </body>
      </html>
    `)

    ventana.document.close()

    // Esperar a que cargue y luego imprimir
    ventana.onload = () => {
      ventana.focus()
      ventana.print()
      // Opcional: cerrar después de imprimir
      // ventana.onafterprint = () => ventana.close()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header del modal */}
        <div className="bg-red-900 text-white p-4 flex items-center justify-between sticky top-0">
          <h2 className="text-lg font-bold">✅ Venta registrada</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview del ticket */}
        <div className="p-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded p-4 font-mono text-xs">
            {/* Encabezado */}
            <div className="text-center mb-3">
              <div className="font-bold text-base">{venta.tenant.nombre_comercial}</div>
              {venta.tenant.direccion && <div className="text-gray-600">{venta.tenant.direccion}</div>}
              {venta.tenant.telefono && <div className="text-gray-600">Tel: {venta.tenant.telefono}</div>}
            </div>

            <div className="border-t-2 border-gray-400 my-3"></div>

            <div className="flex justify-between mb-1">
              <span className="font-bold">Ticket #{venta.numeroVenta}</span>
              <span>{venta.fecha}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span>Cajero:</span>
              <span>{venta.cajero}</span>
            </div>

            <div className="border-t border-dashed border-gray-400 my-3"></div>

            {/* Items */}
            {venta.items.map((item, idx) => (
              <div key={idx} className="mb-3">
                <div className="font-bold">{item.producto_nombre}</div>
                <div className="flex justify-between pl-2 text-gray-600">
                  <span>
                    {item.peso.toFixed(3)} kg × ${item.precio_unitario.toLocaleString('es-AR')}/kg
                  </span>
                  <span className="font-bold text-black">
                    ${item.subtotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))}

            <div className="border-t border-dashed border-gray-400 my-3"></div>

            <div className="flex justify-between mb-1">
              <span>SUBTOTAL</span>
              <span>${venta.subtotal.toLocaleString('es-AR')}</span>
            </div>

            {venta.descuento > 0 && (
              <div className="flex justify-between mb-1 text-red-600">
                <span>DESCUENTO</span>
                <span>-${venta.descuento.toLocaleString('es-AR')}</span>
              </div>
            )}

            <div className="border-t-2 border-gray-400 my-3"></div>

            <div className="flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span>${venta.total.toLocaleString('es-AR')}</span>
            </div>

            <div className="border-t-2 border-gray-400 my-3"></div>

            <div className="flex justify-between">
              <span>PAGO:</span>
              <span className="font-bold uppercase">{venta.metodoPago}</span>
            </div>

            {venta.metodoPago === 'efectivo' && venta.montoRecibido && (
              <>
                <div className="flex justify-between">
                  <span>RECIBIDO:</span>
                  <span>${venta.montoRecibido.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>CAMBIO:</span>
                  <span>${(venta.cambio || 0).toLocaleString('es-AR')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="p-4 border-t bg-gray-50 flex gap-2 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleImprimir}
            className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}