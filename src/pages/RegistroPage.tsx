import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, Hash, Lock, User, Mail, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

type PlanKey = 'preventista' | 'completo' | 'facturacion'

const PLANES: { key: PlanKey; nombre: string; descripcion: string; features: string[] }[] = [
  {
    key: 'preventista',
    nombre: 'Preventista',
    descripcion: 'Para distribuidoras con vendedores en calle',
    features: ['Preventa y pedidos', 'Control de stock', 'Cobros y rendición', 'Reportes'],
  },
  {
    key: 'completo',
    nombre: 'Completo',
    descripcion: 'Flujo completo de distribución',
    features: ['Todo el plan Preventista', 'Depósito y preparación', 'Logística y entregas', 'Facturación electrónica'],
  },
  {
    key: 'facturacion',
    nombre: 'Facturación',
    descripcion: 'Solo facturación y gestión de stock',
    features: ['Gestión de productos y precios', 'Control de stock', 'Facturación / comprobantes', 'Reportes de ventas'],
  },
]

interface FormState {
  // Paso 1: empresa
  nombre: string
  slug: string
  cuit: string
  email: string
  // Paso 2: admin
  nombre_admin: string
  codigo_admin: string
  password: string
  confirmar_password: string
  // Paso 3: plan
  plan: PlanKey
}

const INITIAL: FormState = {
  nombre: '',
  slug: '',
  cuit: '',
  email: '',
  nombre_admin: '',
  codigo_admin: '',
  password: '',
  confirmar_password: '',
  plan: 'preventista',
}

