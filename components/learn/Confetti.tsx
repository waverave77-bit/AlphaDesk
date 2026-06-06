'use client'
import { useEffect, useRef } from 'react'

/**
 * Lightweight confetti burst on a full-screen canvas. No dependency.
 * Mounts → fires once → fades out. Place it conditionally (e.g. on a results
 * screen). `origin` is 0–1 fractional viewport position the burst springs from.
 */
type Particle = {
  x: number; y: number; vx: number; vy: number
  rot: number; vrot: number; size: number; color: string; life: number
}

const COLORS = ['#3b82f6', '#58cc02', '#f59e0b', '#ec4899', '#a855f7', '#10b981', '#ef4444', '#fbbf24']

export default function Confetti({ count = 140, origin = { x: 0.5, y: 0.35 } }: { count?: number; origin?: { x: number; y: number } }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const ox = W * origin.x
    const oy = H * origin.y
    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 9
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6, // bias upward
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 8,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1,
      }
    })

    let raf = 0
    const gravity = 0.32
    const drag = 0.99
    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of particles) {
        p.vy += gravity
        p.vx *= drag
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vrot
        p.life -= 0.008
        if (p.life > 0 && p.y < H + 40) {
          alive = true
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      }
      if (alive) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [count, origin.x, origin.y])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}
    />
  )
}
