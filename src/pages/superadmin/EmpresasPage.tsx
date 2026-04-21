import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import type { PlanKey } from '@/lib/planesConfig'
import { PLANES_META } from '@/lib/planesConfig'
import toast from 'react-hot-toast'

interface EmpresaRow {
  id: string
  nombre: string
  slug: string
  plan: string
  activo: boolean
  created_at: string
  email_contacto: string
  total_usuarios: number
  total_pedidos: number
}

const PLAN_BADGE: Record<string, string> = {
  starter:    'bg-blue-900 text-blue-200',
  pro:        'bg-brand-900 text-brand-200',
  enterprise: 'bg-emerald-900 text-emerald-200',
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([])
  const [cargando, setCargando] = useState(true)

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.rpc('superadmin_listar_empresas')
    if (error) toast.error('Error al cargar empresas')
    else setEmpresas((data as EmpresaRow[]) ?? [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function cambiarPlan(id: string, plan: string) {
    const { error } = await supabase.rpc('superadmin_cambiar_plan', {
      p_empresa_id: id,
      p_plan: plan,
    })
    if (error) toast.error('Error al cambiar plan')
    else {
      setEmpresas((prev) => prev.map((e) => e.id === id ? { ...e, plan } : e))
      toast.success('Plan actualizado')
    }
  }

  async function toggleActivo(id: string, activo: boolean) {
    const { error } = await supabase.rpc('superadmin_toggle_empresa', {
      p_empresa_id: id,
      p_activo: activo,
    })
    if (error) toast.error('Error al actualizar estado')
    else {
      setEmpresas((prev) => prev.map((e) => e.id === id ? { ...e, activo } : e))
      toast.success(activo ? 'Empresa activada' : 'Empresa desactivada')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Empresas</h1>
          <p className="text-slate-400 text-sm mt-0.5">{empresas.length} distribuidoras registradas</p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', cargando && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Empresa</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-center px-3 py-3 text-slate-400 font-medium">Usuarios</th>
                <th className="text-center px-3 py-3 text-slate-400 font-medium">Pedidos</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Registrada</th>
                <th className="text-center px-3 py-3 text-slate-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{e.nombre}</p>
                    <p className="text-slate-400 text-xs">{e.slug}</p>
                    {e.email_contacto && <p className="text-slate-500 text-xs">{e.email_contacto}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={e.plan}
                      onChange={(ev) => cambiarPlan(e.id, ev.target.value)}
                      className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer',
                        PLAN_BADGE[e.plan] ?? 'bg-slate-800 text-slate-300'
                      )}
                    >
                      {(Object.keys(PLANES_META) as PlanKey[]).map((p) => (
                        <option key={p} value={p} className="bg-slate-800 text-white">
                          {PLANES_META[p].nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-center px-3 py-3 text-slate-300">{e.total_usuarios}</td>
                  <td className="text-center px-3 py-3 text-slate-300">{e.total_pedidos}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(e.created_at)}</td>
                  <td className="text-center px-3 py-3">
                    <button
                      onClick={() => toggleActivo(e.id, !e.activo)}
                      title={e.activo ? 'Desactivar' : 'Activar'}
                    >
                      {e.activo
                        ? <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                        : <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
