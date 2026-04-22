import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Building2, Hash, Lock, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const { user, cargando, loginVendedor, loginEmail } = useAuthStore()
  const [slug, setSlug]           = useState('')
  const [codigo, setCodigo]       = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modoEmail, setModoEmail] = useState(false)
  const [email, setEmail]         = useState('')

  if (user) return <Navigate to={modoEmail ? '/superadmin' : '/dashboard'} replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (modoEmail) {
        await loginEmail(email, password)
      } else {
        await loginVendedor(slug, codigo, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-600 items-center justify-center text-white font-bold text-3xl shadow-[var(--shadow-float)] mb-4">
            Z
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Zonify</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">Ingresá a tu distribuidora</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {modoEmail ? (
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="tu@email.com"
              />
            ) : (
              <>
                <Input
                  label="Empresa"
                  type="text"
                  autoComplete="organization"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                  placeholder="nombre-distribuidora"
                  hint="El nombre de tu distribuidora (sin espacios)"
                />
                <Input
                  label="Código de vendedor"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  leftIcon={<Hash className="w-4 h-4" />}
                  placeholder="Ej: 101"
                />
              </>
            )}

            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
            />

            {error && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full mt-2"
            >
              Ingresar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-ink-muted)] mt-6">
          ¿Problemas para acceder? Contactá a tu administrador.
        </p>
        <p className="text-center text-xs text-[var(--color-ink-muted)] mt-1">
          <button
            type="button"
            onClick={() => { setModoEmail((v) => !v); setError(null) }}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline underline-offset-2"
          >
            {modoEmail ? 'Volver al login de distribuidora' : 'Acceso de administrador'}
          </button>
        </p>
        <p className="text-center text-xs text-[var(--color-ink-muted)] mt-2">
          ¿Empresa nueva?{' '}
          <a href="/registro" className="text-brand-600 hover:underline">Registrá tu distribuidora</a>
        </p>
      </div>
    </div>
  )
}
