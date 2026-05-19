'use client'
import { useEffect, useRef } from 'react'

// ── Palette ──────────────────────────────────────────────────────
const H1='#2b1604',H2='#5c2e0a',H3='#8b4c1a'
const SK='#f5c49a',SD='#c47a50'
const G1='#111118',G2='#1e3a8a'
const J1='#0f0f1a',J2='#181828',J3='#222236'
const WH='#f0f0f0',WD='#c0c0c0'
const TR='#c01010',TD='#7a0000'
const SH='#0a0a14',SL='#1c1c30'
const N=null

// ── Full 32×20 character grid ─────────────────────────────────────
const GRID:(string|null)[][] = [
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

// Head-only pixels (rows 0-13, cols 3-14) — 12 cols × 14 rows
const HEAD:(string|null)[][] = GRID.slice(0, 14).map(row => row.slice(3, 15))

// ── Render helpers ────────────────────────────────────────────────
function drawChar(ctx: CanvasRenderingContext2D, px: number, ox: number, oy: number) {
  GRID.forEach((row, r) => row.forEach((c, col) => {
    if (!c) return
    ctx.fillStyle = c
    ctx.fillRect(ox + col * px, oy + r * px, px, px)
  }))
}

function drawHead(ctx: CanvasRenderingContext2D, px: number, ox: number, oy: number) {
  HEAD.forEach((row, r) => row.forEach((c, col) => {
    if (!c) return
    ctx.fillStyle = c
    ctx.fillRect(ox + col * px, oy + r * px, px, px)
  }))
}

function darkBg(ctx: CanvasRenderingContext2D, w: number, h: number, color = '#0d1117') {
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, h)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill; ctx.beginPath()
  ctx.roundRect(x, y, w, h, r); ctx.fill()
}

function textLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, weight = '700') {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  ctx.fillText(text, x, y)
}

// Sparkle dots for bull variant
function drawSparkles(ctx: CanvasRenderingContext2D, cx: number, cy: number, count: number, radius: number) {
  const colors = ['#fbbf24','#22c55e','#60a5fa','#f472b6','#a78bfa']
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const r = radius * (0.5 + Math.random() * 0.5)
    ctx.fillStyle = colors[i % colors.length]
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 3 + Math.random() * 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Rain lines for bear variant
function drawRain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(147,197,253,0.25)'; ctx.lineWidth = 1.5
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w, y = Math.random() * h
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 18); ctx.stroke()
  }
}