export default function RegistroPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [slugDisponible, setSlugDisponible] = useState<boolean | null>(null)
  const [verificandoSlug, setVerificandoSlug] = useState(false)
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (user) return <Navigate to="/" replace />

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(null)
  }

  // Verificación de slug con debounce
  useEffect(() => {
    const slug = form.slug.trim()
    if (!slug) { setSlugDisponible(null); return }

    if (slugTimer.current) clearTimeout(slugTimer.current)
    setVerificandoSlug(true)
    setSlugDisponible(null)

    slugTimer.current = setTimeout(async () => {
      const { data } = await supabase.rpc('verificar_slug_disponible', { p_slug: slug })
      setSlugDisponible(data ?? false)
      setVerificandoSlug(false)
    }, 500)

    return () => { if (slugTimer.current) clearTimeout(slugTimer.current) }
  }, [form.slug])

  function slugFromNombre(nombre: string) {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function validarPaso1(): string | null {
    if (!form.nombre.trim()) return 'El nombre de la empresa es requerido'
    if (!form.slug.trim()) return 'El identificador es requerido'
    if (!/^[a-z0-9-]+$/.test(form.slug)) return 'El identificador solo puede tener letras minúsculas, números y guiones'
    if (slugDisponible === false) return 'Ese identificador ya está en uso'
    if (slugDisponible === null) return 'Verificando disponibilidad del identificador...'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Ingresá un email válido'
    return null
  }

  function validarPaso2(): string | null {
    if (!form.nombre_admin.trim()) return 'El nombre del administrador es requerido'
    if (!form.codigo_admin.trim()) return 'El código de vendedor es requerido'
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (form.password !== form.confirmar_password) return 'Las contraseñas no coinciden'
    return null
  }

  function avanzar() {
    const err = paso === 1 ? validarPaso1() : paso === 2 ? validarPaso2() : null
    if (err) { setError(err); return }
    setPaso((p) => p + 1)
    setError(null)
  }

  async function registrar() {
    setCargando(true)
    setError(null)
    try {
      const email = `${form.codigo_admin}@${form.slug}.com`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: form.password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      const { error: rpcError } = await supabase.rpc('crear_empresa_con_admin', {
        p_nombre: form.nombre.trim(),
        p_slug: form.slug.trim(),
        p_cuit: form.cuit.trim(),
        p_email: form.email.trim(),
        p_nombre_admin: form.nombre_admin.trim(),
        p_codigo_admin: form.codigo_admin.trim(),
        p_user_id: authData.user.id,
        p_plan: form.plan,
      })
      if (rpcError) throw rpcError

      // Si Supabase requiere confirmación de email, hacemos sign-in explícito
      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: form.password })
        if (signInError) {
          // La empresa fue creada igual, solo avisamos que deben iniciar sesión
          setPaso(4)
          return
        }
      }

      setPaso(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la empresa')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-600 items-center justify-center text-white font-bold text-3xl shadow-[var(--shadow-float)] mb-4">
            Z
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Registrar distribuidora</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">Creá tu cuenta en Zonify</p>
        </div>

        {/* Indicador de pasos */}
        {paso < 4 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((p) => (
              <div key={p} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  paso === p ? 'bg-brand-600 text-white' :
                  paso > p  ? 'bg-brand-100 text-brand-600' :
                               'bg-[var(--color-border)] text-[var(--color-ink-muted)]'
                )}>
                  {paso > p ? <CheckCircle2 className="w-4 h-4" /> : p}
                </div>
                {p < 3 && <div className={cn('w-8 h-0.5 transition-colors', paso > p ? 'bg-brand-600' : 'bg-[var(--color-border)]')} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">

          {/* Paso 1: Datos de la empresa */}
          {paso === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[var(--color-ink)] mb-1">Datos de la empresa</h2>

              <Input
                label="Nombre de la empresa"
                value={form.nombre}
                onChange={(e) => {
                  set('nombre', e.target.value)
                  if (!form.slug || form.slug === slugFromNombre(form.nombre)) {
                    set('slug', slugFromNombre(e.target.value))
                  }
                }}
                leftIcon={<Building2 className="w-4 h-4" />}
                placeholder="Distribuidora El Norte"
                required
              />

              <div>
                <Input
                  label="Identificador único (slug)"
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  leftIcon={<Hash className="w-4 h-4" />}
                  placeholder="distribuidora-el-norte"
                  hint="Solo minúsculas, números y guiones. Ej: el-norte"
                  required
                />
                {form.slug && (
                  <div className={cn('text-xs mt-1 flex items-center gap-1', verificandoSlug ? 'text-[var(--color-ink-muted)]' : slugDisponible ? 'text-green-600' : 'text-red-600')}>
                    {verificandoSlug ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     slugDisponible ? <CheckCircle2 className="w-3 h-3" /> : null}
                    {verificandoSlug ? 'Verificando...' : slugDisponible === true ? 'Disponible' : slugDisponible === false ? 'Ya está en uso' : ''}
                  </div>
                )}
              </div>

              <Input
                label="CUIT (opcional)"
                value={form.cuit}
                onChange={(e) => set('cuit', e.target.value)}
                placeholder="20-12345678-9"
                inputMode="numeric"
              />

              <Input
                label="Email de contacto"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="admin@minegocio.com"
                required
              />
            </div>
          )}

          {/* Paso 2: Usuario administrador */}
          {paso === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[var(--color-ink)] mb-1">Usuario administrador</h2>
              <p className="text-sm text-[var(--color-ink-muted)] -mt-2 mb-2">
                Este usuario tendrá acceso total a la configuración.
              </p>

              <Input
                label="Nombre completo"
                value={form.nombre_admin}
                onChange={(e) => set('nombre_admin', e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="Juan Pérez"
                required
              />

              <Input
                label="Código de vendedor (para ingresar)"
                value={form.codigo_admin}
                onChange={(e) => set('codigo_admin', e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                placeholder="Ej: admin"
                hint={`Ingresarás como: ${form.codigo_admin || 'tu-codigo'}@${form.slug || 'tu-empresa'}.com`}
                required
              />

              <Input
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                placeholder="Mínimo 8 caracteres"
                required
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                value={form.confirmar_password}
                onChange={(e) => set('confirmar_password', e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                placeholder="Repetí la contraseña"
                required
              />
            </div>
          )}

          {/* Paso 3: Selección de plan */}
          {paso === 3 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-[var(--color-ink)] mb-1">Elegí tu plan</h2>
              <p className="text-sm text-[var(--color-ink-muted)] -mt-2 mb-2">
                Podés cambiarlo después desde la configuración.
              </p>

              {PLANES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => set('plan', p.key)}
                  className={cn(
                    'w-full text-left rounded-xl border-2 p-4 transition-all',
                    form.plan === p.key
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-[var(--color-border)] hover:border-brand-300'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CreditCard className={cn('w-4 h-4', form.plan === p.key ? 'text-brand-600' : 'text-[var(--color-ink-muted)]')} />
                        <span className="font-semibold text-[var(--color-ink)]">{p.nombre}</span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 mb-2">{p.descripcion}</p>
                      <ul className="space-y-0.5">
                        {p.features.map((f) => (
                          <li key={f} className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1">
                            <CheckCircle2 className={cn('w-3 h-3 flex-shrink-0', form.plan === p.key ? 'text-brand-600' : 'text-[var(--color-border)]')} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {form.plan === p.key && (
                      <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Paso 4: Éxito */}
          {paso === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex w-16 h-16 rounded-full bg-green-100 items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">¡Empresa creada!</h2>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                  <strong>{form.nombre}</strong> está lista para usar.
                </p>
              </div>
              <Button size="lg" className="w-full" onClick={() => navigate('/')}>
                Ir al Dashboard
              </Button>
            </div>
          )}

          {/* Error */}
          {error && paso < 4 && (
            <div role="alert" className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Navegación */}
          {paso < 4 && (
            <div className={cn('flex gap-3 mt-5', paso === 1 ? 'justify-end' : 'justify-between')}>
              {paso > 1 && (
                <Button variant="outline" onClick={() => { setPaso((p) => p - 1); setError(null) }}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
              )}
              {paso < 3 ? (
                <Button onClick={avanzar}>
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button loading={cargando} onClick={registrar}>
                  Crear empresa
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-ink-muted)] mt-6">
          ¿Ya tenés una cuenta?{' '}
          <a href="/login" className="text-brand-600 hover:underline">Iniciá sesión</a>
        </p>
      </div>
    </div>
  )
}
