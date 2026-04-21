import { CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { PLANES_META, MODULOS_POR_PLAN, type PlanKey, type Modulo } from '@/lib/planesConfig'
import { cn } from '@/lib/utils'

const MODULOS_LABELS: Record<Modulo, string> = {
  preventa:    'Preventa y pedidos',
  cobros:      'Cobros y rendición',
  deposito:    'Depósito y preparación',
  logistica:   'Logística y entregas',
  facturacion: 'Facturación / comprobantes',
  stock:       'Gestión de stock y precios',
  reportes:    'Reportes de ventas',
}

const PLAN_COLORS: Record<PlanKey, string> = {
  starter:    'bg-blue-50 border-blue-200 text-blue-700',
  pro:        'bg-brand-50 border-brand-200 text-brand-700',
  enterprise: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

const ALL_PLANES: PlanKey[] = ['starter', 'pro', 'enterprise']
const ALL_MODULOS: Modulo[] = ['preventa', 'cobros', 'deposito', 'logistica', 'facturacion', 'stock', 'reportes']

export default function SuscripcionPage() {
  const empresa = useAuthStore((s) => s.empresa)
  const planActual = (empresa?.plan && empresa.plan in PLANES_META ? empresa.plan : 'starter') as PlanKey
  const meta = PLANES_META[planActual]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-ink)]">Suscripción</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">Plan actual y módulos disponibles</p>
      </div>

      {/* Plan actual */}
      <div className={cn('rounded-xl border-2 p-5', PLAN_COLORS[planActual])}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">Plan actual</p>
            <h2 className="text-2xl font-bold mt-0.5">{meta.nombre}</h2>
            <p className="text-sm opacity-80 mt-1">{meta.descripcion}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/60 border border-current">
            Activo
          </span>
        </div>
        <ul className="mt-3 space-y-1">
          {meta.features.map((f) => (
            <li key={f} className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Tabla comparativa */}
      <div>
        <h3 className="font-semibold text-[var(--color-ink)] mb-3">Comparativa de planes</h3>
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                <th className="text-left px-4 py-3 text-[var(--color-ink-muted)] font-medium">Módulo</th>
                {ALL_PLANES.map((p) => (
                  <th key={p} className={cn(
                    'text-center px-3 py-3 font-semibold',
                    p === planActual ? 'text-brand-600' : 'text-[var(--color-ink-muted)]'
                  )}>
                    {PLANES_META[p].nombre}
                    {p === planActual && <span className="block text-xs font-normal text-brand-500">tu plan</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULOS.map((mod, i) => (
                <tr key={mod} className={cn(
                  'border-b border-[var(--color-border)] last:border-0',
                  i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-muted)]'
                )}>
                  <td className="px-4 py-2.5 text-[var(--color-ink)]">{MODULOS_LABELS[mod]}</td>
                  {ALL_PLANES.map((p) => {
                    const tiene = MODULOS_POR_PLAN[p].includes(mod)
                    return (
                      <td key={p} className="text-center px-3 py-2.5">
                        {tiene
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                          : <XCircle className="w-4 h-4 text-[var(--color-border)] mx-auto" />
                        }
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-ink-muted)]">
        Para cambiar de plan, contactá a soporte en{' '}
        <a href="mailto:soporte@zonify.app" className="text-brand-600 hover:underline">
          soporte@zonify.app
        </a>
      </div>
    </div>
  )
}