// ── Download helper ───────────────────────────────────────────────
function dl(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement('a')
  a.download = filename
  a.href = canvas.toDataURL('image/png')
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// ── Asset definitions ─────────────────────────────────────────────
interface Asset {
  id: string
  label: string
  desc: string
  filename: string
  w: number
  h: number
  draw: (ctx: CanvasRenderingContext2D) => void
  badge?: string
}

const ASSETS: Asset[] = [
  // ── Favicons ─────────────────────────────────────────────────────
  {
    id: 'fav32', label: 'Favicon 32×32', desc: 'Browser tab icon', filename: 'favicon-32.png',
    w: 32, h: 32, badge: 'Favicon',
    draw(ctx) {
      // Transparent background, head at px=2 (24px wide, centered)
      const px = 2, headW = 12 * px, headH = 14 * px
      drawHead(ctx, px, Math.round((32 - headW) / 2), Math.round((32 - headH) / 2))
    },
  },
  {
    id: 'fav64', label: 'Favicon 64×64', desc: 'High-DPI browser tab', filename: 'favicon-64.png',
    w: 64, h: 64, badge: 'Favicon',
    draw(ctx) {
      const px = 4, headW = 12 * px, headH = 14 * px
      drawHead(ctx, px, Math.round((64 - headW) / 2), Math.round((64 - headH) / 2))
    },
  },

  // ── App Icons ────────────────────────────────────────────────────
  {
    id: 'icon192', label: 'App Icon 192×192', desc: 'PWA / Android icon', filename: 'icon-192.png',
    w: 192, h: 192, badge: 'App Icon',
    draw(ctx) {
      roundRect(ctx, 0, 0, 192, 192, 38, '#0d1117')
      const px = 11, headW = 12 * px, headH = 14 * px
      drawHead(ctx, px, Math.round((192 - headW) / 2), Math.round((192 - headH) / 2) - 6)
    },
  },
  {
    id: 'icon512', label: 'App Icon 512×512', desc: 'Full-res app icon', filename: 'icon-512.png',
    w: 512, h: 512, badge: 'App Icon',
    draw(ctx) {
      // Gradient bg
      const grad = ctx.createLinearGradient(0, 0, 0, 512)
      grad.addColorStop(0, '#0d1117'); grad.addColorStop(1, '#161b22')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512)
      const px = 14, charW = 20 * px, charH = 32 * px
      drawChar(ctx, px, Math.round((512 - charW) / 2), Math.round((512 - charH) / 2) + 20)
      // Name below
      ctx.textAlign = 'center'
      textLabel(ctx, 'Mr. Guy', 256, 460, 28, '#ffffff', '800')
      ctx.textAlign = 'left'
    },
  },
  {
    id: 'apple', label: 'Apple Touch 180×180', desc: 'iOS home screen icon', filename: 'apple-touch-icon.png',
    w: 180, h: 180, badge: 'App Icon',
    draw(ctx) {
      roundRect(ctx, 0, 0, 180, 180, 0, '#1a237e')
      const px = 10, headW = 12 * px, headH = 14 * px
      drawHead(ctx, px, Math.round((180 - headW) / 2), Math.round((180 - headH) / 2) - 5)
    },
  },

  // ── OG / Social ──────────────────────────────────────────────────
  {
    id: 'og-default', label: 'OG Image — Default', desc: '1200×630 · og:image / link preview', filename: 'og-default.png',
    w: 1200, h: 630, badge: 'Social',
    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1200, 630)
      grad.addColorStop(0, '#0d1117'); grad.addColorStop(1, '#1a1f2e')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 630)
      // Subtle grid pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
      for (let x = 0; x < 1200; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 630); ctx.stroke() }
      for (let y = 0; y < 630; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke() }
      // Character
      const px = 14, charW = 20 * px, charH = 32 * px
      drawChar(ctx, px, 90, Math.round((630 - charH) / 2) + 10)
      // Text
      ctx.textAlign = 'left'
      textLabel(ctx, 'Mr. Guy', 440, 220, 88, '#ffffff', '800')
      textLabel(ctx, 'Your pixel-art finance sidekick.', 442, 278, 28, 'rgba(255,255,255,0.55)')
      // Accent line
      ctx.fillStyle = '#2563eb'; ctx.fillRect(440, 300, 420, 4)
      textLabel(ctx, 'Stocks  ·  Markets  ·  Insights', 442, 348, 22, 'rgba(255,255,255,0.35)')
      // Badge
      roundRect(ctx, 442, 390, 180, 40, 20, 'rgba(37,99,235,0.25)')
      ctx.strokeStyle = 'rgba(37,99,235,0.5)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.roundRect(442, 390, 180, 40, 20); ctx.stroke()
      textLabel(ctx, '📈  mr-guy.app', 466, 416, 16, '#93c5fd')
      ctx.textAlign = 'left'
    },
  },
  {
    id: 'og-bull', label: 'OG Image — Bull Mode', desc: '1200×630 · green market energy', filename: 'og-bull.png',
    w: 1200, h: 630, badge: 'Social',
    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1200, 630)
      grad.addColorStop(0, '#052e16'); grad.addColorStop(1, '#0a1628')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 630)
      drawSparkles(ctx, 600, 315, 50, 400)
      const px = 14, charW = 20 * px, charH = 32 * px
      drawChar(ctx, px, 90, Math.round((630 - charH) / 2) + 10)
      ctx.textAlign = 'left'
      textLabel(ctx, 'Mr. Guy 📈', 440, 220, 76, '#ffffff', '800')
      textLabel(ctx, "We're so back. Markets ripping.", 442, 275, 28, 'rgba(255,255,255,0.65)')
      ctx.fillStyle = '#22c55e'; ctx.fillRect(440, 298, 380, 4)
      textLabel(ctx, '🟢  Bull Mode Activated', 442, 345, 22, '#86efac')
      ctx.textAlign = 'left'
    },
  },
  {
    id: 'og-bear', label: 'OG Image — Bear Mode', desc: '1200×630 · bear market vibes', filename: 'og-bear.png',
    w: 1200, h: 630, badge: 'Social',
    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1200, 630)
      grad.addColorStop(0, '#1c0a0a'); grad.addColorStop(1, '#0d1117')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 630)
      drawRain(ctx, 1200, 630)
      const px = 14, charW = 20 * px, charH = 32 * px
      drawChar(ctx, px, 90, Math.round((630 - charH) / 2) + 10)
      ctx.textAlign = 'left'
      textLabel(ctx, 'Mr. Guy 📉', 440, 220, 76, '#ffffff', '800')
      textLabel(ctx, 'Everything is fine. I am fine.', 442, 275, 28, 'rgba(255,255,255,0.55)')
      ctx.fillStyle = '#ef4444'; ctx.fillRect(440, 298, 350, 4)
      textLabel(ctx, '🔴  Bear Market. Hold on.', 442, 345, 22, '#fca5a5')
      ctx.textAlign = 'left'
    },
  },

  // ── Profile ──────────────────────────────────────────────────────
  {
    id: 'profile', label: 'Profile Photo 400×400', desc: 'Twitter / Discord / Slack', filename: 'profile-400.png',
    w: 400, h: 400, badge: 'Profile',
    draw(ctx) {
      // Circular clip
      ctx.beginPath(); ctx.arc(200, 200, 200, 0, Math.PI * 2); ctx.clip()
      const grad = ctx.createRadialGradient(200, 160, 0, 200, 200, 280)
      grad.addColorStop(0, '#1a237e'); grad.addColorStop(1, '#0d1117')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 400, 400)
      const px = 22, headW = 12 * px, headH = 14 * px
      drawHead(ctx, px, Math.round((400 - headW) / 2), Math.round((400 - headH) / 2) - 10)
    },
  },
  {
    id: 'profile-sq', label: 'Profile Square 512×512', desc: 'LinkedIn / YouTube', filename: 'profile-512.png',
    w: 512, h: 512, badge: 'Profile',
    draw(ctx) {
      roundRect(ctx, 0, 0, 512, 512, 64, '#0d1117')
      const px = 26, headW = 12 * px, headH = 14 * px
      drawHead(ctx, px, Math.round((512 - headW) / 2), Math.round((512 - headH) / 2) - 14)
      ctx.textAlign = 'center'
      textLabel(ctx, 'Mr. Guy', 256, 470, 28, 'rgba(255,255,255,0.7)', '800')
      ctx.textAlign = 'left'
    },
  },

  // ── Banners ──────────────────────────────────────────────────────
  {
    id: 'twitter-banner', label: 'Twitter/X Banner', desc: '1500×500 · profile header', filename: 'banner-twitter.png',
    w: 1500, h: 500, badge: 'Banner',
    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1500, 500)
      grad.addColorStop(0, '#0d1117'); grad.addColorStop(0.5, '#1a1f2e'); grad.addColorStop(1, '#0d1117')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1500, 500)
      // Subtle dots
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.06})`
        ctx.beginPath(); ctx.arc(Math.random() * 1500, Math.random() * 500, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill()
      }
      // Two characters (mirrored) for the banner
      const px = 11, charH = 32 * px
      const y = Math.round((500 - charH) / 2) + 5
      drawChar(ctx, px, 60, y)
      // Right character (flipped via scale)
      ctx.save(); ctx.scale(-1, 1); ctx.translate(-1500, 0)
      drawChar(ctx, px, 60, y)
      ctx.restore()
      // Center text
      ctx.textAlign = 'center'
      textLabel(ctx, 'Mr. Guy', 750, 220, 72, '#ffffff', '800')
      textLabel(ctx, 'Markets · Research · Vibes', 750, 270, 22, 'rgba(255,255,255,0.4)')
      ctx.fillStyle = '#2563eb'; ctx.fillRect(550, 288, 400, 3)
      ctx.textAlign = 'left'
    },
  },
  {
    id: 'linkedin-banner', label: 'LinkedIn Banner', desc: '1584×396 · profile cover', filename: 'banner-linkedin.png',
    w: 1584, h: 396, badge: 'Banner',
    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1584, 0)
      grad.addColorStop(0, '#1a237e'); grad.addColorStop(1, '#0d1117')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1584, 396)
      const px = 9, charH = 32 * px
      drawChar(ctx, px, 60, Math.round((396 - charH) / 2) + 4)
      ctx.textAlign = 'left'
      textLabel(ctx, 'Mr. Guy', 280, 160, 64, '#ffffff', '800')
      textLabel(ctx, 'Your pixel-art finance sidekick', 282, 208, 22, 'rgba(255,255,255,0.5)')
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(280, 225, 460, 2)
      textLabel(ctx, 'Stocks  ·  Research  ·  Markets  ·  Smart Money', 282, 260, 16, 'rgba(255,255,255,0.35)')
      ctx.textAlign = 'left'
    },
  },
  {
    id: 'instagram', label: 'Instagram Square', desc: '1080×1080 · post / story', filename: 'instagram-1080.png',
    w: 1080, h: 1080, badge: 'Social',
    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1080)
      grad.addColorStop(0, '#0a0f1e'); grad.addColorStop(1, '#0d1117')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1080)
      // Corner sparkles
      drawSparkles(ctx, 200, 200, 20, 160)
      drawSparkles(ctx, 880, 200, 20, 160)
      const px = 18, charW = 20 * px, charH = 32 * px
      drawChar(ctx, px, Math.round((1080 - charW) / 2), Math.round((1080 - charH) / 2) - 30)
      ctx.textAlign = 'center'
      textLabel(ctx, 'Mr. Guy', 540, 880, 80, '#ffffff', '800')
      textLabel(ctx, 'Your financial sidekick', 540, 935, 28, 'rgba(255,255,255,0.45)')
      ctx.fillStyle = '#2563eb'; ctx.fillRect(340, 955, 400, 4)
      ctx.textAlign = 'left'
    },
  },
]

const BADGE_COLORS: Record<string, string> = {
  Favicon: '#854d0e',
  'App Icon': '#1e3a8a',
  Profile: '#581c87',
  Social: '#064e3b',
  Banner: '#1e293b',
}

// ── Component ─────────────────────────────────────────────────────
export default function GenerateAssetsPage() {
  const refs = useRef<Map<string, HTMLCanvasElement>>(new Map())

  useEffect(() => {
    // Use a fixed seed for sparkles/rain so renders are deterministic
    const origRandom = Math.random
    let seed = 42
    Math.random = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    ASSETS.forEach(asset => {
      const canvas = refs.current.get(asset.id)
      if (!canvas) return
      canvas.width = asset.w; canvas.height = asset.h
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, asset.w, asset.h)
      asset.draw(ctx)
    })
    Math.random = origRandom
  }, [])

  const groups = ['Favicon', 'App Icon', 'Profile', 'Social', 'Banner'] as const

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-10">
      {/* Header */}
      <div className="pt-6 space-y-1">
        <h1 className="text-3xl font-bold text-white">Asset Generator</h1>
        <p className="text-gray-500 text-sm">Download Mr. Guy in every format you need. All renders are crisp pixel-art PNG.</p>
      </div>

      {/* Download all */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => ASSETS.forEach(a => {
            const c = refs.current.get(a.id); if (c) dl(c, a.filename)
          })}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          ⬇ Download All ({ASSETS.length} files)
        </button>
        <p className="text-xs text-gray-500">Transparent background where applicable</p>
      </div>

      {/* Group by category */}
      {groups.map(group => {
        const items = ASSETS.filter(a => a.badge === group)
        if (!items.length) return null
        const bg = BADGE_COLORS[group] ?? '#1e293b'
        return (
          <div key={group}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{group}</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(asset => (
                <div key={asset.id} className="border border-gray-800 rounded-xl bg-gray-900/40 overflow-hidden">
                  {/* Preview */}
                  <div className="flex items-center justify-center bg-[#111] min-h-[140px] p-4"
                    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
                    <canvas
                      ref={el => { if (el) refs.current.set(asset.id, el) }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '140px',
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                      }}
                    />
                  </div>
                  {/* Info */}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{asset.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{asset.desc}</p>
                      <p className="text-xs text-gray-600 mt-1 font-mono">{asset.filename}</p>
                    </div>
                    <button
                      onClick={() => { const c = refs.current.get(asset.id); if (c) dl(c, asset.filename) }}
                      className="shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-gray-700"
                    >
                      ⬇ PNG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <p className="text-xs text-gray-700 text-center pt-4">All assets are generated locally in your browser — nothing is uploaded anywhere.</p>
    </div>
  )
}
