import { useState, useEffect } from 'react'
import { ShoppingCart, Users, Package, TrendingUp, Clock, AlertTriangle, Truck, DollarSign, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/useAuthStore'
import { useVentasStore } from '@/store/useVentasStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type EstadoPedido = Database['public']['Enums']['estado_pedido']

const estadoBadge: Record<EstadoPedido, { tone: 'warning' | 'brand' | 'success' | 'danger' | 'info' | 'neutral'; label: string }> = {
  borrador:   { tone: 'neutral',  label: 'Borrador' },
  pendiente:  { tone: 'warning',  label: 'Pendiente' },
  confirmado: { tone: 'brand',    label: 'Confirmado' },
  facturado:  { tone: 'info',     label: 'Facturado' },
  entregado:  { tone: 'success',  label: 'Entregado' },
  cancelado:  { tone: 'danger',   label: 'Cancelado' },
}

function hace(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `hace ${min} min`
  const hs = Math.floor(min / 60)
  if (hs < 24) return `hace ${hs} h`
  return `hace ${Math.floor(hs / 24)} días`
}

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  tone?: 'brand' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

function StatCard({ title, value, sub, icon, tone = 'brand', loading }: StatCardProps) {
  const bg: Record<string, string> = {
    brand:   'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger:  'bg-red-50 text-red-600',
  }
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--color-ink-muted)]">{title}</p>
            {loading ? (
              <div className="h-8 w-20 bg-[var(--color-surface-soft)] rounded-lg mt-1 animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">{value}</p>
            )}
            {sub && <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg[tone]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PedidoReciente {
  id: string; numero_pedido: number; razon_social: string
  total: number; estado: EstadoPedido; fecha_pedido: string
}

// ── Dashboard Admin / Supervisor ──────────────────────────────────────────────

function DashboardAdmin() {
  const { empresaId } = useAuthStore()
  const [stats, setStats] = useState({ pedidosHoy: 0, ventaHoy: 0, clientesActivos: 0, pendientesAprobacion: 0, stockCritico: [] as { nombre: string; stock_actual: number; stock_minimo: number }[] })
  const [recientes, setRecientes] = useState<PedidoReciente[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    const hoyIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    async function cargar() {
      setCargando(true)
      try {
        const [pedidosHoyRes, pedidosRecientesRes, clientesRes, productosRes, pendientesRes] = await Promise.all([
          supabase.from('pedidos').select('id, total').gte('fecha_pedido', hoyIso),
          supabase.from('pedidos').select('id, numero_pedido, total, estado, fecha_pedido, clientes(razon_social)').order('fecha_pedido', { ascending: false }).limit(5),
          supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId!).eq('activo', true),
          supabase.from('productos').select('nombre, stock_actual, stock_minimo').eq('empresa_id', empresaId!).eq('activo', true),
          supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        ])
        const pedidosHoy = pedidosHoyRes.data ?? []
        const criticos = (productosRes.data ?? []).filter((p) => p.stock_actual <= p.stock_minimo).sort((a, b) => a.stock_actual - b.stock_actual).slice(0, 5)
        setStats({
          pedidosHoy: pedidosHoy.length,
          ventaHoy: pedidosHoy.reduce((s, p) => s + Number(p.total ?? 0), 0),
          clientesActivos: clientesRes.count ?? 0,
          pendientesAprobacion: pendientesRes.count ?? 0,
          stockCritico: criticos,
        })
        setRecientes((pedidosRecientesRes.data ?? []).map((p: any) => ({ id: p.id, numero_pedido: p.numero_pedido, razon_social: p.clientes?.razon_social ?? '—', total: p.total, estado: p.estado, fecha_pedido: p.fecha_pedido })))
      } finally { setCargando(false) }
    }
    cargar()
  }, [empresaId])

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard loading={cargando} title="Pedidos hoy"        value={stats.pedidosHoy}                   icon={<ShoppingCart className="w-5 h-5" />} tone="brand" />
        <StatCard loading={cargando} title="Venta del día"      value={formatCurrency(stats.ventaHoy)}     sub="total empresa" icon={<TrendingUp className="w-5 h-5" />} tone="success" />
        <StatCard loading={cargando} title="Pendientes aprobar" value={stats.pendientesAprobacion}         icon={<ClipboardCheck className="w-5 h-5" />} tone="warning" />
        <StatCard loading={cargando} title="Stock crítico"      value={stats.stockCritico.length}          sub="bajo mínimo" icon={<AlertTriangle className="w-5 h-5" />} tone="danger" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <PedidosRecientesCard recientes={recientes} cargando={cargando} />
        <Card>
          <CardHeader><CardTitle>Stock crítico</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {cargando ? <SkeletonList /> : stats.stockCritico.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)] py-6 text-center">Todo el stock está sobre el mínimo ✓</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {stats.stockCritico.map((p) => (
                  <div key={p.nombre} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
                      <p className="text-sm text-[var(--color-ink)] truncate">{p.nombre}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-red-600">{p.stock_actual}</span>
                      <span className="text-xs text-[var(--color-ink-muted)]"> / {p.stock_minimo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// ── Dashboard Preventista ─────────────────────────────────────────────────────

function DashboardPreventista() {
  const { perfil, empresaId } = useAuthStore()
  const colaOffline = useVentasStore((s) => s.colaOffline)
  const [stats, setStats] = useState({ pedidosHoy: 0, ventaHoy: 0, clientesHoy: 0 })
  const [recientes, setRecientes] = useState<PedidoReciente[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!perfil || !empresaId) return
    const hoyIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    const dias = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const
    const diaHoy = dias[new Date().getDay()]
    async function cargar() {
      setCargando(true)
      try {
        const [pedRes, recRes, clientesRes] = await Promise.all([
          supabase.from('pedidos').select('id, total').eq('preventista_id', perfil!.id).gte('fecha_pedido', hoyIso),
          supabase.from('pedidos').select('id, numero_pedido, total, estado, fecha_pedido, clientes(razon_social)').eq('preventista_id', perfil!.id).order('fecha_pedido', { ascending: false }).limit(5),
          diaHoy ? supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId!).eq('preventista_id', perfil!.id).eq('activo', true).eq('dia_visita', diaHoy) : Promise.resolve({ count: 0 }),
        ])
        const pedidos = pedRes.data ?? []
        setStats({ pedidosHoy: pedidos.length, ventaHoy: pedidos.reduce((s, p) => s + Number(p.total ?? 0), 0), clientesHoy: (clientesRes as any).count ?? 0 })
        setRecientes((recRes.data ?? []).map((p: any) => ({ id: p.id, numero_pedido: p.numero_pedido, razon_social: p.clientes?.razon_social ?? '—', total: p.total, estado: p.estado, fecha_pedido: p.fecha_pedido })))
      } finally { setCargando(false) }
    }
    cargar()
  }, [perfil, empresaId])

  const pendientesSync = colaOffline.filter((p) => p.estado_sync !== 'sincronizado').length

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard loading={cargando} title="Pedidos hoy"    value={stats.pedidosHoy}               icon={<ShoppingCart className="w-5 h-5" />} tone="brand" />
        <StatCard loading={cargando} title="Total vendido"  value={formatCurrency(stats.ventaHoy)} sub="hoy" icon={<TrendingUp className="w-5 h-5" />} tone="success" />
        <StatCard loading={cargando} title="Clientes hoy"   value={stats.clientesHoy}              sub="en tu ruta" icon={<Users className="w-5 h-5" />} tone="brand" />
        <StatCard loading={cargando} title="Sin sincronizar" value={pendientesSync}                 sub="offline" icon={<Clock className="w-5 h-5" />} tone={pendientesSync > 0 ? 'warning' : 'brand'} />
      </div>
      <PedidosRecientesCard recientes={recientes} cargando={cargando} />
    </>
  )
}

