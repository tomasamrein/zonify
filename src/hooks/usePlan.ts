import { useAuthStore } from '@/store/useAuthStore'
import { MODULOS_POR_PLAN, LIMITES_POR_PLAN, normalizarPlan, type Modulo, type PlanLimites } from '@/lib/planesConfig'

export function usePlan() {
  const empresa = useAuthStore((s) => s.empresa)
  const plan = normalizarPlan(empresa?.plan)
  const modulos = MODULOS_POR_PLAN[plan]
  const limites = LIMITES_POR_PLAN[plan]

  function superaLimite(campo: keyof PlanLimites, valorActual: number): boolean {
    const max = limites[campo]
    if (max === null) return false
    return valorActual >= max
  }

  return {
    plan,
    limites,
    superaLimite,
    tieneModulo: (modulo: Modulo): boolean => modulos.includes(modulo),
  }
}
