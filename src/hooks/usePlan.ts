import { useAuthStore } from '@/store/useAuthStore'
import { MODULOS_POR_PLAN, type Modulo, type PlanKey } from '@/lib/planesConfig'

export function usePlan() {
  const empresa = useAuthStore((s) => s.empresa)
  const plan = (empresa?.plan ?? 'preventista') as PlanKey
  const modulos = MODULOS_POR_PLAN[plan] ?? MODULOS_POR_PLAN.preventista

  return {
    plan,
    tieneModulo: (modulo: Modulo): boolean => modulos.includes(modulo),
  }
}
