'use client'
import { useRef, useEffect } from 'react'

/**
 * Mr. Guy's pixel head — exact crop from the main character GRID
 * (rows 0–11, cols 3–14 = 12 wide × 12 tall).
 * Matches the full-body character in MarketCharacter and MrGuyMascot.
 */
const N = null
const H1 = '#2b1604', H2 = '#5c2e0a', H3 = '#8b4c1a'
const SK = '#f5c49a', SD = '#c47a50'
const G1 = '#111118', G2 = '#1e3a8a'

// GRID rows 0–11, cols 3–14 (verified pixel-by-pixel from MarketCharacter GRID)
const HEAD: Array<Array<string | null>> = [
  [N,  N,  H1, H1, H1, H1, H1, H1, H1, H1, H1, N ],  // row 0  — hair top
  [N,  H1, H2, H2, H2, H2, H2, H2, H2, H2, H1, H1],  // row 1
  [H1, H2, H3, H3, H3, H3, H3, H3, H3, H2, H2, H1],  // row 2
  [H1, H2, H2, H3, H3, H3, H3, H3, H2, H2, H2, H1],  // row 3
  [H1, H2, SK, SK, SK, SK, SK, SK, SK, SK, H2, H1],  // row 4  — forehead
  [H1, SK, SK, SK, SK, SK, SK, SK, SK, SK, SK, H1],  // row 5
  [H1, G1, G1, G2, G2, SK, SK, G2, G2, G1, G1, H1],  // row 6  — sunglasses
  [H1, G1, G1, G2, G2, G1, G1, G2, G2, G1, G1, H1],  // row 7
  [H1, G1, G1, G1, G1, SK, SK, G1, G1, G1, G1, H1],  // row 8
  [H1, SK, SK, SK, SK, SK, SK, SK, SK, SK, SK, H1],  // row 9  — cheeks / mouth
  [N,  SK, SK, SK, SD, SK, SK, SK, SK, SK, SK, N ],  // row 10 — chin (SD = nose shadow)
  [N,  SK, SK, SK, SK, SK, SK, SK, SK, SK, N,  N ],  // row 11 — neck
]

const W = 12
const H = 12

export default function MrGuyHead({ px = 4, className }: { px?: number; className?: string }) {
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
  return (
    <canvas
      ref={ref}
      width={W * px}
      height={H * px}
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}
