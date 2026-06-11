'use client'
import { useRef, useEffect } from 'react'

/**
 * Mr. Guy's pixel head — cropped from the exact same GRID used by
 * MarketCharacter and MrGuyMascot (rows 0–13, cols 3–14 = 12×14).
 * This guarantees the head always matches the full-body character.
 */
const N = null
const H1 = '#2b1604', H2 = '#5c2e0a', H3 = '#8b4c1a'
const SK = '#f5c49a', SD = '#c47a50'
const G1 = '#111118', G2 = '#1e3a8a'
const J1 = '#0f0f1a', J2 = '#181828', J3 = '#222236'
const WH = '#f0f0f0', WD = '#c0c0c0'
const TR = '#c01010', TD = '#7a0000'

// Rows 0–13, cols 3–14 of the full character GRID (12 cols × 14 rows)
const HEAD: Array<Array<string | null>> = [
  [H2, H2, H2, H2, H2, H2, H2, H2, H1, N,  N,  N ],  // row 0
  [H2, H3, H3, H3, H3, H3, H3, H2, H2, H1, N,  N ],  // row 1
  [H2, H2, H3, H3, H3, H3, H3, H2, H2, H2, H1, N ],  // row 2
  [H2, SK, SK, SK, SK, SK, SK, SK, SK, H2, H1, N ],  // row 3
  [SK, SK, SK, SK, SK, SK, SK, SK, SK, SK, H1, N ],  // row 4
  [G1, G1, G2, G2, SK, SK, G2, G2, G1, G1, H1, N ],  // row 5 — glasses
  [G1, G1, G2, G2, G1, G1, G2, G2, G1, G1, H1, N ],  // row 6
  [G1, G1, G1, G1, SK, SK, G1, G1, G1, G1, H1, N ],  // row 7
  [SK, SK, SK, SK, SK, SK, SK, SK, SK, SK, H1, N ],  // row 8
  [SK, SK, SK, SD, SK, SK, SK, SK, SK, SK, N,  N ],  // row 9
  [SK, SK, SK, SK, SK, SK, SK, SK, SK, N,  N,  N ],  // row 10
  [N,  SK, WH, WH, TR, TR, WH, WH, SK, N,  N,  N ],  // row 11 — collar
  [J3, WH, WH, WH, TR, TR, TD, TD, WH, WH, WH, J3], // row 12
  [J2, J3, WH, WH, WH, TR, TD, WH, WH, WH, J3, J2], // row 13
]

const HEAD_W = 12
const HEAD_H = 14

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
  return (
    <canvas
      ref={ref}
      width={HEAD_W * px}
      height={HEAD_H * px}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}
