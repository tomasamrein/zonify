import { useState, useEffect, useCallback } from 'react'
import { Check, X, Truck, PackageCheck, BarChart3, Wifi, ShieldCheck, Smartphone, ChevronLeft, ChevronRight, Clock, AlertTriangle, MessageSquareX, FolderX } from 'lucide-react'
import { PLANES_META, MODULOS_POR_PLAN, type PlanKey, type Modulo } from '@/lib/planesConfig'

const CONTACT = 'contacto@zonify.com.ar'
const PLANES: PlanKey[] = ['starter', 'pro', 'enterprise']
const ALL_MODULOS: Modulo[] = ['preventa', 'cobros', 'deposito', 'logistica', 'facturacion', 'stock', 'reportes']
const MODULOS_LABELS: Record<Modulo, string> = {
  preventa:    'Preventa y pedidos',
  cobros:      'Cobros y rendición',
  deposito:    'Depósito y preparación',
  logistica:   'Logística y entregas',
  facturacion: 'Facturación / comprobantes',
  stock:       'Gestión de stock',
  reportes:    'Reportes de ventas',
}

// ── Mockups de pantallas ─────────────────────────────────────────────────────

function MockupDashboard() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-3 flex flex-col gap-2">
      <div className="flex gap-2">
        {[
          { label: 'Ventas hoy', value: '$284.500', color: 'bg-blue-500', sub: '+8% vs ayer' },
          { label: 'Pedidos', value: '23', color: 'bg-emerald-500', sub: '18 entregados' },
          { label: 'Cobros', value: '$198.000', color: 'bg-violet-500', sub: '12 clientes' },
          { label: 'Stock bajo', value: '4 prod.', color: 'bg-amber-500', sub: 'requieren ingreso' },
        ].map((c) => (
          <div key={c.label} className="flex-1 bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
            <div className={`w-5 h-1 rounded-full ${c.color} mb-1.5`} />
            <p className="text-[9px] text-gray-400 leading-none">{c.label}</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{c.value}</p>
            <p className="text-[8px] text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex-[3] bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex flex-col">
          <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Ventas últimos 7 días</p>
          <div className="flex items-end gap-1 flex-1">
            {[
              { h: 40, label: 'L', val: '$180k' },
              { h: 65, label: 'M', val: '$230k' },
              { h: 45, label: 'X', val: '$195k' },
              { h: 80, label: 'J', val: '$310k' },
              { h: 55, label: 'V', val: '$215k' },
              { h: 90, label: 'S', val: '$340k' },
              { h: 70, label: 'D', val: '$285k' },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                <p className="text-[7px] text-gray-400">{d.val}</p>
                <div className="w-full bg-blue-100 rounded-t-sm relative" style={{ height: `${d.h}%` }}>
                  <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm" style={{ height: '100%' }} />
                </div>
                <p className="text-[8px] text-gray-300">{d.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-[2] flex flex-col gap-2">
          <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex-1">
            <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Top preventistas</p>
            {[
              { nombre: 'Martín G.', monto: '$98k', pct: 85 },
              { nombre: 'Laura R.', monto: '$71k', pct: 62 },
              { nombre: 'Carlos V.', monto: '$55k', pct: 48 },
            ].map((p) => (
              <div key={p.nombre} className="mb-1.5">
                <div className="flex justify-between mb-0.5">
                  <p className="text-[9px] text-gray-600">{p.nombre}</p>
                  <p className="text-[9px] font-semibold text-gray-700">{p.monto}</p>
                </div>
                <div className="h-1 bg-gray-100 rounded-full">
                  <div className="h-1 bg-blue-400 rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
        <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Ventas recientes</p>
        <div className="space-y-1">
          {[
            { cliente: 'Almacén La Esquina', prev: 'Martín G.', total: '$12.450', estado: 'entregado' },
            { cliente: 'Super Martínez', prev: 'Laura R.', total: '$8.900', estado: 'en_camino' },
            { cliente: 'Kiosco del Centro', prev: 'Carlos V.', total: '$3.200', estado: 'preparando' },
            { cliente: 'Distribuidora Roma', prev: 'Martín G.', total: '$21.600', estado: 'entregado' },
          ].map((v) => (
            <div key={v.cliente} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.estado === 'entregado' ? 'bg-green-500' : v.estado === 'en_camino' ? 'bg-blue-500' : 'bg-amber-400'}`} />
              <p className="text-[9px] text-gray-700 flex-1 truncate">{v.cliente}</p>
              <p className="text-[8px] text-gray-400 hidden sm:block">{v.prev}</p>
              <p className="text-[9px] font-semibold text-gray-800">{v.total}</p>
              <span className={`text-[7px] font-semibold px-1 py-0.5 rounded ${v.estado === 'entregado' ? 'bg-green-50 text-green-700' : v.estado === 'en_camino' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                {v.estado === 'entregado' ? 'Entregado' : v.estado === 'en_camino' ? 'En camino' : 'Preparando'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockupCatalogo() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-gray-300" />
          <p className="text-[10px] text-gray-400">Buscar producto...</p>
        </div>
        <div className="bg-blue-50 text-blue-700 text-[9px] font-semibold px-2 py-1.5 rounded-lg border border-blue-200 shrink-0">
          La Esquina S.A.
        </div>
      </div>

      <div className="space-y-1.5 flex-1">
        {[
          { nombre: 'Agua Mineral 500ml x12', cod: 'AG-001', precio: '$1.850', stock: 240, enCarrito: 3 },
          { nombre: 'Gaseosa Cola 2.25L x6', cod: 'GS-003', precio: '$3.200', stock: 8, enCarrito: 2 },
          { nombre: 'Jugo Naranja 1L x12', cod: 'JG-007', precio: '$2.750', stock: 155, enCarrito: 0 },
          { nombre: 'Cerveza Lata 473ml x24', cod: 'CE-012', precio: '$5.400', stock: 3, enCarrito: 0 },
          { nombre: 'Soda Limón 1.5L x6', cod: 'SD-004', precio: '$1.200', stock: 88, enCarrito: 5 },
        ].map((p) => (
          <div key={p.cod} className={`bg-white rounded-xl px-3 py-2 border flex items-center gap-2 shadow-sm ${p.enCarrito > 0 ? 'border-blue-300 bg-blue-50/40' : 'border-gray-100'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800 truncate">{p.nombre}</p>
              <div className="flex items-center gap-2">
                <p className="text-[8px] text-gray-400">{p.cod}</p>
                <p className={`text-[8px] ${p.stock <= 10 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>Stock: {p.stock}</p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-blue-700 shrink-0">{p.precio}</p>
            {p.enCarrito > 0 ? (
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center"><span className="text-[9px]">−</span></div>
                <span className="text-[10px] font-bold w-3 text-center">{p.enCarrito}</span>
                <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center"><span className="text-[9px] text-white">+</span></div>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center shrink-0"><span className="text-[9px] text-white">+</span></div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-xl px-3 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white font-semibold">10 productos · $18.850</p>
          <p className="text-[8px] text-blue-200">IVA incluido</p>
        </div>
        <p className="text-[10px] text-white font-bold bg-white/20 px-2 py-1 rounded-lg">Confirmar pedido →</p>
      </div>
    </div>
  )
}

function MockupStock() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-700">Gestión de Stock</p>
          <p className="text-[9px] text-gray-400">Actualizado hace 2 min</p>
        </div>
        <div className="flex gap-1.5">
          <div className="bg-amber-50 text-amber-700 text-[9px] font-semibold px-2 py-1 rounded-lg border border-amber-200">4 alertas</div>
          <div className="bg-blue-600 text-white text-[9px] font-semibold px-2 py-1 rounded-lg">+ Ingreso</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-100 px-3 py-1.5">
          {['Producto', 'Stock', 'Mín.', 'Estado', ''].map((h) => (
            <p key={h} className="text-[8px] font-semibold text-gray-400">{h}</p>
          ))}
        </div>
        {[
          { nombre: 'Agua Mineral 500ml', stock: 240, min: 50, ok: true },
          { nombre: 'Cerveza Lata 473ml', stock: 3, min: 24, ok: false },
          { nombre: 'Gaseosa Cola 2.25L', stock: 8, min: 12, ok: false },
          { nombre: 'Jugo Naranja 1L', stock: 155, min: 30, ok: true },
          { nombre: 'Soda Limón 1.5L', stock: 7, min: 20, ok: false },
          { nombre: 'Agua con Gas 500ml', stock: 88, min: 40, ok: true },
        ].map((r) => (
          <div key={r.nombre} className="grid grid-cols-5 items-center px-3 py-1.5 border-b border-gray-50 last:border-0">
            <p className="text-[9px] text-gray-700 truncate pr-1 col-span-1">{r.nombre}</p>
            <p className={`text-[10px] font-bold ${r.ok ? 'text-gray-800' : 'text-red-600'}`}>{r.stock}</p>
            <p className="text-[9px] text-gray-400">{r.min}</p>
            <div className={`text-[7px] font-semibold px-1.5 py-0.5 rounded-full w-fit ${r.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {r.ok ? 'OK' : 'Bajo'}
            </div>
            <div className="text-blue-500 text-[9px] font-medium cursor-pointer">+</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
        <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Últimos movimientos</p>
        <div className="space-y-1">
          {[
            { tipo: 'Ingreso', prod: 'Agua Mineral 500ml', cant: '+120 u.', hora: '10:30', color: 'bg-green-50 text-green-700' },
            { tipo: 'Egreso', prod: 'Cerveza Lata (pedido #487)', cant: '-24 u.', hora: '09:15', color: 'bg-red-50 text-red-700' },
            { tipo: 'Ajuste', prod: 'Gaseosa Cola 2.25L', cant: '8 u.', hora: '08:00', color: 'bg-amber-50 text-amber-700' },
          ].map((m) => (
            <div key={m.prod} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-[7px] font-semibold ${m.color} px-1 py-0.5 rounded`}>{m.tipo}</span>
                <p className="text-[9px] text-gray-600 truncate max-w-[120px]">{m.prod}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-bold text-gray-700">{m.cant}</p>
                <p className="text-[8px] text-gray-400">{m.hora}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockupReportes() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700">Reportes de Ventas</p>
        <div className="flex gap-1">
          {['Semana', 'Mes', 'Año'].map((t, i) => (
            <button key={t} className={`text-[8px] font-semibold px-2 py-0.5 rounded-md ${i === 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { label: 'Total mes', value: '$3.2M', sub: '↑ +12%', color: 'text-emerald-600' },
          { label: 'Pedidos', value: '487', sub: '↑ +5%', color: 'text-emerald-600' },
          { label: 'Ticket prom.', value: '$6.570', sub: '↑ +7%', color: 'text-emerald-600' },
        ].map((c) => (
          <div key={c.label} className="flex-1 bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm">
            <p className="text-[8px] text-gray-400">{c.label}</p>
            <p className="text-sm font-bold text-gray-800">{c.value}</p>
            <p className={`text-[8px] font-semibold ${c.color}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <p className="text-[9px] font-semibold text-gray-500 mb-2">Ventas por zona</p>
          {[
            { zona: 'Zona Norte', pct: 78, monto: '$1.2M' },
            { zona: 'Zona Sur', pct: 55, monto: '$870K' },
            { zona: 'Zona Este', pct: 38, monto: '$602K' },
            { zona: 'Zona Oeste', pct: 20, monto: '$280K' },
          ].map((z) => (
            <div key={z.zona} className="flex items-center gap-2 mb-2">
              <p className="text-[8px] text-gray-600 w-14 shrink-0">{z.zona}</p>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${z.pct}%` }} />
              </div>
              <p className="text-[8px] font-semibold text-gray-700 w-9 text-right shrink-0">{z.monto}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm flex flex-col">
          <p className="text-[9px] font-semibold text-gray-500 mb-2">Top productos</p>
          {[
            { prod: 'Agua Mineral 500ml', u: '1.240 u', ing: '$2.3M' },
            { prod: 'Gaseosa Cola 2.25L', u: '840 u', ing: '$1.1M' },
            { prod: 'Cerveza Lata 473ml', u: '620 u', ing: '$890K' },
            { prod: 'Jugo Naranja 1L', u: '510 u', ing: '$700K' },
          ].map((p, i) => (
            <div key={p.prod} className="flex items-center gap-1.5 py-1 border-b border-gray-50 last:border-0">
              <span className="text-[8px] font-bold text-gray-300 w-3">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] text-gray-700 truncate">{p.prod}</p>
                <p className="text-[7px] text-gray-400">{p.u}</p>
              </div>
              <p className="text-[8px] font-semibold text-gray-700 shrink-0">{p.ing}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockupRuta() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-700">Mi Ruta — Hoy</p>
          <p className="text-[9px] text-gray-400">Martes · Zona Norte · 14 clientes</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold text-gray-700">$84.500</p>
          <p className="text-[8px] text-gray-400">cobrado hoy</p>
        </div>
      </div>

      <div className="flex gap-2 text-center">
        {[
          { label: 'Visitados', val: '6', color: 'text-green-600 bg-green-50 border-green-100' },
          { label: 'Pendientes', val: '8', color: 'text-gray-600 bg-gray-50 border-gray-100' },
          { label: 'Sin cobrar', val: '3', color: 'text-amber-600 bg-amber-50 border-amber-100' },
        ].map((s) => (
          <div key={s.label} className={`flex-1 rounded-xl border py-1.5 ${s.color}`}>
            <p className="text-base font-bold">{s.val}</p>
            <p className="text-[8px]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 flex-1 overflow-hidden">
        {[
          { nombre: 'Almacén La Esquina', dir: 'Mitre 450', estado: 'visitado', monto: '$12.450', pedido: 'Pedido #487' },
          { nombre: 'Super Martínez', dir: 'San Martín 1200', estado: 'en_curso', monto: '$8.900', pedido: 'Pedido #488' },
          { nombre: 'Kiosco del Centro', dir: 'Belgrano 88', estado: 'pendiente', monto: '—', pedido: 'Sin pedido aún' },
          { nombre: 'Distribuidora Roma', dir: 'Italia 234', estado: 'visitado', monto: '$21.600', pedido: 'Pedido #486' },
          { nombre: 'Minimarket Sol', dir: 'Córdoba 567', estado: 'pendiente', monto: '—', pedido: 'Sin pedido aún' },
        ].map((c) => (
          <div key={c.nombre} className={`bg-white rounded-xl border px-3 py-2 flex items-center gap-2.5 shadow-sm ${c.estado === 'en_curso' ? 'border-blue-400' : 'border-gray-100'}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${c.estado === 'visitado' ? 'bg-green-500' : c.estado === 'en_curso' ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-gray-200'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800 truncate">{c.nombre}</p>
              <p className="text-[8px] text-gray-400">{c.dir} · {c.pedido}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold text-gray-700">{c.monto}</p>
              <p className={`text-[8px] font-semibold ${c.estado === 'visitado' ? 'text-green-600' : c.estado === 'en_curso' ? 'text-blue-600' : 'text-gray-400'}`}>
                {c.estado === 'visitado' ? '✓ Listo' : c.estado === 'en_curso' ? '● En curso' : 'Pendiente'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Carrusel ─────────────────────────────────────────────────────────────────

const SLIDES = [
  { titulo: 'Dashboard en tiempo real', desc: 'Ventas, cobros, stock y rendimiento de cada preventista visibles en el momento, desde cualquier dispositivo.', mockup: <MockupDashboard /> },
  { titulo: 'Preventa desde el celular', desc: 'Catálogo actualizado, precios por lista de cliente y stock disponible. Funciona aunque no haya señal.', mockup: <MockupCatalogo /> },
  { titulo: 'Control de stock inteligente', desc: 'Alertas automáticas cuando el stock cae al mínimo. Registro completo de cada movimiento con trazabilidad total.', mockup: <MockupStock /> },
  { titulo: 'Reportes de ventas', desc: 'Análisis por zona, preventista y producto. Identificá qué vendés más, dónde y con qué margen.', mockup: <MockupReportes /> },
  { titulo: 'Ruta del día para preventistas', desc: 'El preventista ve sus clientes ordenados, marca cada visita y registra cobros en el momento. Sin llamadas al depósito.', mockup: <MockupRuta /> },
]

function Carrusel() {
  const [activo, setActivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  const siguiente = useCallback(() => setActivo((a) => (a + 1) % SLIDES.length), [])
  const anterior = useCallback(() => setActivo((a) => (a - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (pausado) return
    const t = setInterval(siguiente, 4500)
    return () => clearInterval(t)
  }, [pausado, siguiente])

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div
        className="relative bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-gray-200 overflow-hidden group"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-3 bg-white rounded-md border border-gray-200 text-[10px] text-gray-400 px-2 py-0.5 text-center select-none">
            app.zonify.com.ar
          </div>
        </div>

        <div className="h-80 md:h-[26rem]">
          {SLIDES[activo].mockup}
        </div>

        <button
          onClick={anterior}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={siguiente}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="font-semibold text-gray-900 text-lg mb-1">{SLIDES[activo].titulo}</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">{SLIDES[activo].desc}</p>
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.titulo}
              onClick={() => setActivo(i)}
              className={`rounded-full transition-all duration-300 ${i === activo ? 'w-6 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tabla de planes ───────────────────────────────────────────────────────────

function TablaPlanes() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-4 text-gray-500 font-medium">Incluye</th>
              {PLANES.map((p) => {
                const meta = PLANES_META[p]
                return (
                  <th key={p} className="text-center px-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-bold ${meta.es_popular ? 'text-blue-600' : 'text-gray-800'}`}>{meta.nombre}</span>
                      {meta.es_popular && (
                        <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Recomendado</span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {ALL_MODULOS.map((mod, i) => (
              <tr key={mod} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-5 py-3 text-gray-700">{MODULOS_LABELS[mod]}</td>
                {PLANES.map((p) => {
                  const tiene = MODULOS_POR_PLAN[p].includes(mod)
                  return (
                    <td key={p} className="text-center px-4 py-3">
                      {tiene
                        ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                        : <X className="w-4 h-4 text-gray-200 mx-auto" />}
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* Capacitación — todos los planes */}
            <tr className="border-b border-gray-100 bg-blue-50/30">
              <td className="px-5 py-3 text-gray-700 font-medium">Capacitación online incluida</td>
              {PLANES.map((p) => (
                <td key={p} className="text-center px-4 py-3">
                  <Check className="w-4 h-4 text-blue-500 mx-auto" />
                </td>
              ))}
            </tr>
            {/* Exclusivos Enterprise */}
            {[
              'Auditoría avanzada (logs de precios y stock)',
              'Asistente IA integrado',
              'Soporte 1:1 por WhatsApp',
              'Multi-sucursales / depósitos',
              'Usuarios ilimitados',
            ].map((f) => (
              <tr key={f} className="border-b border-gray-100">
                <td className="px-5 py-3 text-gray-700">{f}</td>
                <td className="text-center px-4 py-3"><X className="w-4 h-4 text-gray-200 mx-auto" /></td>
                <td className="text-center px-4 py-3"><X className="w-4 h-4 text-gray-200 mx-auto" /></td>
                <td className="text-center px-4 py-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
            ))}
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-5 py-4" />
              {PLANES.map((p) => (
                <td key={p} className="text-center px-4 py-4">
                  <a
                    href={`mailto:${CONTACT}?subject=Consulta plan ${PLANES_META[p].nombre}`}
                    className={`inline-block text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                      PLANES_META[p].es_popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Consultar
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">Zonify</span>
          <a
            href={`mailto:${CONTACT}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Agendar llamada
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Software para distribuidoras mayoristas
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Tu distribuidora organizada,{' '}
          <span className="text-blue-600">tu equipo sincronizado</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-4">
          Un sistema moderno, simple y fácil de usar que conecta a tus preventistas, depósito y choferes en tiempo real.
          Sin papel, sin llamadas innecesarias, sin perder ventas por falta de stock.
        </p>
        <p className="text-sm text-gray-400 mb-10">Diseñado para ser usado desde el primer día, sin capacitación técnica.</p>
        <a
          href={`mailto:${CONTACT}?subject=Quiero conocer Zonify`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200"
        >
          Agendar una llamada gratuita
        </a>

        {/* Tech badges */}
        <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          {['Funciona offline', 'Instalable en celular', 'Tiempo real', 'Datos 100% seguros', 'Sin instalación'].map((b) => (
            <span key={b} className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">{b}</span>
          ))}
        </div>
      </section>

      {/* Dolores */}
      <section className="bg-gray-950 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-gray-400 text-sm font-semibold uppercase tracking-widest mb-8">¿Reconocés alguno de estos problemas?</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Clock className="w-5 h-5 text-red-400" />,
                titulo: 'Tiempo perdido',
                desc: 'Preventistas que llaman al depósito para saber si hay stock. Horas perdidas en llamadas que podrían evitarse.',
              },
              {
                icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
                titulo: 'Stock descontrolado',
                desc: 'Vendés algo que no tenés, o comprás de más porque no sabés cuánto hay. El inventario siempre está desactualizado.',
              },
              {
                icon: <FolderX className="w-5 h-5 text-orange-400" />,
                titulo: 'Pedidos en papel',
                desc: 'Cuadernos, notas de voz y planillas de Excel que se pierden, se malinterpretan y retrasan las entregas.',
              },
              {
                icon: <MessageSquareX className="w-5 h-5 text-rose-400" />,
                titulo: 'Roles desconectados',
                desc: 'El preventista no sabe qué preparó el depósito. El chofer no sabe qué cobrar. Nadie tiene la misma información.',
              },
            ].map((d) => (
              <div key={d.titulo} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                  {d.icon}
                </div>
                <p className="font-semibold text-white mb-2">{d.titulo}</p>
                <p className="text-sm text-gray-400">{d.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Zonify resuelve estos problemas desde el día uno.
          </p>
        </div>
      </section>

      {/* Carrusel */}
      <section className="py-20">
        <div className="text-center mb-10 px-4">
          <h2 className="text-3xl font-bold mb-3">Mirá cómo se ve en funcionamiento</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Interfaz moderna y simple. Tu equipo lo aprende en minutos.</p>
        </div>
        <Carrusel />
      </section>

      {/* Features = soluciones */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Un sistema, todos los roles conectados</h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
            Cada persona en tu equipo trabaja con la información que necesita, en el momento que la necesita.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Smartphone className="w-6 h-6 text-blue-600" />, titulo: 'Preventista en la calle', desc: 'Toma pedidos desde el celular con catálogo completo, precios por cliente y stock visible. Funciona sin señal y sincroniza solo.' },
              { icon: <PackageCheck className="w-6 h-6 text-blue-600" />, titulo: 'Depósito sin sorpresas', desc: 'Ve los pedidos en tiempo real, prepara con lista digital y descuenta el stock automáticamente. Sin llamadas, sin confusiones.' },
              { icon: <Truck className="w-6 h-6 text-blue-600" />, titulo: 'Chofer organizado', desc: 'Hoja de ruta digital con clientes ordenados, monto a cobrar por visita y estado de cada entrega actualizado al momento.' },
              { icon: <BarChart3 className="w-6 h-6 text-blue-600" />, titulo: 'Admin con visibilidad total', desc: 'Dashboard con ventas, cobros, stock y rendimiento de cada preventista. Tomá decisiones con datos reales, no con estimaciones.' },
              { icon: <ShieldCheck className="w-6 h-6 text-blue-600" />, titulo: 'Tecnología de primer nivel', desc: 'Construido con las mismas herramientas que usan las empresas más grandes del mundo. Rápido, seguro y siempre disponible.' },
              { icon: <Wifi className="w-6 h-6 text-blue-600" />, titulo: 'Sin instalación ni hardware', desc: 'Se abre desde el navegador del celular o la PC. Sin aplicaciones que actualizar, sin servidores que mantener, sin IT.' },
            ].map((item) => (
              <div key={item.titulo} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.titulo}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Planes para cada etapa</h2>
          <p className="text-gray-500 text-center mb-3">
            Todos los planes incluyen capacitación online y soporte para que tu equipo arranque sin problemas.
          </p>
          <p className="text-center text-sm text-blue-600 font-medium mb-10">✓ Capacitación online incluida en todos los planes</p>
          <TablaPlanes />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {[
              { q: '¿Es difícil de usar?', a: 'No. Está diseñado para ser simple desde el primer día. Un preventista sin experiencia en tecnología puede aprender a tomar pedidos en menos de 30 minutos. Además, todos los planes incluyen capacitación online.' },
              { q: '¿Necesito instalar algo?', a: 'No. Funciona desde el navegador de cualquier celular o computadora. Los preventistas pueden instalarlo como app en su celular (PWA) en un clic, sin pasar por el App Store.' },
              { q: '¿Qué pasa si no hay internet en la calle?', a: 'Zonify funciona offline. Pedidos, cobros y rutas se guardan en el celular y se sincronizan automáticamente cuando vuelve la señal. Sin pérdida de datos.' },
              { q: '¿Cómo se contrata?', a: 'Agendás una llamada con nuestro equipo, analizamos tu operación y configuramos el sistema a medida. El onboarding incluye la carga inicial de productos, clientes y zonas.' },
              { q: '¿Puedo importar mis productos y clientes?', a: 'Sí. Durante el onboarding te ayudamos a importar tu catálogo y base de clientes desde Excel o tu sistema actual. No empezás de cero.' },
            ].map((item) => (
              <div key={item.q} className="border-b border-gray-200 pb-6">
                <p className="font-semibold text-gray-900 mb-2">{item.q}</p>
                <p className="text-gray-500 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-blue-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ordená tu distribuidora esta semana</h2>
        <p className="text-blue-200 mb-2 max-w-md mx-auto">
          Agendá una llamada de 30 minutos. Te mostramos el sistema funcionando con datos reales de tu rubro.
        </p>
        <p className="text-blue-300 text-sm mb-8">Sin compromisos. Sin presentaciones genéricas.</p>
        <a
          href={`mailto:${CONTACT}?subject=Quiero conocer Zonify`}
          className="inline-block bg-white text-blue-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors"
        >
          Escribinos a {CONTACT}
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Zonify · <a href={`mailto:${CONTACT}`} className="hover:text-gray-600">{CONTACT}</a></p>
      </footer>
    </div>
  )
}
