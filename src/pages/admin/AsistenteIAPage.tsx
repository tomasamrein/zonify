import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

const SUGERENCIAS = [
  '¿Qué productos tienen stock bajo?',
  '¿Cuáles son mis zonas con más ventas?',
  '¿Cómo registro un ingreso de stock?',
  '¿Cómo asigno un cliente a un preventista?',
  '¿Cómo exporto el reporte mensual?',
]

export default function AsistenteIAPage() {
  const empresa = useAuthStore((s) => s.empresa)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim()
    if (!msg || cargando) return

    const nuevosMensajes: Mensaje[] = [...mensajes, { role: 'user', content: msg }]
    setMensajes(nuevosMensajes)
    setInput('')
    setCargando(true)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('zonify-ai', {
        body: {
          messages: nuevosMensajes,
          contexto: `Empresa: ${empresa?.nombre ?? ''}. Plan: ${empresa?.plan ?? ''}.`,
        },
      })

      if (fnError) throw fnError

      setMensajes([...nuevosMensajes, { role: 'assistant', content: data.respuesta }])
    } catch (err) {
      setError('No se pudo conectar con el asistente. Verificá que la función esté desplegada en Supabase.')
      setMensajes(mensajes)
    } finally {
      setCargando(false)
      inputRef.current?.focus()
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
        <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-ink)]">Asistente IA</h1>
          <p className="text-xs text-[var(--color-ink-muted)]">Powered by Claude · Zonify Enterprise</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {mensajes.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-brand-400" />
            </div>
            <p className="font-semibold text-[var(--color-ink)] mb-1">¿En qué te puedo ayudar?</p>
            <p className="text-sm text-[var(--color-ink-muted)] mb-6">
              Preguntame sobre el sistema, tus datos o cómo usar alguna función.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 hover:border-brand-400 hover:text-brand-600 transition-colors text-[var(--color-ink-muted)] text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              m.role === 'user'
                ? 'bg-brand-600 text-white'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)]'
            }`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-ink)] rounded-tl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[var(--color-ink-muted)]" />
            </div>
            <div className="bg-[var(--color-surface-muted)] rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Error de conexión</p>
              <p className="text-xs mt-0.5">{error}</p>
              <p className="text-xs mt-1 text-red-500">
                Desplegá la función: <code className="font-mono bg-red-100 px-1 rounded">supabase functions deploy zonify-ai</code>
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribí tu pregunta... (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={() => enviar()}
            disabled={!input.trim() || cargando}
            className="w-11 h-11 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] mt-2 text-center">
          El asistente puede cometer errores. Verificá información importante en el sistema.
        </p>
      </div>
    </div>
  )
}