// ── Dashboard Depósito ────────────────────────────────────────────────────────

function DashboardDeposito() {
  const { empresaId } = useAuthStore()
  const [stats, setStats] = useState({ aPreparar: 0, listosParaCamion: 0, stockCritico: 0 })
  const [pedidos, setPedidos] = useState<PedidoReciente[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    async function cargar() {
      setCargando(true)
      try {
        const [confirmRes, factRes, productosRes, pedidosRes] = await Promise.all([
          supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'confirmado'),
          supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'facturado'),
          supabase.from('productos').select('stock_actual, stock_minimo').eq('empresa_id', empresaId!).eq('activo', true),
          supabase.from('pedidos').select('id, numero_pedido, total, estado, fecha_pedido, clientes(razon_social)').in('estado', ['confirmado', 'facturado']).order('fecha_pedido', { ascending: true }).limit(8),
        ])
        const stockCritico = (productosRes.data ?? []).filter((p) => p.stock_actual <= p.stock_minimo).length
        setStats({ aPreparar: confirmRes.count ?? 0, listosParaCamion: factRes.count ?? 0, stockCritico })
        setPedidos((pedidosRes.data ?? []).map((p: any) => ({ id: p.id, numero_pedido: p.numero_pedido, razon_social: p.clientes?.razon_social ?? '—', total: p.total, estado: p.estado, fecha_pedido: p.fecha_pedido })))
      } finally { setCargando(false) }
    }
    cargar()
  }, [empresaId])

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard loading={cargando} title="A preparar"         value={stats.aPreparar}       sub="confirmados" icon={<Package className="w-5 h-5" />} tone="warning" />
        <StatCard loading={cargando} title="Listos para camión" value={stats.listosParaCamion} sub="facturados"  icon={<Truck className="w-5 h-5" />} tone="brand" />
        <StatCard loading={cargando} title="Stock bajo mínimo"  value={stats.stockCritico}    sub="productos"   icon={<AlertTriangle className="w-5 h-5" />} tone="danger" />
      </div>
      <Card>
        <CardHeader><CardTitle>Pedidos activos</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {cargando ? <SkeletonList /> : pedidos.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)] py-6 text-center">Sin pedidos activos</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {pedidos.map((p) => {
                const badge = estadoBadge[p.estado]
                return (
                  <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">{p.razon_social}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">#{p.numero_pedido} · {hace(p.fecha_pedido)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(p.total)}</span>
                      <Badge tone={badge.tone} subtle>{badge.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// ── Dashboard Chofer ──────────────────────────────────────────────────────────

function DashboardChofer() {
  const { perfil, empresaId } = useAuthStore()
  const [stats, setStats] = useState({ pendientes: 0, entregadosHoy: 0, cobradoHoy: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!perfil || !empresaId) return
    const hoy = new Date().toISOString().split('T')[0]
    const hoyIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    async function cargar() {
      setCargando(true)
      try {
        const [pendRes, entregRes, cobrosRes] = await Promise.all([
          supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'facturado'),
          supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'entregado').gte('fecha_pedido', hoyIso),
          supabase.from('cobros').select('monto').eq('preventista_id', perfil!.id).eq('fecha', hoy),
        ])
        const cobradoHoy = (cobrosRes.data ?? []).reduce((s, c) => s + Number(c.monto), 0)
        setStats({ pendientes: pendRes.count ?? 0, entregadosHoy: entregRes.count ?? 0, cobradoHoy })
      } finally { setCargando(false) }
    }
    cargar()
  }, [perfil, empresaId])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard loading={cargando} title="Entregas pendientes" value={stats.pendientes}              sub="facturados" icon={<Truck className="w-5 h-5" />} tone={stats.pendientes > 0 ? 'warning' : 'brand'} />
      <StatCard loading={cargando} title="Entregados hoy"      value={stats.entregadosHoy}           icon={<CheckCircle2 className="w-5 h-5" />} tone="success" />
      <StatCard loading={cargando} title="Cobrado hoy"         value={formatCurrency(stats.cobradoHoy)} icon={<DollarSign className="w-5 h-5" />} tone="success" />
    </div>
  )
}

