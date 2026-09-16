import { create } from 'zustand'

export interface Turno {
  id: string
  tenant_id: string
  usuario_id: string
  fecha_apertura: string
  fecha_cierre: string | null
  monto_inicial: number
  monto_final_efectivo: number | null
  monto_final_tarjeta: number | null
  monto_final_transferencia: number | null
  diferencia: number | null
  estado: 'abierto' | 'cerrado'
  observaciones: string | null
}

interface TurnoState {
  turnoActivo: Turno | null
  loading: boolean
  setTurnoActivo: (turno: Turno | null) => void
  setLoading: (loading: boolean) => void
  limpiarTurno: () => void
}

export const useTurnoStore = create<TurnoState>((set) => ({
  turnoActivo: null,
  loading: true,
  setTurnoActivo: (turno) => set({ turnoActivo: turno }),
  setLoading: (loading) => set({ loading }),
  limpiarTurno: () => set({ turnoActivo: null }),
}))