import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  subtle?: boolean
}

const tones: Record<Tone, { solid: string; subtle: string }> = {
  neutral: { solid: 'bg-[var(--color-ink)] text-white', subtle: 'bg-[var(--color-surface-soft)] text-[var(--color-ink-soft)]' },
  brand:   { solid: 'bg-brand-600 text-white',         subtle: 'bg-brand-50 text-brand-700' },
  success: { solid: 'bg-emerald-600 text-white',       subtle: 'bg-emerald-50 text-emerald-700' },
  warning: { solid: 'bg-amber-500 text-white',         subtle: 'bg-amber-50 text-amber-700' },
  danger:  { solid: 'bg-red-600 text-white',           subtle: 'bg-red-50 text-red-700' },
  info:    { solid: 'bg-sky-600 text-white',           subtle: 'bg-sky-50 text-sky-700' },
}

export function Badge({ tone = 'neutral', subtle = true, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-0.5',
        subtle ? tones[tone].subtle : tones[tone].solid,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
