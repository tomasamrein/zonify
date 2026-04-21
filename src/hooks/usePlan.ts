import { useAuthStore } from '@/store/useAuthStore'
import { MODULOS_POR_PLAN, normalizarPlan, type Modulo } from '@/lib/planesConfig'

export function usePlan() {
  const empresa = useAuthStore((s) => s.empresa)
  const plan = normalizarPlan(empresa?.plan)
  const modulos = MODULOS_POR_PLAN[plan]

  return {
    plan,
    tieneModulo: (modulo: Modulo): boolean => modulos.includes(modulo),
  }
}
