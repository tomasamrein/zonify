import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const selectId = id ?? `sel-${Math.random().toString(36).slice(2, 7)}`
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-11 rounded-xl border bg-[var(--color-surface)] text-sm px-3.5',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
            error
              ? 'border-red-400 focus:ring-red-500'
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-ink-muted)]',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">{hint}</p>
        ) : null}
      </div>
    )
  },
)
Select.displayName = 'Select'
