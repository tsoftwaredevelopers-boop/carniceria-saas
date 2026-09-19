'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Producto } from '@/components/pos/BuscadorProducto'
import { Scan, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onSelectProducto: (producto: Producto) => void
}

export function BuscadorCodigoBarras({ onSelectProducto }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState<'idle' | 'success' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus automático al montar y cada vez que se pierde el focus
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return

    const codigoLimpio = codigo.trim()

    // Buscar producto por código de barras
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, precio_venta_kg, stock_actual, stock_minimo, unidad_medida, categoria_id, codigo_barras')
      .eq('codigo_barras', codigoLimpio)
      .eq('activo', true)
      .maybeSingle()

    if (error) {
      console.error(error)
      setEstado('error')
      setMensaje('Error al buscar')
      toast.error('Error al buscar producto')
      setCodigo('')
      setTimeout(() => setEstado('idle'), 2000)
      return
    }

    if (!data) {
      setEstado('error')
      setMensaje(`No encontrado: ${codigoLimpio}`)
      toast.error('Producto no encontrado', {
        description: `Código: ${codigoLimpio}`,
      })
      setCodigo('')
      setTimeout(() => setEstado('idle'), 2000)
      return
    }

    if (data.stock_actual <= 0) {
      setEstado('error')
      setMensaje(`Sin stock: ${data.nombre}`)
      toast.error('Producto sin stock', {
        description: `${data.nombre} no tiene stock disponible`,
      })
      setCodigo('')
      setTimeout(() => setEstado('idle'), 2000)
      return
    }

    // Agregar al carrito
    onSelectProducto(data as Producto)
    setEstado('success')
    setMensaje(`✓ ${data.nombre}`)
    toast.success('Producto agregado', {
      description: data.nombre,
      duration: 1500,
    })
    setCodigo('')

    // Volver al estado idle después de 1.5s
    setTimeout(() => setEstado('idle'), 1500)

    // Refocus para el siguiente escaneo
    inputRef.current?.focus()
  }

  return (
    <div className="p-4 bg-gray-50 border-b">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Scan className="w-5 h-5 text-gray-400" />
          </div>
            <input
              ref={inputRef}
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
              placeholder="🔍 Escanear código de barras o escribir y presionar Enter..."
              autoComplete="off"
              className={`w-full pl-11 pr-24 py-3 border-2 rounded-lg outline-none transition font-mono ${
                estado === 'success'
                  ? 'border-green-500 bg-green-50'
                  : estado === 'error'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
              }`}
            />
          {/* Indicador de estado */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {estado === 'success' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-xs text-green-700 font-medium max-w-[150px] truncate">
                  {mensaje}
                </span>
              </>
            )}
            {estado === 'error' && (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-xs text-red-700 font-medium max-w-[150px] truncate">
                  {mensaje}
                </span>
              </>
            )}
            {estado === 'idle' && (
              <span className="text-xs text-gray-400">Enter ↵</span>
            )}
          </div>
        </div>
      </form>
      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        💡 Tip: Escanea el código con el lector o escríbelo manualmente y presiona
        <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">Enter</kbd>
      </p>
    </div>
  )
}