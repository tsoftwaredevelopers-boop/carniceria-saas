import { create } from 'zustand'

export interface ItemCarrito {
  producto_id: string
  producto_nombre: string
  peso: number          // en kg
  precio_unitario: number // precio por kg
  subtotal: number
}

interface CarritoState {
  items: ItemCarrito[]
  descuento: number
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  montoEfectivo: number
  montoTarjeta: number
  montoTransferencia: number

  agregarItem: (item: Omit<ItemCarrito, 'subtotal'>) => void
  actualizarPeso: (producto_id: string, nuevoPeso: number) => void
  eliminarItem: (producto_id: string) => void
  limpiarCarrito: () => void
  setDescuento: (descuento: number) => void
  setMetodoPago: (metodo: CarritoState['metodoPago']) => void
  setMontos: (montos: Partial<Pick<CarritoState, 'montoEfectivo' | 'montoTarjeta' | 'montoTransferencia'>>) => void

  calcularSubtotal: () => number
  calcularTotal: () => number
}

export const useCarritoStore = create<CarritoState>((set, get) => ({
  items: [],
  descuento: 0,
  metodoPago: 'efectivo',
  montoEfectivo: 0,
  montoTarjeta: 0,
  montoTransferencia: 0,

  agregarItem: (item) => {
    const subtotal = item.peso * item.precio_unitario
    set((state) => {
      // Si ya existe el producto, sumamos el peso
      const existente = state.items.find(i => i.producto_id === item.producto_id)
      if (existente) {
        return {
          items: state.items.map(i =>
            i.producto_id === item.producto_id
              ? {
                  ...i,
                  peso: i.peso + item.peso,
                  subtotal: (i.peso + item.peso) * i.precio_unitario,
                }
              : i
          ),
        }
      }
      return {
        items: [...state.items, { ...item, subtotal }],
      }
    })
  },

  actualizarPeso: (producto_id, nuevoPeso) => {
    set((state) => ({
      items: state.items.map(i =>
        i.producto_id === producto_id
          ? { ...i, peso: nuevoPeso, subtotal: nuevoPeso * i.precio_unitario }
          : i
      ),
    }))
  },

  eliminarItem: (producto_id) => {
    set((state) => ({
      items: state.items.filter(i => i.producto_id !== producto_id),
    }))
  },

  limpiarCarrito: () => {
    set({
      items: [],
      descuento: 0,
      metodoPago: 'efectivo',
      montoEfectivo: 0,
      montoTarjeta: 0,
      montoTransferencia: 0,
    })
  },

  setDescuento: (descuento) => set({ descuento }),
  setMetodoPago: (metodoPago) => set({ metodoPago }),
  setMontos: (montos) => set(montos),

  calcularSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.subtotal, 0)
  },

  calcularTotal: () => {
    const subtotal = get().calcularSubtotal()
    return Math.max(0, subtotal - get().descuento)
  },
}))