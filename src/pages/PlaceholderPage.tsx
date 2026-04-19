import { type LucideIcon } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-xs">{description}</p>
      </div>
      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        Próximamente
      </span>
    </div>
  )
}
