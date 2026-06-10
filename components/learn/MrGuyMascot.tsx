'use client'
import { useRef, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { OUTFITS } from '@/lib/outfits'

/**
 * Full-body, reactive Mr. Guy for the Learn experience.
 * Ports the real character sprite (from MarketCharacter) into a standalone
 * animated canvas with moods: idle / happy / sad / celebrate / think.
 * This is the personality — he reacts to right/wrong/finish.
 */
const N = null
const H1 = '#2b1604', H2 = '#5c2e0a', H3 = '#8b4c1a'
const SK = '#f5c49a', SD = '#c47a50'
const G1 = '#111118', G2 = '#1e3a8a'
const J1 = '#0f0f1a', J2 = '#181828', J3 = '#222236'
const WH = '#f0f0f0', WD = '#c0c0c0'
const TR = '#c01010', TD = '#7a0000'
const SH = '#0a0a14', SL = '#1c1c30'

type Color = string | null
const GRID: Color[][] = [
  [N,N,N,N,N,H1,H1,H1,H1,H1,H1,H1,H1,H1,N,N,N,N,N,N],
  [N,N,N,N,H1,H2,H2,H2,H2,H2,H2,H2,H2,H1,H1,N,N,N,N,N],
  [N,N,N,H1,H2,H3,H3,H3,H3,H3,H3,H3,H2,H2,H1,N,N,N,N,N],
  [N,N,N,H1,H2,H2,H3,H3,H3,H3,H3,H2,H2,H2,H1,N,N,N,N,N],
  [N,N,N,H1,H2,SK,SK,SK,SK,SK,SK,SK,SK,H2,H1,N,N,N,N,N],
  [N,N,N,H1,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,H1,N,N,N,N,N],
  [N,N,N,H1,G1,G1,G2,G2,SK,SK,G2,G2,G1,G1,H1,N,N,N,N,N],
  [N,N,N,H1,G1,G1,G2,G2,G1,G1,G2,G2,G1,G1,H1,N,N,N,N,N],
  [N,N,N,H1,G1,G1,G1,G1,SK,SK,G1,G1,G1,G1,H1,N,N,N,N,N],
  [N,N,N,H1,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,H1,N,N,N,N,N],
  [N,N,N,N,SK,SK,SK,SD,SK,SK,SK,SK,SK,SK,N,N,N,N,N,N],
  [N,N,N,N,SK,SK,SK,SK,SK,SK,SK,SK,SK,N,N,N,N,N,N,N],
  [N,N,N,N,N,SK,WH,WH,TR,TR,WH,WH,SK,N,N,N,N,N,N,N],
  [N,N,J2,J3,WH,WH,WH,TR,TR,TD,TD,WH,WH,WH,J3,J2,N,N,N,N],
  [N,J1,J2,J3,WH,WH,WH,WH,TR,TD,WH,WH,WH,WH,J3,J2,J1,N,N,N],
  [J1,J1,J2,J3,WH,WH,WH,WH,TR,TD,WH,WH,WH,WH,J3,J2,J1,J1,N,N],
  [N,J1,J2,J3,J3,J3,J3,J3,TR,TD,J3,J3,J3,J3,J2,J1,N,N,N,N],
  [N,J1,J2,J3,J3,J3,J3,J3,TR,TD,J3,J3,J3,J3,J2,J1,N,N,N,N],
  [N,J1,J2,J3,J3,J3,J3,J3,TR,TD,J3,J3,J3,J3,J2,J1,N,N,N,N],
  [N,J1,J2,J3,J3,J3,J3,J3,TR,TD,J3,J3,J3,J3,J2,J1,N,N,N,N],
  [N,J1,J2,J3,J3,J3,J3,J3,TR,J3,J3,J3,J3,J3,J2,J1,N,N,N,N],
  [WD,WH,J2,J3,J3,J3,J3,J3,J3,J3,J3,J3,J3,J3,J2,WH,WD,N,N,N],
  [SK,SK,J2,J3,J3,J3,J3,J3,J3,J3,J3,J3,J3,J3,J2,SK,SK,N,N,N],
  [SK,SK,J1,J2,J3,J3,J3,J3,J3,J3,J3,J3,J3,J2,J1,SK,SK,N,N,N],
  [N,N,J1,J2,J2,J3,J3,J3,J3,J3,J3,J3,J2,J2,J1,N,N,N,N,N],
  [N,N,J1,J2,J2,J2,J3,J3,J3,J3,J3,J2,J2,J2,J1,N,N,N,N,N],
  [N,N,N,J1,J2,J2,N,N,N,N,N,J2,J2,J1,N,N,N,N,N,N],
  [N,N,N,J1,J2,J2,N,N,N,N,N,J2,J2,J1,N,N,N,N,N,N],
  [N,N,N,J1,J2,J2,N,N,N,N,N,J2,J2,J1,N,N,N,N,N,N],
  [N,N,N,J1,J1,J2,N,N,N,N,N,J2,J1,J1,N,N,N,N,N,N],
  [N,J1,SH,SH,SH,SH,SL,N,N,SL,SH,SH,SH,SH,J1,N,N,N,N,N],
  [SH,SH,SH,SH,SH,SH,SL,N,N,SL,SH,SH,SH,SH,SH,SH,N,N,N,N],
]

export type Mood = 'idle' | 'happy' | 'sad' | 'celebrate' | 'think'
type Pose = { bodyDY: number; bounce: number; shakeX: number; lArm: number; rArm: number; lLeg: number; rLeg: number }

function poseFor(mood: Mood, t: number): Pose {
  switch (mood) {
    case 'happy': // arms thrown up, slow gentle hops
      return { bodyDY: 0, bounce: Math.round(Math.abs(Math.sin(t * 3)) * -3), shakeX: 0,
        lArm: -10, rArm: -10, lLeg: 0, rLeg: 0 }
    case 'celebrate': // big jumps + pumping arms + kicking legs
      return { bodyDY: 0, bounce: Math.round(Math.abs(Math.sin(t * 4)) * -7), shakeX: 0,
        lArm: Math.round(Math.sin(t * 7) * -9), rArm: Math.round(Math.sin(t * 7 + Math.PI) * -9),
        lLeg: Math.round(Math.sin(t * 7) * 2), rLeg: Math.round(Math.sin(t * 7 + Math.PI) * 2) }
    case 'sad': // slumped, slow head-shake
      return { bodyDY: 2, bounce: 0, shakeX: Math.round(Math.sin(t * 9) * 1.2),
        lArm: 3, rArm: 3, lLeg: 0, rLeg: 0 }
    case 'think': // one arm up to chin, slow sway
      return { bodyDY: Math.round(Math.sin(t * 1.4) * 0.5), bounce: 0, shakeX: 0,
        lArm: 0, rArm: -6, lLeg: 0, rLeg: 0 }
    default: // idle — slow breathing bob
      return { bodyDY: 0, bounce: Math.round(Math.abs(Math.sin(t * 1.1)) * -1.2), shakeX: 0,
        lArm: Math.round(Math.sin(t * 1.1) * 1), rArm: Math.round(Math.sin(t * 1.1 + Math.PI) * 1), lLeg: 0, rLeg: 0 }
  }
}

export default function MrGuyMascot({ mood = 'idle', px = 4, flip = false }: { mood?: Mood; px?: number; flip?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const moodRef = useRef(mood)
  moodRef.current = mood
  const { outfit } = useTheme()
  const outfitRef = useRef(outfit)
  outfitRef.current = outfit

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const W = canvas.width, H = canvas.height
    const oy = 9 * px // top headroom so jumps/raised arms aren't clipped
    let raf = 0
    const dir = flip ? -1 : 1
    const start = performance.now()

    const draw = () => {
      const t = (performance.now() - start) / 1000
      const p = poseFor(moodRef.current, t)
      const outfit = outfitRef.current ? OUTFITS[outfitRef.current] : null
      ctx.clearRect(0, 0, W, H)
      for (let r = 0; r < GRID.length; r++) {
        for (let c = 0; c < 20; c++) {
          let color = GRID[r][c]
          if (!color) continue
          if (outfit && outfit.suit[color]) color = outfit.suit[color]
          const dc = dir === -1 ? 19 - c : c
          let cx = dc * px + p.shakeX * (px / 4)
          let cy = oy + r * px + (p.bodyDY + p.bounce) * px
          const isLA = r >= 21 && r <= 23 && c <= 1
          const isRA = r >= 21 && r <= 23 && c >= 15
          if (isLA) cy += p.lArm * px
          if (isRA) cy += p.rArm * px
          const isLL = r >= 24 && r <= 27 && c >= 3 && c <= 5
          const isRL = r >= 24 && r <= 27 && c >= 11 && c <= 13
          const isLS = r >= 28 && c <= 6
          const isRS = r >= 28 && c >= 9 && c <= 15
          if (isLL || isLS) cx += p.lLeg * px
          if (isRL || isRS) cx += p.rLeg * px
          if (cx < 0 || cy < 0 || cx + px > W || cy + px > H) continue
          ctx.fillStyle = color
          ctx.fillRect(cx, cy, px, px)
        }
      }
      // Pro outfit (hat) — drawn over the head, moving with the body bob.
      if (outfit) {
        for (const [hr, hc, color] of outfit.hat) {
          const dc = dir === -1 ? 19 - hc : hc
          const cx = dc * px + p.shakeX * (px / 4)
          const cy = oy + hr * px + (p.bodyDY + p.bounce) * px
          if (cx < 0 || cy < 0 || cx + px > W || cy + px > H) continue
          ctx.fillStyle = color
          ctx.fillRect(cx, cy, px, px)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [px, flip])

  // Canvas height = sprite (32 rows) + top headroom (9 rows) for jumps/raised arms.
  return <canvas ref={ref} width={20 * px} height={(32 + 9) * px} style={{ imageRendering: 'pixelated', display: 'block' }} />
}