// ── Componentes compartidos ───────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="space-y-3 py-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-[var(--color-surface-soft)] rounded-lg animate-pulse" />)}
    </div>
  )
}

function PedidosRecientesCard({ recientes, cargando }: { recientes: PedidoReciente[]; cargando: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>Pedidos recientes</CardTitle></CardHeader>
      <CardContent className="pt-0">
        {cargando ? <SkeletonList /> : recientes.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)] py-6 text-center">Sin pedidos aún.</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recientes.map((p) => {
              const badge = estadoBadge[p.estado]
              return (
                <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">{p.razon_social}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">#{p.numero_pedido} · {hace(p.fecha_pedido)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(p.total)}</span>
                    <Badge tone={badge.tone} subtle>{badge.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const perfil = useAuthStore((s) => s.perfil)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">
          Hola, {perfil?.nombre_completo?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {(perfil?.rol === 'admin' || perfil?.rol === 'supervisor') && <DashboardAdmin />}
      {perfil?.rol === 'preventista' && <DashboardPreventista />}
      {perfil?.rol === 'deposito' && <DashboardDeposito />}
      {perfil?.rol === 'chofer' && <DashboardChofer />}
      {!perfil && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Tu usuario no tiene un perfil asignado a ninguna empresa. Pedile al administrador que te agregue desde el panel de usuarios.
        </div>
      )}
    </div>
  )
}
