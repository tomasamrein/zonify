import { useState, useEffect, useCallback } from 'react'
import { Check, X, Truck, PackageCheck, BarChart3, Wifi, ShieldCheck, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div className="w-full h-full bg-[#f8f9fb] p-4 flex flex-col gap-3">
      <div className="flex gap-3">
        {[
          { label: 'Ventas hoy', value: '$284.500', color: 'bg-blue-500' },
          { label: 'Pedidos', value: '23', color: 'bg-emerald-500' },
          { label: 'Cobros', value: '$198.000', color: 'bg-violet-500' },
          { label: 'Stock bajo', value: '4 prod.', color: 'bg-amber-500' },
        ].map((c) => (
          <div key={c.label} className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className={`w-5 h-1 rounded-full ${c.color} mb-2`} />
            <p className="text-[10px] text-gray-400 leading-none">{c.label}</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-1">
        <div className="flex-[2] bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 mb-2">Ventas últimos 7 días</p>
          <div className="flex items-end gap-1 h-16">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-100 rounded-t-sm relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <p key={d} className="text-[8px] text-gray-300 flex-1 text-center">{d}</p>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 mb-2">Top preventistas</p>
          <div className="space-y-1.5">
            {[
              { nombre: 'Martín G.', pct: 85 },
              { nombre: 'Laura R.', pct: 62 },
              { nombre: 'Carlos V.', pct: 48 },
            ].map((p) => (
              <div key={p.nombre}>
                <div className="flex justify-between mb-0.5">
                  <p className="text-[9px] text-gray-600">{p.nombre}</p>
                  <p className="text-[9px] text-gray-400">{p.pct}%</p>
                </div>
                <div className="h-1 bg-gray-100 rounded-full">
                  <div className="h-1 bg-blue-400 rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupCatalogo() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-gray-300" />
          <p className="text-[10px] text-gray-400">Buscar producto...</p>
        </div>
        <div className="bg-blue-50 text-blue-700 text-[9px] font-semibold px-2 py-1.5 rounded-lg border border-blue-200">
          La Esquina S.A.
        </div>
      </div>
      {[
        { nombre: 'Agua Mineral 500ml x12', cod: 'AG-001', precio: '$1.850', stock: 240, enCarrito: 3 },
        { nombre: 'Gaseosa Cola 2.25L x6', cod: 'GS-003', precio: '$3.200', stock: 8, enCarrito: 0 },
        { nombre: 'Jugo Naranja 1L x12', cod: 'JG-007', precio: '$2.750', stock: 155, enCarrito: 0 },
        { nombre: 'Cerveza Lata 473ml x24', cod: 'CE-012', precio: '$5.400', stock: 3, enCarrito: 0 },
      ].map((p) => (
        <div key={p.cod} className={`bg-white rounded-xl px-3 py-2 border flex items-center gap-2 shadow-sm ${p.enCarrito > 0 ? 'border-blue-300 bg-blue-50/40' : 'border-gray-100'}`}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-800 truncate">{p.nombre}</p>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-400">{p.cod}</p>
              <p className={`text-[9px] ${p.stock <= 10 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>Stock: {p.stock}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-blue-700 shrink-0">{p.precio}</p>
          {p.enCarrito > 0 ? (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center"><span className="text-[9px]">−</span></div>
              <span className="text-[10px] font-bold w-3 text-center">{p.enCarrito}</span>
              <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center"><span className="text-[9px] text-white">+</span></div>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center shrink-0"><span className="text-[9px] text-white">+</span></div>
          )}
        </div>
      ))}
      <div className="mt-auto bg-blue-600 rounded-xl px-3 py-2 flex items-center justify-between">
        <p className="text-[10px] text-white font-semibold">3 productos · $5.550</p>
        <p className="text-[10px] text-white font-bold">Revisar pedido →</p>
      </div>
    </div>
  )
}

function MockupStock() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700">Gestión de Stock</p>
        <div className="bg-blue-600 text-white text-[9px] font-semibold px-2 py-1 rounded-lg">+ Ingreso</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-100 px-3 py-1.5">
          {['Producto', 'Stock', 'Mínimo', ''].map((h) => (
            <p key={h} className="text-[9px] font-semibold text-gray-400">{h}</p>
          ))}
        </div>
        {[
          { nombre: 'Agua Mineral 500ml', stock: 240, min: 50, ok: true },
          { nombre: 'Cerveza Lata 473ml', stock: 3, min: 24, ok: false },
          { nombre: 'Gaseosa Cola 2.25L', stock: 8, min: 12, ok: false },
          { nombre: 'Jugo Naranja 1L', stock: 155, min: 30, ok: true },
          { nombre: 'Soda 1.5L x6', stock: 42, min: 20, ok: true },
        ].map((r) => (
          <div key={r.nombre} className="grid grid-cols-4 items-center px-3 py-2 border-b border-gray-50 last:border-0">
            <p className="text-[9px] text-gray-700 truncate pr-1">{r.nombre}</p>
            <p className={`text-[10px] font-bold ${r.ok ? 'text-gray-800' : 'text-red-600'}`}>{r.stock}</p>
            <p className="text-[9px] text-gray-400">{r.min}</p>
            <div className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full w-fit ${r.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {r.ok ? 'OK' : 'Bajo'}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Últimos movimientos</p>
        {[
          { tipo: 'Ingreso', prod: 'Agua Mineral', cant: '+120', color: 'text-green-600' },
          { tipo: 'Egreso', prod: 'Cerveza Lata', cant: '-24', color: 'text-red-600' },
        ].map((m) => (
          <div key={m.prod} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1.5">
              <div className={`text-[8px] font-semibold ${m.tipo === 'Ingreso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} px-1 py-0.5 rounded`}>{m.tipo}</div>
              <p className="text-[9px] text-gray-600">{m.prod}</p>
            </div>
            <p className={`text-[10px] font-bold ${m.color}`}>{m.cant}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupReportes() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-4 flex flex-col gap-3">
      <p className="text-xs font-bold text-gray-700">Reportes de Ventas</p>
      <div className="flex gap-2">
        {[
          { label: 'Total mes', value: '$3.2M', sub: '+12% vs anterior' },
          { label: 'Pedidos', value: '487', sub: '23 hoy' },
        ].map((c) => (
          <div key={c.label} className="flex-1 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[9px] text-gray-400">{c.label}</p>
            <p className="text-base font-bold text-gray-800">{c.value}</p>
            <p className="text-[9px] text-emerald-600 font-medium">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex-1">
        <p className="text-[9px] font-semibold text-gray-500 mb-2">Ventas por zona</p>
        {[
          { zona: 'Zona Norte', pct: 78, monto: '$1.2M' },
          { zona: 'Zona Sur',   pct: 55, monto: '$870K' },
          { zona: 'Zona Este',  pct: 38, monto: '$602K' },
          { zona: 'Zona Oeste', pct: 20, monto: '$280K' },
        ].map((z) => (
          <div key={z.zona} className="flex items-center gap-2 mb-2">
            <p className="text-[9px] text-gray-600 w-16 shrink-0">{z.zona}</p>
            <div className="flex-1 h-2 bg-gray-100 rounded-full">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${z.pct}%` }} />
            </div>
            <p className="text-[9px] font-semibold text-gray-700 w-10 text-right shrink-0">{z.monto}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Top productos</p>
        {['Agua Mineral 500ml', 'Gaseosa Cola 2.25L', 'Cerveza Lata 473ml'].map((p, i) => (
          <div key={p} className="flex items-center gap-2 py-0.5">
            <span className="text-[9px] text-gray-300 w-3">{i + 1}</span>
            <p className="text-[9px] text-gray-700 flex-1">{p}</p>
            <div className="flex gap-0.5">{Array.from({ length: 5 - i }).map((_, j) => <div key={j} className="w-1.5 h-1.5 rounded-full bg-blue-400" />)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupRuta() {
  return (
    <div className="w-full h-full bg-[#f8f9fb] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-gray-700">Mi Ruta — Hoy</p>
        <p className="text-[9px] text-gray-400">Martes · 14 clientes</p>
      </div>
      {[
        { nombre: 'Almacén La Esquina', dir: 'Mitre 450', estado: 'visitado', hora: '09:15' },
        { nombre: 'Super Martínez', dir: 'San Martín 1200', estado: 'en_curso', hora: '10:30' },
        { nombre: 'Kiosco del Centro', dir: 'Belgrano 88', estado: 'pendiente', hora: '11:00' },
        { nombre: 'Distribuidora Roma', dir: 'Italia 234', estado: 'pendiente', hora: '11:45' },
        { nombre: 'Minimarket Sol', dir: 'Córdoba 567', estado: 'pendiente', hora: '12:30' },
      ].map((c) => (
        <div key={c.nombre} className={`bg-white rounded-xl border px-3 py-2 flex items-center gap-2.5 shadow-sm ${c.estado === 'en_curso' ? 'border-blue-400' : 'border-gray-100'}`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${c.estado === 'visitado' ? 'bg-green-500' : c.estado === 'en_curso' ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-800 truncate">{c.nombre}</p>
            <p className="text-[9px] text-gray-400">{c.dir}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-gray-400">{c.hora}</p>
            <p className={`text-[8px] font-semibold ${c.estado === 'visitado' ? 'text-green-600' : c.estado === 'en_curso' ? 'text-blue-600' : 'text-gray-400'}`}>
              {c.estado === 'visitado' ? 'Listo' : c.estado === 'en_curso' ? 'En curso' : 'Pendiente'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Carrusel ─────────────────────────────────────────────────────────────────

const SLIDES = [
  { titulo: 'Dashboard en tiempo real', desc: 'Métricas de ventas, cobros y stock de toda la distribuidora en un solo panel.', mockup: <MockupDashboard /> },
  { titulo: 'Preventa desde el celular', desc: 'El preventista toma pedidos con catálogo completo y precios actualizados, con o sin señal.', mockup: <MockupCatalogo /> },
  { titulo: 'Control de stock inteligente', desc: 'Stock actual, alertas de mínimos y registro completo de movimientos por depósito.', mockup: <MockupStock /> },
  { titulo: 'Reportes de ventas', desc: 'Análisis por zona, preventista y producto. Tomá decisiones con datos reales.', mockup: <MockupReportes /> },
  { titulo: 'Ruta del día para preventistas', desc: 'Lista de clientes a visitar ordenada, con estado de cada visita actualizado en tiempo real.', mockup: <MockupRuta /> },
]

function Carrusel() {
  const [activo, setActivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  const siguiente = useCallback(() => setActivo((a) => (a + 1) % SLIDES.length), [])
  const anterior = useCallback(() => setActivo((a) => (a - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (pausado) return
    const t = setInterval(siguiente, 4000)
    return () => clearInterval(t)
  }, [pausado, siguiente])

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div
        className="relative bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-gray-200 overflow-hidden"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        {/* Header de la "ventana" */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-3 bg-white rounded-md border border-gray-200 text-[10px] text-gray-400 px-2 py-0.5 text-center">
            app.zonify.com.ar
          </div>
        </div>

        {/* Slide */}
        <div className="h-80 md:h-96 transition-all duration-300">
          {SLIDES[activo].mockup}
        </div>

        {/* Navegación */}
        <button
          onClick={anterior}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={siguiente}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Dots + descripción */}
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

// ── Tabla de planes (sin precios) ────────────────────────────────────────────

function TablaPlanes() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-4 text-gray-500 font-medium">Módulo</th>
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
              <tr key={mod} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
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

// ── Página ───────────────────────────────────────────────────────────────────

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
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          SaaS para distribuidoras mayoristas
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Tu distribuidora bajo control,{' '}
          <span className="text-blue-600">desde el celular</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Tus preventistas toman pedidos en la calle, el depósito los prepara y el chofer los entrega.
          Todo en un solo sistema, sin papel y sin perder una venta por falta de stock.
        </p>
        <a
          href={`mailto:${CONTACT}?subject=Quiero conocer Zonify`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200"
        >
          Agendar una llamada gratuita
        </a>
      </section>

      {/* Carrusel */}
      <section className="pb-20">
        <Carrusel />
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesitás en un solo lugar</h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
            Diseñado específicamente para distribuidoras mayoristas argentinas.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Smartphone className="w-6 h-6 text-blue-600" />, titulo: 'Preventa offline', desc: 'El preventista toma pedidos sin señal. Se sincronizan solos cuando vuelve la conexión.' },
              { icon: <PackageCheck className="w-6 h-6 text-blue-600" />, titulo: 'Stock en tiempo real', desc: 'Cada pedido descuenta el stock automáticamente. Sin sorpresas en el depósito.' },
              { icon: <Truck className="w-6 h-6 text-blue-600" />, titulo: 'Logística y entregas', desc: 'Hojas de ruta para choferes con estado de entrega por cliente.' },
              { icon: <BarChart3 className="w-6 h-6 text-blue-600" />, titulo: 'Reportes de ventas', desc: 'Qué vendió cada preventista, qué productos mueven más y en qué zonas.' },
              { icon: <ShieldCheck className="w-6 h-6 text-blue-600" />, titulo: 'Multiempresa seguro', desc: 'Cada distribuidora ve solo sus datos. Aislamiento total entre clientes.' },
              { icon: <Wifi className="w-6 h-6 text-blue-600" />, titulo: 'Funciona sin internet', desc: 'PWA instalable en el celular. Pedidos, cobros y rutas disponibles offline.' },
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
          <p className="text-gray-500 text-center mb-12">
            Desde distribuidoras que empiezan a digitalizar hasta operaciones de gran escala.
          </p>
          <TablaPlanes />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {[
              { q: '¿Necesito instalar algo?', a: 'No. Zonify es una aplicación web. Los preventistas pueden instalarla como app en su celular (PWA) en un clic, sin pasar por el App Store.' },
              { q: '¿Qué pasa si no hay internet en la calle?', a: 'Zonify funciona offline. Los pedidos, cobros y rutas se guardan en el celular y se sincronizan automáticamente cuando vuelve la señal.' },
              { q: '¿Cómo se contrata el servicio?', a: 'Agendás una llamada con nuestro equipo, analizamos tu operación y te configuramos el sistema a medida. No hay autoservicio — garantizamos que el onboarding sea exitoso.' },
              { q: '¿Mis datos están seguros?', a: 'Sí. Cada distribuidora tiene sus datos completamente aislados. Usamos Supabase con Row Level Security en todas las tablas.' },
              { q: '¿Puedo migrar mis productos y clientes existentes?', a: 'Sí. Durante el onboarding te ayudamos a importar tu catálogo y base de clientes desde Excel o tu sistema actual.' },
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
        <h2 className="text-3xl font-bold mb-4">¿Listo para ordenar tu distribuidora?</h2>
        <p className="text-blue-200 mb-8 max-w-md mx-auto">
          Agendá una llamada de 30 minutos. Te mostramos el sistema con tus datos reales.
        </p>
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
