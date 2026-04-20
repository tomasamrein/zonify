import { Lock } from 'lucide-react'
import { PLANES_META, type PlanKey } from '@/lib/planesConfig'
import { Button } from './Button'
import { useNavigate } from 'react-router-dom'

interface Props {
  planRequerido: PlanKey
  descripcion?: string
}

export function ModuloBloqueado({ planRequerido, descripcion }: Props) {
  const navigate = useNavigate()
  const meta = PLANES_META[planRequerido]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-ink)]">
        Módulo no disponible en tu plan
      </h2>
      <p className="text-sm text-[var(--color-ink-muted)] mt-2 max-w-xs">
        {descripcion ?? `Esta funcionalidad requiere el plan `}
        <strong>{meta.nombre}</strong>
        {descripcion ? '' : '.'}
      </p>
      <Button variant="outline" className="mt-6" onClick={() => navigate('/admin/suscripcion')}>
        Ver planes disponibles
      </Button>
    </div>
  )
}
