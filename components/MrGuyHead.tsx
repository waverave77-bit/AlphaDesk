'use client'
import { useRef, useEffect } from 'react'

/* Mr. Guy's pixel head — the 12×12 face (hair, sunglasses, smile, collar). */
const N = null
const HEAD: Array<Array<string | null>> = [
  [N, '#2b1604', '#2b1604', '#2b1604', '#2b1604', '#2b1604', '#2b1604', '#2b1604', '#2b1604', '#2b1604', N, N],
  ['#2b1604', '#5c2e0a', '#5c2e0a', '#5c2e0a', '#5c2e0a', '#5c2e0a', '#5c2e0a', '#5c2e0a', '#5c2e0a', '#2b1604', '#2b1604', N],
  ['#2b1604', '#5c2e0a', '#8b4c1a', '#8b4c1a', '#8b4c1a', '#8b4c1a', '#8b4c1a', '#8b4c1a', '#5c2e0a', '#5c2e0a', '#2b1604', N],
  ['#2b1604', '#5c2e0a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#5c2e0a', '#2b1604', N],
  ['#2b1604', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#2b1604', N],
  ['#2b1604', '#111118', '#111118', '#1e3a8a', '#1e3a8a', '#f5c49a', '#f5c49a', '#1e3a8a', '#1e3a8a', '#111118', '#2b1604', N],
  ['#2b1604', '#111118', '#111118', '#1e3a8a', '#1e3a8a', '#111118', '#111118', '#1e3a8a', '#1e3a8a', '#111118', '#2b1604', N],
  ['#2b1604', '#111118', '#111118', '#111118', '#111118', '#f5c49a', '#f5c49a', '#111118', '#111118', '#111118', '#2b1604', N],
  ['#2b1604', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#2b1604', N],
  [N, '#f5c49a', '#f5c49a', '#c47a50', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', '#f5c49a', N, N],
  [N, N, '#f5c49a', '#f0f0f0', '#f0f0f0', '#c01010', '#c01010', '#f0f0f0', '#f0f0f0', N, N, N],
  ['#f0f0f0', '#f0f0f0', '#f0f0f0', '#c01010', '#c01010', '#7a0000', '#7a0000', '#f0f0f0', '#f0f0f0', '#0f0f1a', '#181828', N],
]

export default function MrGuyHead({ px = 4 }: { px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, c.width, c.height)
    HEAD.forEach((row, r) =>
      row.forEach((col, c2) => {
        if (!col) return
        ctx.fillStyle = col
        ctx.fillRect(c2 * px, r * px, px, px)
      }),
    )
  }, [px])
  return <canvas ref={ref} width={12 * px} height={12 * px} style={{ imageRendering: 'pixelated', display: 'block' }} />
}
