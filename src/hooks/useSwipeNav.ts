import { useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { NavItem } from '@/components/layout/navConfig'

const SWIPE_THRESHOLD = 60   // px horizontal mínimo
const VERTICAL_LIMIT  = 40   // px vertical máximo (evita activar en scroll)

export function useSwipeNav(items: NavItem[]) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const startX    = useRef<number>(0)
  const startY    = useRef<number>(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current)

    if (Math.abs(dx) < SWIPE_THRESHOLD || dy > VERTICAL_LIMIT) return

    const idx = items.findIndex((n) => n.to === location.pathname)
    if (idx === -1) return

    if (dx < 0 && idx < items.length - 1) navigate(items[idx + 1].to)  // swipe left → next
    if (dx > 0 && idx > 0)               navigate(items[idx - 1].to)  // swipe right → prev
  }, [items, location.pathname, navigate])

  return { onTouchStart, onTouchEnd }
}
