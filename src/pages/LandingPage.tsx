import { Link } from 'react-router-dom'
import { Check, X, Truck, PackageCheck, BarChart3, Wifi, ShieldCheck, Smartphone } from 'lucide-react'
import { PLANES_META, type PlanKey } from '@/lib/planesConfig'

const PLANES: PlanKey[] = ['starter', 'pro', 'enterprise']

function PlanCard({ planKey }: { planKey: PlanKey }) {
  const plan = PLANES_META[planKey]
  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 ${plan.es_popular ? 'border-blue-500 shadow-xl shadow-blue-100' : 'border-gray-200'}`}>
      {plan.es_popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Más popular
        </span>
      )}
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{plan.nombre}</p>
      <div className="mt-3 mb-1">
        {plan.precio_usd !== null ? (
          <>
            <span className="text-4xl font-bold text-gray-900">{plan.precio_label}</span>
            <span className="text-gray-500 text-sm ml-1">/ mes</span>
          </>
        ) : (
          <span className="text-3xl font-bold text-gray-900">{plan.precio_label}</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">{plan.descripcion}</p>

      <Link
        to={planKey === 'enterprise' ? 'mailto:hola@zonify.app' : '/registro'}
        className={`text-center py-2.5 rounded-xl font-semibold text-sm transition-colors mb-6 ${
          plan.es_popular
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
        }`}
      >
        {planKey === 'enterprise' ? 'Contactar ventas' : 'Empezar gratis 14 días'}
      </Link>

      <ul className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
        {plan.features_negadas?.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
            <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">Zonify</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Probar gratis
            </Link>
          </div>
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/registro"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-2xl text-base transition-colors"
          >
            Empezar gratis — 14 días sin tarjeta
          </Link>
          <a
            href="#precios"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-8 py-3.5 rounded-2xl text-base transition-colors"
          >
            Ver precios
          </a>
        </div>
      </section>

      {/* Problema / Solución */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">El caos de gestionar sin sistema</h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
            Pedidos en papel, stock contado a mano y el preventista que no sabe qué hay en depósito.
            Zonify resuelve esto de raíz.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Smartphone className="w-6 h-6 text-blue-600" />,
                titulo: 'Preventa offline',
                desc: 'El preventista toma pedidos sin señal. Se sincronizan solos cuando vuelve la conexión.',
              },
              {
                icon: <PackageCheck className="w-6 h-6 text-blue-600" />,
                titulo: 'Stock en tiempo real',
                desc: 'Cada pedido descuenta el stock automáticamente. Sin sorpresas en el depósito.',
              },
              {
                icon: <Truck className="w-6 h-6 text-blue-600" />,
                titulo: 'Logística y entregas',
                desc: 'Hojas de ruta para choferes con estado de entrega por cliente.',
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
                titulo: 'Reportes de ventas',
                desc: 'Qué vendió cada preventista, qué productos mueven más y en qué zonas.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
                titulo: 'Multiempresa seguro',
                desc: 'Cada distribuidora ve solo sus datos. Aislamiento total entre clientes.',
              },
              {
                icon: <Wifi className="w-6 h-6 text-blue-600" />,
                titulo: 'Funciona sin internet',
                desc: 'PWA instalable en el celular. Pedidos, cobros y rutas disponibles offline.',
              },
            ].map((item) => (
              <div key={item.titulo} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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

      {/* Caso de éxito */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="bg-blue-600 rounded-3xl px-8 py-12 text-white text-center max-w-3xl mx-auto">
          <p className="text-3xl font-bold mb-4">"Antes perdíamos 2 horas por día contando stock. Ahora lo vemos en el momento."</p>
          <p className="text-blue-200 text-sm">Distribuidora de bebidas — Tucumán, Argentina</p>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Precios simples, sin sorpresas</h2>
          <p className="text-gray-500 text-center mb-12">Precio en USD. Facturación mensual. Cancelás cuando querés.</p>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANES.map((key) => <PlanCard key={key} planKey={key} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-10">Preguntas frecuentes</h2>
        <div className="space-y-6">
          {[
            {
              q: '¿Necesito instalar algo?',
              a: 'No. Zonify es una aplicación web que funciona desde el navegador. Los preventistas pueden instalarla como app en su celular (PWA) en un clic.',
            },
            {
              q: '¿Qué pasa si no tengo internet en la calle?',
              a: 'Zonify funciona offline. Los pedidos, cobros y rutas se guardan en el celular y se sincronizan automáticamente cuando vuelve la señal.',
            },
            {
              q: '¿Puedo probarlo antes de pagar?',
              a: 'Sí. Tenés 14 días de prueba gratuita con todas las funciones del plan Pro. Sin tarjeta de crédito.',
            },
            {
              q: '¿Mis datos están seguros?',
              a: 'Sí. Cada distribuidora tiene sus datos completamente aislados. Usamos Supabase con Row Level Security, el estándar de la industria.',
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-gray-100 pb-6">
              <p className="font-semibold text-gray-900 mb-2">{item.q}</p>
              <p className="text-gray-500 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-blue-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Empezá a ordenar tu distribuidora hoy</h2>
        <p className="text-blue-200 mb-8">14 días gratis. Sin tarjeta. Sin compromiso.</p>
        <Link
          to="/registro"
          className="bg-white text-blue-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors"
        >
          Crear cuenta gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Zonify · <a href="mailto:hola@zonify.app" className="hover:text-gray-600">hola@zonify.app</a></p>
      </footer>
    </div>
  )
}
