'use client'
import { useEffect, useRef, useState } from 'react'

/** Animated number tick-up from 0 → value (easeOut), for XP reveals etc. */
export default function CountUp({
  value,
  duration = 900,
  delay = 0,
  className = '',
  prefix = '',
  onTick,
}: {
  value: number
  duration?: number
  delay?: number
  className?: string
  prefix?: string
  onTick?: () => void
}) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)
  const lastWhole = useRef(0)

  useEffect(() => {
    let startedAt = 0
    const start = (ts: number) => {
      if (!startedAt) startedAt = ts
      const elapsed = ts - startedAt
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const current = value * eased
      setDisplay(current)
      const whole = Math.floor(current)
      if (whole !== lastWhole.current) { lastWhole.current = whole; onTick?.() }
      if (t < 1) raf.current = requestAnimationFrame(start)
    }
    const timer = setTimeout(() => { raf.current = requestAnimationFrame(start) }, delay)
    return () => { clearTimeout(timer); if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, duration, delay, onTick])

  return <span className={className}>{prefix}{Math.round(display)}</span>
}
