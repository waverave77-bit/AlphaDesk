'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

/* ─── Palette ──────────────────────────────────────────────────────── */
const N  = null
const H1 = '#2b1604', H2 = '#5c2e0a', H3 = '#8b4c1a'
const SK = '#f5c49a', SD = '#c47a50'
const G1 = '#111118', G2 = '#1e3a8a'
const J1 = '#0f0f1a', J2 = '#181828', J3 = '#222236'
const WH = '#f0f0f0', WD = '#c0c0c0'
const TR = '#c01010', TD = '#7a0000'
const SH = '#0a0a14', SL = '#1c1c30'

const NG1 = '#c8dff0', NG2 = '#daeaf8', NG3 = '#eaf4fd'
const NC  = '#f0f8ff'

type Color = string | null
type MarketState = 'bull' | 'bear' | 'neutral' | 'closed'
type Scene = 'walk' | 'party' | 'beach' | 'desk' | 'throw' | 'sleep' | 'perch'
           | 'newspaper' | 'weights' | 'gaming' | 'doomscroll' | 'panicrun'
           | 'money' | 'defeat'
           | 'wakeup' | 'peek' | 'coffee' | 'phone' | 'bubblebath'

/* ─── Constants ────────────────────────────────────────────────────── */
const PX     = 5
const CHAR_W = 20 * PX   // 100
const CHAR_H = 32 * PX   // 160
const CONTENT_MAX = 1024
const CONTENT_PAD = 24

function sideZones(W: number) {
  const cl = Math.max(CONTENT_PAD, (W - CONTENT_MAX) / 2)
  const cr = W - cl
  return {
    L: { min: 6, max: Math.max(7, cl - CHAR_W - 18), ok: cl > CHAR_W + 32 },
    R: { min: Math.min(cr + 10, W - CHAR_W - 7), max: W - CHAR_W - 6, ok: cr < W - CHAR_W - 20 },
  }
}

/* ─── Scene cycles ─────────────────────────────────────────────────── */
const MIN = 60_000  // 1 minute in ms
const SCENE_CYCLES: Record<MarketState, Array<{ scene: Scene; ms: number }>> = {
  bull:    [
    { scene: 'walk',       ms: 15_000   },  // short transition ~15s
    { scene: 'party',      ms:  8 * MIN },
    { scene: 'walk',       ms: 15_000   },
    { scene: 'beach',      ms:  9 * MIN },
    { scene: 'walk',       ms: 15_000   },
    { scene: 'weights',    ms:  8 * MIN },
  ],
  bear: [
    { scene: 'defeat',     ms:  8 * MIN },
    { scene: 'desk',       ms:  8 * MIN },
    { scene: 'defeat',     ms:  8 * MIN },
    { scene: 'throw',      ms:  8 * MIN },
    { scene: 'doomscroll', ms:  7 * MIN },
    { scene: 'panicrun',   ms:  6 * MIN },
  ],
  neutral: [
    { scene: 'walk',       ms: 10_000   },  // short transition ~10s, then into real scenes
    { scene: 'newspaper',  ms:  8 * MIN },
    { scene: 'coffee',     ms:  7 * MIN },
    { scene: 'money',      ms:  9 * MIN },
    { scene: 'phone',      ms:  7 * MIN },
    { scene: 'perch',      ms: 10_000   },
    { scene: 'bubblebath', ms:  8 * MIN },
    { scene: 'walk',       ms: 10_000   },  // brief walk between loops
  ],
  closed:  [
    { scene: 'sleep',  ms: 18 * MIN },
    { scene: 'gaming', ms: 15 * MIN },
  ],
}

/* ─── Character grid (20 × 32) ─────────────────────────────────────── */
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

const NIGHTGOWN_MAP: Record<string, string> = {
  [J1]: NG1, [J2]: NG2, [J3]: NG3,
  [WH]: NC,  [WD]: NC,
  [TR]: '#a0c4e8', [TD]: '#80a8d0',
  [SH]: NG1, [SL]: NG2,
}

// Shirtless — replace jacket/shirt/tie with skin tones
const SHIRTLESS_MAP: Record<string, string> = {
  [J1]: SK, [J2]: SK, [J3]: SK,
  [WH]: SK, [WD]: SK,
  [TR]: SK, [TD]: SD,
  [SH]: SK, [SL]: SK,
}

/* ─── Walk frames ──────────────────────────────────────────────────── */
interface Pose {
  leftArmDY: number; rightArmDY: number
  leftLegDX: number; rightLegDX: number
  bodyDY: number
}
const WALK_FRAMES: Pose[] = [
  {leftArmDY:0, rightArmDY:0, leftLegDX:0, rightLegDX:0, bodyDY:0},
  {leftArmDY:-1,rightArmDY:1, leftLegDX:-1,rightLegDX:1, bodyDY:0},
  {leftArmDY:-2,rightArmDY:2, leftLegDX:-2,rightLegDX:2, bodyDY:-1},
  {leftArmDY:-1,rightArmDY:1, leftLegDX:-1,rightLegDX:1, bodyDY:0},
  {leftArmDY:0, rightArmDY:0, leftLegDX:0, rightLegDX:0, bodyDY:0},
  {leftArmDY:1, rightArmDY:-1,leftLegDX:1, rightLegDX:-1,bodyDY:0},
  {leftArmDY:2, rightArmDY:-2,leftLegDX:2, rightLegDX:-2,bodyDY:-1},
  {leftArmDY:1, rightArmDY:-1,leftLegDX:1, rightLegDX:-1,bodyDY:0},
]

/* ─── Color helpers ────────────────────────────────────────────────── */
function hexToRgb(h: string): [number,number,number] {
  const n = parseInt(h.slice(1),16)
  return [(n>>16)&0xff,(n>>8)&0xff,n&0xff]
}
function lerpColor(a: string, b: string, t: number) {
  const [ar,ag,ab]=hexToRgb(a),[br,bg,bb]=hexToRgb(b)
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`
}

/* ─── Character renderer ───────────────────────────────────────────── */
function renderCharacter(
  ctx: CanvasRenderingContext2D,
  pose: Pose, ox: number, oy: number, dir: number,
  flush: number, extraBounce: number, shakeX: number,
  W: number, H: number, maxRow = 32,
  colorMap?: Record<string,string>,
) {
  const eox = ox + shakeX
  for (let r = 0; r < Math.min(GRID.length, maxRow); r++) {
    for (let c = 0; c < 20; c++) {
      let color = GRID[r][c]
      if (!color) continue
      if (colorMap && colorMap[color]) color = colorMap[color]
      if (flush > 0 && color === SK && r >= 4 && r <= 11 && c >= 5 && c <= 12)
        color = lerpColor(SK, '#ff6060', flush)

      const dc = dir === -1 ? 19 - c : c
      let cx = eox + dc * PX
      let cy = oy + r * PX + (pose.bodyDY + extraBounce) * PX

      const isLA = r >= 21 && r <= 23 && c <= 1
      const isRA = r >= 21 && r <= 23 && c >= 15
      if (isLA) cy += pose.leftArmDY * PX
      if (isRA) cy += pose.rightArmDY * PX

      const isLL = r >= 24 && r <= 27 && c >= 3 && c <= 5
      const isRL = r >= 24 && r <= 27 && c >= 11 && c <= 13
      const isLS = r >= 28 && c >= 0 && c <= 6
      const isRS = r >= 28 && c >= 9 && c <= 15
      if (isLL||isLS) cx += pose.leftLegDX * PX
      if (isRL||isRS) cx += pose.rightLegDX * PX

      if (cx < 0 || cy < 0 || cx+PX > W || cy+PX > H) continue
      ctx.fillStyle = color
      ctx.fillRect(cx, cy, PX, PX)
    }
  }
}

/* ─── Canvas props ─────────────────────────────────────────────────── */

function drawBed(ctx: CanvasRenderingContext2D, cx: number, viewH: number) {
  const bW = 250, bH = 82
  const bx = cx - bW / 2
  const by = viewH - bH - 4
  ctx.fillStyle = '#2d1208'
  ctx.fillRect(bx+4,by+bH,10,10); ctx.fillRect(bx+bW-14,by+bH,10,10)
  ctx.fillRect(bx+4,by+bH-4,10,8); ctx.fillRect(bx+bW-14,by+bH-4,10,8)
  const hbX=bx-14
  ctx.fillStyle='#3d1a08'; ctx.fillRect(hbX,by-62,20,bH+66)
  ctx.fillStyle='#5c2a10'
  ctx.fillRect(hbX+2,by-55,14,25); ctx.fillRect(hbX+2,by-24,14,20); ctx.fillRect(hbX+2,by+2,14,bH-6)
  ctx.fillStyle='#4a2010'; ctx.fillRect(hbX-4,by-68,28,10)
  ctx.fillStyle='#3d1a08'; ctx.fillRect(bx+bW-6,by-22,18,bH+26)
  ctx.fillStyle='#5c2a10'
  ctx.fillRect(bx+bW-4,by-18,12,18); ctx.fillRect(bx+bW-4,by+4,12,bH-8)
  ctx.fillStyle='#ece4cc'; ctx.fillRect(bx+6,by,bW-12,bH)
  ctx.fillStyle='#f7f3ea'; ctx.fillRect(bx+6,by+4,bW-12,bH-8)
  ctx.fillStyle='#ffffff'; ctx.fillRect(bx+10,by+8,65,45)
  ctx.fillStyle='rgba(180,180,180,.3)'
  ctx.fillRect(bx+14,by+13,57,4); ctx.fillRect(bx+14,by+13,4,37)
  ctx.fillStyle='#1e3a8a'; ctx.fillRect(bx+73,by+4,bW-85,bH-8)
  ctx.fillStyle='#2563eb'; ctx.fillRect(bx+73,by+4,bW-85,16)
  ctx.fillStyle='rgba(255,255,255,.09)'
  for(let i=0;i<5;i++) ctx.fillRect(bx+80+i*30,by+8,18,bH-16)
  ctx.fillStyle='#1a317a'; ctx.fillRect(bx+73,by+4,4,bH-8)
}

function drawSleepingHead(ctx: CanvasRenderingContext2D, headOx: number, headOy: number, bob: number, W: number, H: number) {
  // bob must be integer to avoid sub-pixel seam lines between 5px blocks
  const b = Math.round(bob)
  // Rotated 90° CW: hair (r=0) on LEFT pointing toward headboard, neck (r=11) on RIGHT
  // Original (r, c) → canvas: x = headOx + r*PX,  y = headOy + (c-3)*PX + b
  for (let r = 0; r <= 11; r++) {
    for (let c = 3; c <= 14; c++) {
      const color = GRID[r][c]
      if (!color) continue
      const px = headOx + r * PX
      const py = headOy + (c - 3) * PX + b
      if (px<0||py<0||px+PX>W||py+PX>H) continue
      ctx.fillStyle = color; ctx.fillRect(px, py, PX, PX)
    }
  }
  const capBaseX = headOx - 2
  const capTopY   = headOy + 1 + b
  const capBotY   = headOy + 11 * PX - 1 + b
  const capTipX   = headOx - 52
  const capTipY   = headOy + 4 * PX + b    // slightly above center
  ctx.fillStyle='#1e40af'; ctx.beginPath()
  ctx.moveTo(capBaseX, capTopY); ctx.lineTo(capBaseX, capBotY); ctx.lineTo(capTipX, capTipY)
  ctx.closePath(); ctx.fill()
  ctx.fillStyle='rgba(255,255,255,.15)'; ctx.beginPath()
  ctx.moveTo(capBaseX, capTopY); ctx.lineTo(capTipX, capTipY)
  ctx.lineTo(capTipX+4, capTipY); ctx.lineTo(capBaseX, capTopY+4)
  ctx.closePath(); ctx.fill()
  // White brim (vertical strip at cap base)
  ctx.fillStyle='#e2e8f0'; ctx.fillRect(capBaseX-4, capTopY-3, 9, capBotY-capTopY+6)
  ctx.fillStyle='rgba(150,150,170,.3)'; ctx.fillRect(capBaseX-4, capTopY-3, 3, capBotY-capTopY+6)
  // Pom at tip
  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(capTipX-5, capTipY, 7, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle='rgba(180,200,220,.5)'; ctx.beginPath(); ctx.arc(capTipX-7, capTipY-2, 3, 0, Math.PI*2); ctx.fill()
}

function drawBeachChair(ctx: CanvasRenderingContext2D, cx: number, viewH: number) {
  // All positions relative to cx (character's left edge)
  const base=viewH-20, seatY=base-55
  const seatX=cx-10, seatW=150
  const backX=seatX+seatW  // chair back on the right (feet left, head right)

  // Chair back (right side — character reclines with head on right)
  ctx.fillStyle='#C8A96B'; ctx.fillRect(backX,seatY-90,14,100)
  for(let i=0;i<5;i++){ctx.fillStyle='#A0785A';ctx.fillRect(backX+2,seatY-84+i*17,10,3)}
  // Seat
  ctx.fillStyle='#D4B06A'; ctx.fillRect(seatX,seatY,seatW,13)
  for(let i=0;i<4;i++){ctx.fillStyle='#C19A6B';ctx.fillRect(seatX+i*(seatW/4)+3,seatY+2,seatW/4-5,9)}
  // Legs
  ctx.fillStyle='#8B5E3C'; ctx.fillRect(seatX+4,seatY-26,9,36); ctx.fillRect(backX-4,seatY-26,9,36)
  ctx.fillStyle='#6B4226'
  ctx.fillRect(seatX+6,seatY+13,6,base-seatY-13); ctx.fillRect(backX-3,seatY+13,6,base-seatY-13)
  ctx.fillRect(seatX+6,seatY+40,seatW-12,5)
  // Umbrella pole — centered above seat
  const umX=Math.round(seatX+seatW/2)
  ctx.fillStyle='#5C3A1E'; ctx.fillRect(umX,seatY-115,5,120)
  const cols=['#E74C3C','#F39C12','#2ECC71','#3498DB','#9B59B6','#E74C3C']
  for(let i=0;i<6;i++){
    ctx.fillStyle=cols[i]; ctx.beginPath(); ctx.moveTo(umX+2,seatY-115)
    ctx.arc(umX+2,seatY-115,48,Math.PI+(Math.PI/6)*i,Math.PI+(Math.PI/6)*(i+1)); ctx.fill()
  }
  ctx.strokeStyle='#333'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.arc(umX+2,seatY-115,48,Math.PI,2*Math.PI); ctx.stroke()
  // Cocktail on the left armrest
  ctx.fillStyle='#8B5E3C'; ctx.fillRect(seatX-22,seatY,20,14)
  ctx.fillStyle='#FF7043'; ctx.fillRect(seatX-18,seatY-18,12,20)
  ctx.fillStyle='#FFF9C4'; ctx.fillRect(seatX-16,seatY-16,8,8)
  ctx.fillStyle='#E91E63'; ctx.fillRect(seatX-11,seatY-28,2,14)
  ctx.fillStyle='#FFD700'; ctx.fillRect(seatX-18,seatY-24,14,2)
}

function drawDesk(ctx: CanvasRenderingContext2D, cx: number, viewH: number) {
  const base=viewH-20, deskW=135, deskX=4, topY=base-72
  ctx.fillStyle='#1a0e06'; ctx.fillRect(deskX,topY,deskW,11)
  ctx.fillStyle='#3d200e'; ctx.fillRect(deskX,topY+2,deskW,3)
  ctx.fillStyle='#2c1608'; ctx.fillRect(deskX,topY+11,deskW,base-topY-11)
  ctx.fillStyle='#1a0e06'
  ctx.fillRect(deskX+5,topY+55,12,base-topY-55); ctx.fillRect(deskX+deskW-17,topY+55,12,base-topY-55)
  const monX=deskX+18
  ctx.fillStyle='#0a0a14'; ctx.fillRect(monX,topY-48,55,42)
  ctx.fillStyle='#1e3a8a'; ctx.fillRect(monX+2,topY-46,51,38)
  ctx.fillStyle='rgba(100,160,255,.25)'
  for(let i=0;i<3;i++) ctx.fillRect(monX+4,topY-42+i*10,47,5)
  ctx.fillStyle='#0a0a14'
  ctx.fillRect(monX+23,topY-6,8,9); ctx.fillRect(monX+15,topY+3,24,4)
  ctx.fillStyle='#1c1c2e'; ctx.fillRect(deskX+80,topY+2,48,13)
  ctx.fillStyle='#2a2a40'
  for(let row=0;row<2;row++) for(let col=0;col<8;col++) ctx.fillRect(deskX+82+col*5,topY+4+row*6,4,4)
  ctx.fillStyle='#f5f5f5'; ctx.fillRect(deskX+76,topY+1,30,22)
  ctx.fillStyle='#e8e8e8'; ctx.fillRect(deskX+80,topY-2,25,18)
  ctx.fillStyle='#bbb'
  for(let i=0;i<3;i++) ctx.fillRect(deskX+78,topY+4+i*5,24,1)
  ctx.fillStyle='#607D8B'; ctx.fillRect(deskX+112,topY+1,17,15)
  ctx.fillStyle='#795548'; ctx.fillRect(deskX+114,topY+3,13,11)
  ctx.fillStyle='#607D8B'; ctx.fillRect(deskX+129,topY+4,4,8)
  ctx.fillStyle='#2c1608'
  ctx.fillRect(deskX+129,topY+4,1,8); ctx.fillRect(deskX+132,topY+4,1,8)
}

/* ── Umbrella — centered over character, direction-aware ────────────── */
function drawUmbrella(ctx: CanvasRenderingContext2D, charX: number, charY: number, dir: number) {
  // Center umbrella over character regardless of facing direction
  const cx = charX + CHAR_W / 2
  const cy = charY - 8
  // Handle — curves toward the holding hand side
  ctx.strokeStyle='#5C3A1E'; ctx.lineWidth=4; ctx.lineCap='round'
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx,cy+70)
  const hookX = cx + (dir===1 ? -18 : 18)
  ctx.bezierCurveTo(cx,cy+80, hookX,cy+88, hookX+dir*4,cy+80)
  ctx.stroke()
  // Canopy
  const segs=['#1565C0','#1976D2','#2196F3','#42A5F5','#1565C0','#0D47A1']
  for(let i=0;i<6;i++){
    ctx.fillStyle=segs[i]; ctx.beginPath(); ctx.moveTo(cx,cy)
    ctx.arc(cx,cy,54,Math.PI+(Math.PI/6)*i,Math.PI+(Math.PI/6)*(i+1)); ctx.fill()
  }
  // Rim
  ctx.strokeStyle='#0D47A1'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.arc(cx,cy,54,Math.PI,2*Math.PI); ctx.stroke()
  // Ribs
  ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=1
  for(let i=0;i<7;i++){
    const a=Math.PI+i*(Math.PI/6)
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*54,cy+Math.sin(a)*54); ctx.stroke()
  }
  // Tip
  ctx.fillStyle='#E3F2FD'; ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill()
}

/* ── Newspaper ──────────────────────────────────────────────────────── */
function drawNewspaper(ctx: CanvasRenderingContext2D, charX: number, charY: number, dir: number, wave: number) {
  const nx = dir===1 ? charX+CHAR_W-5 : charX-52
  const ny = Math.round(charY+55+wave)
  ctx.fillStyle='#f5f0e0'; ctx.fillRect(nx,ny,55,48)
  ctx.fillStyle='#e8e0cc'; ctx.fillRect(nx+1,ny+1,53,46)
  ctx.fillStyle='#ccc'; ctx.fillRect(nx+26,ny,2,48)
  ctx.fillStyle='#111'; ctx.fillRect(nx+3,ny+3,50,8)
  ctx.fillStyle='#fff'
  ctx.fillRect(nx+4,ny+4,14,6); ctx.fillRect(nx+20,ny+4,8,6); ctx.fillRect(nx+30,ny+4,20,6)
  ctx.fillStyle='#999'
  for(let i=0;i<4;i++) ctx.fillRect(nx+3,ny+14+i*7,20,3)
  for(let i=0;i<4;i++) ctx.fillRect(nx+28,ny+14+i*7,20,3)
  ctx.strokeStyle='#e53e3e'; ctx.lineWidth=1.5; ctx.lineJoin='round'; ctx.beginPath()
  ctx.moveTo(nx+28,ny+42); ctx.lineTo(nx+34,ny+38); ctx.lineTo(nx+38,ny+40)
  ctx.lineTo(nx+43,ny+34); ctx.lineTo(nx+50,ny+37); ctx.stroke()
}

/* ── Dumbbell — bar tracks actual arm position ──────────────────────── */
function drawDumbbell(ctx: CanvasRenderingContext2D, charX: number, charY: number, liftCycle: number) {
  // Arms in renderCharacter are at charY + 21*PX + pose.leftArmDY*PX
  // pose.leftArmDY = liftCycle * -9, so:
  const armY = charY + 21 * PX - liftCycle * 9 * PX
  const by = armY - 10   // plates straddle the arm row
  const bx = charX - 14
  const barLen = CHAR_W + 28
  // Bar
  ctx.fillStyle = '#888'; ctx.fillRect(bx + 18, by + 13, barLen - 36, 7)
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(bx + 18, by + 13, barLen - 36, 2)
  // Left plates
  ctx.fillStyle = '#c53030'; ctx.fillRect(bx, by + 3, 16, 26)
  ctx.fillStyle = '#e53e3e'; ctx.fillRect(bx + 2, by + 6, 12, 20)
  ctx.fillStyle = '#888'; ctx.fillRect(bx + 12, by + 8, 4, 16)
  // Right plates
  ctx.fillStyle = '#c53030'; ctx.fillRect(bx + barLen - 16, by + 3, 16, 26)
  ctx.fillStyle = '#e53e3e'; ctx.fillRect(bx + barLen - 14, by + 6, 12, 20)
  ctx.fillStyle = '#888'; ctx.fillRect(bx + barLen - 16, by + 8, 4, 16)
}

/* ── Game controller — centered under character ─────────────────────── */
function drawController(ctx: CanvasRenderingContext2D, charX: number, charY: number) {
  const cw=80
  const cx=charX+(CHAR_W-cw)/2  // always centered under character
  const cy=charY+88
  ctx.fillStyle='#1a1a2e'; ctx.beginPath()
  ctx.moveTo(cx+8,cy); ctx.lineTo(cx+cw-8,cy)
  ctx.quadraticCurveTo(cx+cw,cy,cx+cw,cy+22)
  ctx.lineTo(cx+cw,cy+28); ctx.quadraticCurveTo(cx+cw-10,cy+42,cx+cw-26,cy+38)
  ctx.lineTo(cx+26,cy+38); ctx.quadraticCurveTo(cx+10,cy+42,cx,cy+28)
  ctx.lineTo(cx,cy+22); ctx.quadraticCurveTo(cx,cy,cx+8,cy); ctx.closePath(); ctx.fill()
  // Highlight
  ctx.fillStyle='rgba(255,255,255,.06)'
  ctx.beginPath(); ctx.ellipse(cx+cw/2,cy+8,28,7,0,0,Math.PI*2); ctx.fill()
  // D-pad
  ctx.fillStyle='#2d2d4a'
  ctx.fillRect(cx+13,cy+13,8,20); ctx.fillRect(cx+9,cy+17,16,12)
  ctx.fillStyle='#555'; ctx.fillRect(cx+16,cy+16,2,14); ctx.fillRect(cx+11,cy+22,12,2)
  // Face buttons
  const btns=[{x:cx+58,y:cy+11,c:'#e53e3e'},{x:cx+67,y:cy+20,c:'#805ad5'},{x:cx+49,y:cy+20,c:'#38a169'},{x:cx+58,y:cy+29,c:'#2b6cb0'}]
  btns.forEach(b=>{
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(b.x+1,b.y+1,5,0,Math.PI*2); ctx.fill()
    ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(b.x-1.5,b.y-1.5,2,0,Math.PI*2); ctx.fill()
  })
  // Menu buttons
  ctx.fillStyle='#3a3a5c'
  ctx.beginPath(); ctx.ellipse(cx+28,cy+20,7,4,0,0,Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx+42,cy+20,7,4,0,0,Math.PI*2); ctx.fill()
}

/* ── Phone / doom scroll ────────────────────────────────────────────── */
function drawPhone(ctx: CanvasRenderingContext2D, charX: number, charY: number, dir: number, scrollT: number) {
  const px=dir===1 ? charX+CHAR_W-6 : charX-40
  const py=charY+28
  // Body
  ctx.fillStyle='#0f0f1a'; ctx.fillRect(px,py,36,64)
  ctx.fillStyle='#1a1a2e'; ctx.fillRect(px+2,py+2,32,60)
  // Screen glow
  ctx.fillStyle='#050510'; ctx.fillRect(px+3,py+7,30,50)
  ctx.fillStyle='rgba(239,68,68,.06)'; ctx.fillRect(px+3,py+7,30,50)
  // Scrolling red chart — clipped to screen area
  ctx.save(); ctx.beginPath(); ctx.rect(px+3,py+7,30,50); ctx.clip()
  const pts:Array<[number,number]>=[[0,0],[8,-6],[14,-2],[20,-14],[28,-8],[36,-18],[42,-12],[50,-22]]
  const off=(scrollT*0.5)%60
  ctx.strokeStyle='#ef4444'; ctx.lineWidth=1.5; ctx.lineJoin='round'; ctx.beginPath()
  pts.forEach(([x,y],i)=>{
    const sx=px+3+x, sy=py+30+y+off
    i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy)
  })
  ctx.stroke()
  // Second wave, offset
  ctx.strokeStyle='rgba(239,68,68,.35)'; ctx.beginPath()
  pts.forEach(([x,y],i)=>{
    const sx=px+3+x, sy=py+42+y+off*0.7
    i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy)
  })
  ctx.stroke()
  ctx.restore()
  // Down arrow on screen
  ctx.fillStyle='rgba(239,68,68,.9)'; ctx.beginPath()
  ctx.moveTo(px+14,py+48); ctx.lineTo(px+18,py+54); ctx.lineTo(px+22,py+48); ctx.closePath(); ctx.fill()
  // Camera
  ctx.fillStyle='#2a2a3e'; ctx.beginPath(); ctx.arc(px+18,py+4,2.5,0,Math.PI*2); ctx.fill()
  // Side button
  ctx.fillStyle='#333'; ctx.fillRect(px+36,py+16,3,12)
}

/* ── Telescope ──────────────────────────────────────────────────────── */
function drawTelescope(ctx: CanvasRenderingContext2D, charX: number, charY: number, dir: number) {
  // Points inward toward content
  const angle = dir===1 ? -0.22 : Math.PI+0.22
  const baseX = dir===1 ? charX+CHAR_W+4 : charX-4
  const baseY = charY+60
  const len=95
  const endX=baseX+Math.cos(angle)*len
  const endY=baseY+Math.sin(angle)*len

  // Tripod
  ctx.strokeStyle='#5C3A1E'; ctx.lineWidth=3; ctx.lineCap='round'
  ctx.beginPath(); ctx.moveTo(baseX,baseY+8); ctx.lineTo(baseX-16,baseY+52); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(baseX,baseY+8); ctx.lineTo(baseX+16,baseY+52); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(baseX,baseY+8); ctx.lineTo(baseX,baseY+52); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(baseX-12,baseY+32); ctx.lineTo(baseX+12,baseY+32); ctx.stroke()

  // Main tube shadow
  ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=12; ctx.lineCap='round'
  ctx.beginPath(); ctx.moveTo(baseX+1,baseY+1); ctx.lineTo(endX+1,endY+1); ctx.stroke()
  // Main tube
  ctx.strokeStyle='#8B6914'; ctx.lineWidth=11; ctx.lineCap='round'
  ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.lineTo(endX,endY); ctx.stroke()
  // Tube highlight
  ctx.strokeStyle='#DAA520'; ctx.lineWidth=4
  ctx.beginPath(); ctx.moveTo(baseX+Math.cos(angle)*12,baseY+Math.sin(angle)*12)
  ctx.lineTo(endX-Math.cos(angle)*8,endY-Math.sin(angle)*8); ctx.stroke()
  ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=2
  ctx.beginPath(); ctx.moveTo(baseX+Math.cos(angle)*12,baseY+Math.sin(angle)*12+1)
  ctx.lineTo(endX-Math.cos(angle)*8,endY-Math.sin(angle)*8+1); ctx.stroke()

  // Eyepiece end
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(baseX,baseY,9,0,Math.PI*2); ctx.fill()
  ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(baseX,baseY,6,0,Math.PI*2); ctx.fill()
  ctx.fillStyle='rgba(100,150,255,.2)'; ctx.beginPath(); ctx.arc(baseX,baseY,4,0,Math.PI*2); ctx.fill()

  // Lens end
  ctx.fillStyle='#0a1628'; ctx.beginPath(); ctx.arc(endX,endY,11,0,Math.PI*2); ctx.fill()
  ctx.fillStyle='#1a3a5c'; ctx.beginPath(); ctx.arc(endX,endY,9,0,Math.PI*2); ctx.fill()
  ctx.fillStyle='rgba(100,180,255,.5)'; ctx.beginPath(); ctx.arc(endX,endY,7,0,Math.PI*2); ctx.fill()
  ctx.fillStyle='rgba(200,230,255,.3)'; ctx.beginPath(); ctx.arc(endX-2,endY-2,3,0,Math.PI*2); ctx.fill()
}

function drawCoffeeCup(ctx: CanvasRenderingContext2D, charX: number, charY: number, dir: number) {
  // Position cup at hand level — arm rows 21-23 are at charY+105, raised by armDY=-2*PX=10 → charY+95
  const cx = dir===1 ? charX+CHAR_W-20 : charX-16
  const cy = charY+92
  // Cup body
  ctx.fillStyle='#f5f0e8'; ctx.fillRect(cx,cy,18,22)
  ctx.fillStyle='#e8e0cc'; ctx.fillRect(cx+1,cy+1,16,20)
  // Steam
  ctx.strokeStyle='rgba(200,200,200,.7)'; ctx.lineWidth=1.5; ctx.lineCap='round'
  for(let i=0;i<3;i++){
    ctx.beginPath(); ctx.moveTo(cx+4+i*5,cy-4)
    ctx.quadraticCurveTo(cx+2+i*5,cy-10,cx+6+i*5,cy-16); ctx.stroke()
  }
  // Coffee liquid
  ctx.fillStyle='#6f4e37'; ctx.fillRect(cx+2,cy+2,14,10)
  ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(cx+3,cy+3,5,3)
  // Handle
  ctx.strokeStyle='#d4c9b0'; ctx.lineWidth=2.5
  ctx.beginPath(); ctx.arc(cx+(dir===1?20:-4),cy+10,7,Math.PI*0.6,Math.PI*1.4); ctx.stroke()
  // Saucer
  ctx.fillStyle='#e8e0cc'; ctx.fillRect(cx-2,cy+22,22,4)
  ctx.fillStyle='rgba(0,0,0,.1)'; ctx.fillRect(cx-2,cy+26,22,2)
}

function drawDartboard(ctx: CanvasRenderingContext2D, bx: number, by: number) {
  const cx=bx, cy=by
  const rings=[{r:52,c:'#1a1a1a'},{r:46,c:'#22c55e'},{r:38,c:'#1a1a1a'},{r:30,c:'#ef4444'},
               {r:22,c:'#1a1a1a'},{r:14,c:'#22c55e'},{r:8,c:'#1a1a1a'},{r:4,c:'#ef4444'}]
  rings.forEach(({r,c})=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill() })
  // Sector lines
  ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1
  for(let i=0;i<20;i++){
    const a=i*Math.PI/10
    ctx.beginPath(); ctx.moveTo(cx+8*Math.cos(a),cy+8*Math.sin(a))
    ctx.lineTo(cx+46*Math.cos(a),cy+46*Math.sin(a)); ctx.stroke()
  }
  // Bull's-eye glow
  ctx.fillStyle='rgba(255,220,0,.15)'; ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2); ctx.fill()
  // Wood backing
  ctx.strokeStyle='#5C3A1E'; ctx.lineWidth=6
  ctx.beginPath(); ctx.arc(cx,cy,54,0,Math.PI*2); ctx.stroke()
}

function drawBathtub(ctx: CanvasRenderingContext2D, cx: number, viewH: number) {
  const bx=cx-85, by=viewH-95, bw=170, bh=70
  // Tub shadow
  ctx.fillStyle='rgba(0,0,0,.15)'; ctx.fillRect(bx+6,by+bh+2,bw-4,8)
  // Tub outer
  ctx.fillStyle='#e8e4dc'; ctx.fillRect(bx,by,bw,bh)
  // Tub inner (water)
  ctx.fillStyle='#7dd3fc'; ctx.fillRect(bx+6,by+8,bw-12,bh-14)
  // Water shimmer
  ctx.fillStyle='rgba(255,255,255,.35)'
  ctx.fillRect(bx+12,by+14,40,4); ctx.fillRect(bx+70,by+20,30,3)
  // Tub rim highlight
  ctx.fillStyle='#f5f2ee'; ctx.fillRect(bx,by,bw,8)
  ctx.fillStyle='rgba(255,255,255,.6)'; ctx.fillRect(bx+2,by,bw-4,3)
  // Legs
  ctx.fillStyle='#c4b9a8'
  ctx.fillRect(bx+8,by+bh,10,14); ctx.fillRect(bx+bw-18,by+bh,10,14)
  // Faucet
  ctx.fillStyle='#94a3b8'; ctx.fillRect(bx+bw-14,by-10,8,14)
  ctx.fillStyle='#cbd5e1'; ctx.fillRect(bx+bw-16,by-12,12,5)
}

function drawDart(ctx: CanvasRenderingContext2D, tx: number, ty: number, progress: number, startX: number, startY: number) {
  const x = startX + (tx-startX)*progress
  const y = startY + (ty-startY)*progress - Math.sin(progress*Math.PI)*30
  const angle = Math.atan2(ty-startY+(Math.cos(progress*Math.PI)*30*Math.PI/1), tx-startX)
  ctx.save()
  ctx.translate(x,y); ctx.rotate(angle)
  ctx.fillStyle='#888'; ctx.fillRect(-14,- 1.5,14,3)
  ctx.fillStyle='#e53e3e'; ctx.fillRect(-20,-3,8,6)
  ctx.fillStyle='#c0c0c0'; ctx.fillRect(0,-1,6,2)
  ctx.fillStyle='#ffd700'
  ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(3,-4); ctx.lineTo(3,4); ctx.closePath(); ctx.fill()
  ctx.restore()
}

/* ═══ CSS Particle Systems ══════════════════════════════════════════ */

const CONFETTI_DATA = Array.from({length:32},(_,i)=>{
  const dur=2.3+(i*0.2)%2
  // initDelay is negative — makes this particle start mid-animation so they're
  // all at different heights immediately (no "all in a line" at t=0)
  const initDelay = -dur * ((i * 0.618) % 1)
  return {
    pct:(i*3.125)%100, delay:(i*0.22)%3.2 + initDelay, dur,
    color:['#FF6B6B','#4ECDC4','#45B7D1','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#82E0AA','#FF9FF3','#54A0FF'][i%10],
    size:6+(i*1.7)%8, rect:i%3!==0,
  }
})
const NOTE_DATA=[
  {ox:-30,d:0,s:'♪',c:'#FFD700'},{ox:-8,d:.4,s:'♫',c:'#FF69B4'},
  {ox:16,d:.8,s:'♩',c:'#00CED1'},{ox:38,d:1.2,s:'♬',c:'#FF6347'},
  {ox:-20,d:1.6,s:'♪',c:'#9370DB'},{ox:28,d:2,s:'♫',c:'#32CD32'},
]

function ConfettiRain({zoneX,zoneW}:{zoneX:number;zoneW:number}){
  return(<>
    <style>{`@keyframes cF{0%{opacity:1;transform:translateY(-10px) rotate(0deg) scaleX(1)}50%{transform:translateY(55px) rotate(200deg) scaleX(-1)}100%{opacity:0;transform:translateY(120px) rotate(400deg) scaleX(1)}}`}</style>
    {CONFETTI_DATA.map((c,i)=>(
      <div key={i} style={{position:'fixed',left:zoneX+c.pct*(zoneW/100),bottom:'20%',
        width:c.size,height:c.rect?c.size*.45:c.size,borderRadius:c.rect?2:'50%',
        background:c.color,animation:`cF ${c.dur}s ease-in ${c.delay}s infinite`,
        pointerEvents:'none',zIndex:11}}/>
    ))}
  </>)
}
function MusicNotes({charX}:{charX:number}){
  return(<>
    <style>{`@keyframes nR{0%{opacity:.9;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-120px) scale(.6)}}`}</style>
    {NOTE_DATA.map((n,i)=>(
      <div key={i} style={{position:'fixed',left:charX+50+n.ox,bottom:'22%',
        color:n.c,fontSize:14+i,fontWeight:700,
        animation:`nR ${1.9+i*.15}s ease-out ${n.d}s infinite`,
        pointerEvents:'none',zIndex:11}}>{n.s}</div>
    ))}
  </>)
}
function DiscoBall({x}:{x:number}){
  return(<>
    <style>{`@keyframes ds{to{transform:rotate(360deg)}}@keyframes db{0%,100%{opacity:0}50%{opacity:.65}}`}</style>
    <div style={{position:'fixed',left:x,bottom:'45%',width:40,height:40,borderRadius:'50%',
      background:'linear-gradient(135deg,#fff 0%,#ccc 40%,#888 70%,#ccc 100%)',
      boxShadow:'0 0 10px rgba(255,255,255,.5)',animation:'ds 4s linear infinite',
      pointerEvents:'none',zIndex:12}}>
      {Array.from({length:16},(_,i)=>(
        <div key={i} style={{position:'absolute',left:`${(i%4)*25}%`,top:`${Math.floor(i/4)*25}%`,
          width:'22%',height:'22%',background:`hsl(${i*22},80%,70%)`,opacity:.8}}/>
      ))}
    </div>
    {[0,60,120,180,240,300].map((deg,i)=>(
      <div key={i} style={{position:'fixed',left:x+20,bottom:'calc(45% + 20px)',
        width:2,height:55,background:`hsl(${i*60},100%,65%)`,transformOrigin:'top center',
        transform:`rotate(${deg}deg)`,animation:`db 1.3s ease-in-out ${i*.2}s infinite`,
        pointerEvents:'none',zIndex:11,opacity:.55}}/>
    ))}
  </>)
}
function BeachAtmosphere({canvasW}:{canvasW:number}){
  return(<>
    <style>{`
      @keyframes sP{0%,100%{box-shadow:0 0 15px 5px rgba(255,215,0,.3)}50%{box-shadow:0 0 38px 16px rgba(255,165,0,.5)}}
      @keyframes sR{to{transform:rotate(360deg)}}
      @keyframes wv{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes bb{0%{transform:translate(0,0)}25%{transform:translate(30px,-7px)}50%{transform:translate(60px,0)}75%{transform:translate(30px,5px)}100%{transform:translate(0,0)}}
    `}</style>
    <div style={{position:'fixed',right:20,bottom:'25%',width:52,height:52,borderRadius:'50%',
      background:'radial-gradient(circle at 35% 35%,#FFF59D,#FFD600,#FF8F00)',
      animation:'sP 3s ease-in-out infinite',pointerEvents:'none',zIndex:11}}/>
    <div style={{position:'fixed',right:20,bottom:'25%',width:52,height:52,
      animation:'sR 12s linear infinite',pointerEvents:'none',zIndex:10}}>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg=>(
        <div key={deg} style={{position:'absolute',left:23,top:-20,width:3,height:20,background:'#FFD600',
          transformOrigin:'3px 46px',transform:`rotate(${deg}deg)`,opacity:.55}}/>
      ))}
    </div>
    <div style={{position:'fixed',bottom:0,left:0,width:'200%',height:20,pointerEvents:'none',zIndex:11,overflow:'hidden'}}>
      <div style={{width:'100%',height:'100%',
        background:'linear-gradient(to right,transparent 0%,rgba(64,164,223,.5) 8%,rgba(100,190,240,.65) 16%,transparent 24%,rgba(64,164,223,.5) 32%,rgba(100,190,240,.65) 40%,transparent 48%,rgba(64,164,223,.5) 56%,rgba(100,190,240,.65) 64%,transparent 72%)',
        animation:'wv 3s linear infinite'}}/>
    </div>
    {[0,1,2].map(i=>(
      <div key={i} style={{position:'fixed',right:80+i*45,bottom:'28%',fontSize:13,opacity:.65,
        animation:`bb ${3+i}s ease-in-out ${i*.9}s infinite`,pointerEvents:'none',zIndex:11}}>🐦</div>
    ))}
  </>)
}

/* ── Rain ────────────────────────────────────────────────────────────── */
const RAIN_DROPS = Array.from({length:45},(_,i)=>({
  pct:(i*2.22)%100, delay:(i*0.06)%2, dur:0.55+(i*0.03)%0.45, len:10+(i%4)*5,
}))
function RainEffect({zoneX,zoneW}:{zoneX:number;zoneW:number}){
  return(<>
    <style>{`@keyframes rD{0%{opacity:.75;transform:translateY(-30px) scaleY(1)}100%{opacity:.1;transform:translateY(150px) scaleY(1.2)}}`}</style>
    {RAIN_DROPS.map((d,i)=>(
      <div key={i} style={{position:'fixed',left:zoneX+d.pct*(zoneW/100),top:'3%',
        width:1.5,height:d.len,
        background:'linear-gradient(to bottom,rgba(174,214,241,.9),rgba(174,214,241,.1))',
        animation:`rD ${d.dur}s linear ${d.delay}s infinite`,
        pointerEvents:'none',zIndex:11}}/>
    ))}
    <div style={{position:'fixed',left:zoneX+zoneW*0.15,bottom:16,width:zoneW*0.7,height:10,
      background:'radial-gradient(ellipse,rgba(147,197,253,.3) 0%,transparent 70%)',
      pointerEvents:'none',zIndex:11}}/>
  </>)
}

/* ── Anger / bang / papers / throw ─────────────────────────────────── */
const ANGER_POS=[{dx:72,dy:55,d:0},{dx:92,dy:35,d:.5},{dx:60,dy:72,d:1.1}]
function AngerMarks({charX}:{charX:number}){
  return(<>
    <style>{`@keyframes aP{0%{opacity:0;transform:scale(.2) rotate(-15deg)}25%{opacity:1;transform:scale(1.3) rotate(5deg)}80%{opacity:.9}100%{opacity:0;transform:scale(.8)}}`}</style>
    {ANGER_POS.map((a,i)=>(
      <div key={i} style={{position:'fixed',left:charX+a.dx,bottom:`calc(${a.dy}px + 12%)`,
        fontSize:22,animation:`aP 1.6s ease-out ${a.d}s infinite`,pointerEvents:'none',zIndex:13}}>💢</div>
    ))}
  </>)
}
function BangText({charX,show}:{charX:number;show:boolean}){
  return(<>
    <style>{`@keyframes bI{0%{opacity:0;transform:scale(.3) rotate(-8deg)}20%{opacity:1;transform:scale(1.4) rotate(3deg)}80%{opacity:1}100%{opacity:0;transform:scale(.9) translateY(-10px)}}`}</style>
    {show&&<div style={{position:'fixed',left:charX+55,bottom:'14%',fontSize:24,fontWeight:900,fontStyle:'italic',
      color:'#FF1744',textShadow:'2px 2px 0 #000,-1px -1px 0 #000',
      animation:'bI .5s ease-out forwards',pointerEvents:'none',zIndex:14}}>BANG!</div>}
  </>)
}
function FlyingPapers({charX}:{charX:number}){
  return(<>
    <style>{`
      @keyframes p0{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(50px,-75px) rotate(40deg)}}
      @keyframes p1{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(80px,-90px) rotate(-25deg)}}
      @keyframes p2{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(30px,-100px) rotate(55deg)}}
    `}</style>
    {[0,1,2].map(i=>(
      <div key={i} style={{position:'fixed',left:charX+45+i*18,bottom:'14%',
        width:24,height:30,background:'#fff',border:'1px solid #ddd',borderRadius:2,
        animation:`p${i} 1.9s ease-out ${i*.65}s infinite`,pointerEvents:'none',zIndex:12}}>
        {[0,1,2].map(l=><div key={l} style={{height:2,background:'#bbb',margin:`${4+l*7}px 3px 0`,borderRadius:1}}/>)}
      </div>
    ))}
  </>)
}
const THROW_EMOJIS=['📊','📉','💼','☕','📋','📌','🗃️','📂']
interface Projectile{id:number;emoji:string;x:number;yOff:number}
function FlyingObjects({charX}:{charX:number}){
  const [shots,setShots]=useState<Projectile[]>([])
  const idRef=useRef(0); const cxRef=useRef(charX)
  useEffect(()=>{cxRef.current=charX},[charX])
  useEffect(()=>{
    let t:ReturnType<typeof setTimeout>
    const fire=()=>{
      const id=idRef.current++
      setShots(p=>[...p.slice(-6),{id,emoji:THROW_EMOJIS[id%THROW_EMOJIS.length],x:cxRef.current+80,yOff:Math.random()*50}])
      t=setTimeout(fire,900+Math.random()*900)
    }
    t=setTimeout(fire,300); return()=>clearTimeout(t)
  },[])
  return(<>
    <style>{`@keyframes fO{0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(1)}100%{opacity:0;transform:translate(340px,-70px) rotate(520deg) scale(.5)}}`}</style>
    {shots.map(p=>(
      <div key={p.id} style={{position:'fixed',left:p.x,bottom:`calc(12% + ${p.yOff}px)`,
        fontSize:25,animation:'fO 1.4s cubic-bezier(.2,.6,.4,1) forwards',pointerEvents:'none',zIndex:12}}>{p.emoji}</div>
    ))}
  </>)
}

/* ── Dust cloud — trails behind panic runner ─────────────────────────── */
const DUST_PUFFS = Array.from({length:8},(_,i)=>({delay:i*0.11,dur:0.65+i*0.07,dx:i*16}))
function DustCloud({charX,dir}:{charX:number;dir:number}){
  const baseX=dir===1?charX-10:charX+CHAR_W+10
  return(<>
    <style>{`@keyframes dP{0%{opacity:.65;transform:scale(.35) translateY(0)}100%{opacity:0;transform:scale(2) translateY(-28px)}}`}</style>
    {DUST_PUFFS.map((d,i)=>(
      <div key={i} style={{position:'fixed',
        left:baseX+(dir===1?-d.dx:d.dx),bottom:12+i*4,
        width:20,height:20,borderRadius:'50%',
        background:`rgba(190,190,205,${0.5-i*0.04})`,
        animation:`dP ${d.dur}s ease-out ${d.delay}s infinite`,
        pointerEvents:'none',zIndex:11}}/>
    ))}
  </>)
}

/* ── Sweat drops ─────────────────────────────────────────────────────── */
function SweatDrops({charX,charY,viewH}:{charX:number;charY:number;viewH:number}){
  // Face is rows 4-9 of character → charY + 20px to charY + 45px from top
  // Right cheek area: x ≈ charX + 55-70px
  // From bottom of viewport: viewH - (charY + row*PX)
  const cheekBottom = viewH - (charY + 9 * PX)  // bottom of face from viewport bottom
  return(<>
    <style>{`@keyframes sw{0%{opacity:.9;transform:translateY(0)}100%{opacity:0;transform:translateY(32px) scaleY(.6)}}`}</style>
    {[0,1,2].map(i=>(
      <div key={i} style={{position:'fixed',left:charX+60+i*9,bottom:cheekBottom - i*10,
        width:5,height:9,borderRadius:'50% 50% 50% 50% / 60% 60% 40% 40%',
        background:'rgba(147,197,253,.95)',
        animation:`sw 1.0s ease-in ${i*.3}s infinite`,
        pointerEvents:'none',zIndex:13}}/>
    ))}
  </>)
}

/* ── Panic exclamation ────────────────────────────────────────────────── */
function PanicExclaim({charX}:{charX:number}){
  return(<>
    <style>{`@keyframes pe{0%{opacity:0;transform:scale(.2) translateY(8px)}25%{opacity:1;transform:scale(1.5) translateY(-5px)}85%{opacity:1}100%{opacity:0;transform:scale(.9) translateY(-14px)}}`}</style>
    <div style={{position:'fixed',left:charX+58,bottom:'20%',fontSize:30,fontWeight:900,
      color:'#FF1744',textShadow:'2px 2px 0 #000',
      animation:'pe .75s ease-out 0s infinite',pointerEvents:'none',zIndex:14}}>!</div>
    <div style={{position:'fixed',left:charX+74,bottom:'22%',fontSize:22,fontWeight:900,
      color:'#FF6D00',textShadow:'1px 1px 0 #000',
      animation:'pe .75s ease-out .38s infinite',pointerEvents:'none',zIndex:14}}>!</div>
  </>)
}

/* ── Weight sparkles ─────────────────────────────────────────────────── */
function WeightSparkles({charX,charY,viewH}:{charX:number;charY:number;viewH:number}){
  const bottom=viewH-charY+20
  return(<>
    <style>{`@keyframes wS{0%{opacity:0;transform:scale(.2) rotate(0deg)}30%{opacity:1;transform:scale(1.4) rotate(20deg)}100%{opacity:0;transform:scale(.7) rotate(45deg) translateY(-55px)}}`}</style>
    {[0,1,2,3,4].map(i=>(
      <div key={i} style={{position:'fixed',left:charX-22+i*28,bottom:bottom+i%2*22,
        fontSize:13,color:'#fbbf24',fontWeight:900,
        animation:`wS 1.1s ease-out ${i*.2}s infinite`,
        pointerEvents:'none',zIndex:12}}>✦</div>
    ))}
    <div style={{position:'fixed',left:charX+28,bottom:bottom+65,fontSize:18,fontWeight:900,
      color:'#22c55e',textShadow:'1px 1px 0 #000',
      animation:'wS 1.5s ease-out .3s infinite',pointerEvents:'none',zIndex:12}}>💪</div>
  </>)
}

/* ── Telescope sparkles ─────────────────────────────────────────────── */
function TelescopeSparkles({charX,dir}:{charX:number;dir:number}){
  const baseX=dir===1?charX+CHAR_W+85:charX-85
  return(<>
    <style>{`@keyframes ts{0%{opacity:0;transform:scale(.2)}55%{opacity:1;transform:scale(1.3)}100%{opacity:0;transform:scale(.5)}}`}</style>
    {[0,1,2].map(i=>(
      <div key={i} style={{position:'fixed',
        left:baseX+(dir===1?i*22:-i*22),bottom:`calc(22% + ${i*20}px)`,
        fontSize:11,color:'rgba(255,255,200,.95)',
        animation:`ts 1.6s ease-in-out ${i*.55}s infinite`,
        pointerEvents:'none',zIndex:12}}>✨</div>
    ))}
  </>)
}

/* ── Defeat stars (spiral above knocked-out head) ───────────────────── */
function DefeatStars({headX, viewH}:{headX:number; viewH:number}){
  // lyingOy = viewH - 20 - 16*PX = viewH - 100  (mirrors canvas formula exactly)
  // head face rows (c=4..13) span lyingOy+20 .. lyingOy+65
  // head face TOP in canvas = viewH - 100 + 20 = viewH - 80
  // CSS bottom of that point = viewH - (viewH - 80) = 80
  // Stars float upward from ~10px above head top → bottom = 90
  const headTop = 90   // px from viewport bottom, = face top + small gap
  return(<>
    <style>{`
      @keyframes dfS{0%{opacity:0;transform:translateY(0) rotate(0deg) scale(.4)}40%{opacity:1;transform:translateY(-22px) rotate(180deg) scale(1.1)}100%{opacity:0;transform:translateY(-52px) rotate(360deg) scale(.6)}}
      @keyframes dfSpin{0%{opacity:.9;transform:rotate(0deg)}100%{opacity:0;transform:rotate(360deg) translateY(-30px)}}
    `}</style>
    {(['⭐','💫','✨','⭐','💫'] as string[]).map((s,i)=>(
      <div key={i} style={{position:'fixed',left:headX+4+i*14,bottom:headTop+i%2*12,
        fontSize:12+i%2*4,
        animation:`dfS ${1.6+i*.25}s ease-out ${i*.35}s infinite`,
        pointerEvents:'none',zIndex:13}}>{s}</div>
    ))}
    {/* Orbit ring above head */}
    <div style={{position:'fixed',left:headX+8,bottom:headTop+28,
      width:30,height:10,borderRadius:'50%',
      border:'2px solid rgba(255,220,50,.65)',
      animation:'dfSpin 1.1s linear infinite',
      pointerEvents:'none',zIndex:12}}/>
  </>)
}

function ZenParticles({charX, charY, viewH}:{charX:number;charY:number;viewH:number}){
  const bottom=viewH-charY+10
  return(<>
    <style>{`@keyframes zenF{0%{opacity:0;transform:translateY(0) scale(.5) rotate(0deg)}50%{opacity:.9;transform:translateY(-35px) scale(1) rotate(180deg)}100%{opacity:0;transform:translateY(-80px) scale(.4) rotate(360deg)}}`}</style>
    {(['✨','🌸','💫','✨','🌸','💫'] as string[]).map((s,i)=>(
      <div key={i} style={{position:'fixed',left:charX-30+i*22,bottom:bottom+i%2*20,fontSize:10+i%3*4,
        animation:`zenF ${2.5+i*.4}s ease-in-out ${i*.5}s infinite`,pointerEvents:'none',zIndex:12}}>{s}</div>
    ))}
    <div style={{position:'fixed',left:charX+CHAR_W/2-20,bottom:bottom+30,
      width:40,height:40,borderRadius:'50%',
      border:'1.5px solid rgba(167,243,208,.4)',
      boxShadow:'0 0 18px rgba(167,243,208,.2)',
      animation:'zenF 3s ease-in-out infinite',
      pointerEvents:'none',zIndex:11}}/>
  </>)
}

function BathBubbles({charX}:{charX:number}){
  return(<>
    <style>{`@keyframes bbl{0%{opacity:.8;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-90px) scale(.3)}}`}</style>
    {Array.from({length:10},(_,i)=>(
      <div key={i} style={{position:'fixed',left:charX-60+i*16,bottom:90+i%3*12,
        width:6+(i%3)*4,height:6+(i%3)*4,borderRadius:'50%',
        background:'rgba(255,255,255,.25)',border:'1px solid rgba(255,255,255,.5)',
        animation:`bbl ${1.4+i*.18}s ease-out ${i*.22}s infinite`,
        pointerEvents:'none',zIndex:12}}/>
    ))}
  </>)
}

function WakeupEffect({charX,charY,viewH,phase}:{charX:number;charY:number;viewH:number;phase:number}){
  if(phase<1) return null
  const bottom=viewH-charY-20
  return(<>
    <style>{`@keyframes wkE{0%{opacity:0;transform:scale(.2) rotate(-20deg)}30%{opacity:1;transform:scale(1.4) rotate(5deg)}100%{opacity:0;transform:scale(.8) translateY(-20px)}}`}</style>
    <div style={{position:'fixed',left:charX+60,bottom:bottom+40,fontSize:28,fontWeight:900,
      color:'#FFD700',textShadow:'2px 2px 0 #000',
      animation:'wkE .6s ease-out forwards',pointerEvents:'none',zIndex:14}}>!</div>
    {phase>=2&&<div style={{position:'fixed',left:charX+30,bottom:bottom+20,fontSize:18,
      animation:'wkE .5s ease-out .1s forwards',pointerEvents:'none',zIndex:13}}>☕💦</div>}
  </>)
}

function PhoneBubble({charX,charY,viewH}:{charX:number;charY:number;viewH:number}){
  const bottom=viewH-charY+30
  return(<>
    <style>{`@keyframes phB{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    <div style={{position:'fixed',left:charX+CHAR_W+8,bottom:bottom,
      background:'rgba(255,255,255,.9)',border:'1px solid rgba(0,0,0,.1)',borderRadius:12,
      padding:'4px 10px',fontSize:11,fontWeight:700,color:'#333',whiteSpace:'nowrap',
      animation:'phB 1.2s ease-in-out infinite',pointerEvents:'none',zIndex:13,
      boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
      <span style={{letterSpacing:3}}>• • •</span>
    </div>
  </>)
}

function PeekEffect({side, progress}:{side:'left'|'right'; progress:number}){
  return(<>
    <style>{`@keyframes eyeB{0%,100%{transform:scaleY(1)}45%,55%{transform:scaleY(.1)}}`}</style>
  </>)
}

/* ── Perch bubble ──────────────────────────────────────────────────── */
function PerchBubble({charX,charY,viewH}:{charX:number;charY:number;viewH:number}){
  return(<>
    <style>{`@keyframes pbob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-4px)}}`}</style>
    <div style={{position:'fixed',left:charX+CHAR_W/2,top:charY-52,
      transform:'translateX(-50%)',
      background:'rgba(255,255,255,.94)',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,
      padding:'5px 10px',fontSize:13,fontWeight:700,color:'#333',whiteSpace:'nowrap',
      animation:'pbob 1.5s ease-in-out infinite',pointerEvents:'none',zIndex:15,
      boxShadow:'0 2px 12px rgba(0,0,0,.12)'}}>
      👀 what's this?
      <div style={{position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',width:0,height:0,
        borderLeft:'7px solid transparent',borderRight:'7px solid transparent',
        borderTop:'8px solid rgba(0,0,0,.08)'}}/>
      <div style={{position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',width:0,height:0,
        borderLeft:'6px solid transparent',borderRight:'6px solid transparent',
        borderTop:'7px solid rgba(255,255,255,.94)'}}/>
    </div>
  </>)
}

/* ── Night sky ─────────────────────────────────────────────────────── */
const STARS=Array.from({length:22},(_,i)=>({x:(i*7.3)%92+4,y:(i*11.7)%55+30,s:1+(i%3),d:(i*0.35)%3,dur:2+i*0.28}))
function NightSky(){
  return(<>
    <style>{`@keyframes tw{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}`}</style>
    {STARS.map((s,i)=>(
      <div key={i} style={{position:'fixed',left:`${s.x}%`,top:`${s.y}%`,
        width:s.s*2,height:s.s*2,borderRadius:'50%',background:'white',
        animation:`tw ${s.dur}s ease-in-out ${s.d}s infinite`,pointerEvents:'none',zIndex:8}}/>
    ))}
    <div style={{position:'fixed',right:'7%',top:'18%',width:54,height:54,borderRadius:'50%',
      background:'#FFF9C4',boxShadow:'0 0 22px 8px rgba(255,249,196,.3)',pointerEvents:'none',zIndex:8}}>
      <div style={{position:'absolute',left:12,top:14,width:12,height:12,borderRadius:'50%',background:'rgba(200,190,120,.3)'}}/>
      <div style={{position:'absolute',left:28,top:28,width:8,height:8,borderRadius:'50%',background:'rgba(200,190,120,.25)'}}/>
    </div>
    <div style={{position:'fixed',right:'20%',top:'8%',width:80,height:2,
      background:'linear-gradient(to left,rgba(255,255,200,.8),transparent)',
      transform:'rotate(-30deg)',pointerEvents:'none',zIndex:8,opacity:.7}}/>
  </>)
}

function ZzzParticles({charX,charY,viewH}:{charX:number;charY:number;viewH:number}){
  const bottom=viewH-charY-CHAR_H+20
  return(<>
    <style>{`@keyframes zU{0%{opacity:.85;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-90px) scale(.7)}}`}</style>
    {[0,1,2].map(i=>(
      <div key={i} style={{position:'fixed',left:charX+52+i*14,bottom:bottom+i*16,
        color:'#93c5fd',fontSize:10+i*5,fontWeight:700,
        animation:`zU ${2.2+i*.5}s ease-out ${i*.7}s infinite`,pointerEvents:'none',zIndex:11}}>Z</div>
    ))}
  </>)
}

/* ═══ Main component ════════════════════════════════════════════════ */
interface Props { marketState?: MarketState; changePercent?: number }

export default function MarketCharacter({ marketState = 'neutral', changePercent = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasW, setCanvasW]   = useState(1440)
  const [viewH,   setViewH]     = useState(900)
  const [activeState, setActiveState] = useState<MarketState>(marketState)
  const [activeScene, setActiveScene] = useState<Scene>('walk')
  const [charXDisp, setCharXDisp] = useState(300)
  const [charYDisp, setCharYDisp] = useState(740)
  const [dirDisp,   setDirDisp]   = useState<1|-1>(1)
  const [banging,   setBanging]   = useState(false)
  const [forcedScene, setForcedScene] = useState<Scene|null>(null)
  const forcedSceneRef = useRef<Scene|null>(null)
  const [showPerchBubble, setShowPerchBubble] = useState(false)
  const [clickBubble, setClickBubble] = useState<string|null>(null)
  const clickBubbleTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  // scrollOff as ref — no rAF loop restarts when it increments
  const scrollOffRef = useRef(0)

  useEffect(()=>{ setActiveState(marketState) }, [marketState])
  const msRef    = useRef<MarketState>(activeState)
  const viewHRef = useRef(900)
  const widgetPosRef = useRef<Array<{left:number;right:number;top:number;bottom:number}>>([])

  useEffect(()=>{ msRef.current = activeState }, [activeState])

  useEffect(()=>{
    const upd=()=>{ viewHRef.current=window.innerHeight; setViewH(window.innerHeight); setCanvasW(window.innerWidth) }
    upd(); window.addEventListener('resize',upd); return()=>window.removeEventListener('resize',upd)
  },[])

  useEffect(()=>{
    const upd=()=>{
      const els=document.querySelectorAll('[data-char-widget]')
      widgetPosRef.current=Array.from(els).map(el=>{
        const r=(el as HTMLElement).getBoundingClientRect()
        return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}
      })
    }
    upd(); const id=setInterval(upd,1500)
    window.addEventListener('scroll',upd,{passive:true})
    return()=>{ clearInterval(id); window.removeEventListener('scroll',upd) }
  },[])

  // Increment scroll offset in ref — no React re-render, no rAF restart
  useEffect(()=>{
    if(activeScene!=='doomscroll'){ scrollOffRef.current=0; return }
    const id=setInterval(()=>{ scrollOffRef.current++ },80)
    return()=>clearInterval(id)
  },[activeScene])

  const anim = useRef({
    charX:300, charY:740,
    targetY:740, direction:1 as 1|-1,
    tick:0, frameIdx:0, faceFlush:0,
    pauseTimer:0, paused:false, scratchTimer:0,
    sceneIdx:0, sceneStartMs:0,
    currentScene:'walk' as Scene,
    prevState:'neutral' as MarketState,
    lastStateUpdate:0, sceneSnapped:false,
    atPerchTarget:false,
  })

  const rafRef = useRef<number|null>(null)

  const draw = useCallback(()=>{
    const canvas = canvasRef.current
    if(!canvas){ rafRef.current=requestAnimationFrame(draw); return }
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const ms  = msRef.current
    const s   = anim.current
    const W   = canvas.width
    const H   = canvas.height
    const now = performance.now()

    ctx.clearRect(0,0,W,H)

    const groundY = H - CHAR_H - 20
    const zones   = sideZones(W)
    const zKey: 'L'|'R' = ms==='bear' ? 'L' : 'R'
    const zone = zones[zKey]
    const zL = zones.L   // always the left side zone

    // ── Scene management ─────────────────────────────────────────
    if(s.prevState !== ms){
      s.sceneIdx=0; s.sceneStartMs=now; s.prevState=ms; s.sceneSnapped=false; s.atPerchTarget=false
      // Don't teleport charX — let the walk-snap lerp to the new zone naturally
      s.targetY=groundY; s.charY=groundY; s.faceFlush=0
    }
    const cycle=SCENE_CYCLES[ms]
    const cfg=cycle[s.sceneIdx]
    if(cfg.ms<9999999 && now-s.sceneStartMs>cfg.ms){
      s.sceneIdx=(s.sceneIdx+1)%cycle.length; s.sceneStartMs=now; s.sceneSnapped=false; s.atPerchTarget=false
    }
    const scene = forcedSceneRef.current ?? cycle[s.sceneIdx].scene
    if(scene!==s.currentScene){ s.currentScene=scene; setActiveScene(scene) }

    // ── Y lerp ───────────────────────────────────────────────────
    if(scene!=='perch'&&scene!=='sleep'&&scene!=='gaming'&&scene!=='bubblebath'&&scene!=='wakeup') s.targetY=groundY
    if(Math.abs(s.charY-s.targetY)>0.5) s.charY+=(s.targetY-s.charY)*0.055
    else s.charY=s.targetY

    let pose:Pose={...WALK_FRAMES[s.frameIdx]}

    // ── SLEEP ────────────────────────────────────────────────────
    if(scene==='sleep'){
      s.charX=W/2; s.faceFlush=0
      const bob=Math.round(Math.sin(now*0.0008)*2)
      drawBed(ctx, W/2, H)

      // ── Blanket: shaped path with raised body profile ─────────────
      // head right (neck) = headOx + 11*PX = W/2-108+55 = W/2-53
      // Start blanket a bit left of neck so it tucks under the chin — no gap
      const neckX  = Math.round(W/2-62)
      const bedBot = Math.round(H-8)
      // Blanket left edge goes up to chin height (same y as head center)
      const chinY  = Math.round(H-110)
      const shoulderY = Math.round(H-82)

      // Drop shadow behind blanket for depth
      ctx.fillStyle='#121f52'
      ctx.beginPath()
      ctx.moveTo(neckX+3, chinY+5)
      ctx.quadraticCurveTo(Math.round(W/2+8),  Math.round(H-140+5), Math.round(W/2+60), Math.round(H-120+5))
      ctx.quadraticCurveTo(Math.round(W/2+88), Math.round(H-94+5),  Math.round(W/2+108),Math.round(H-106+5))
      ctx.quadraticCurveTo(Math.round(W/2+128),Math.round(H-112+5), Math.round(W/2+130),Math.round(H-75+5))
      ctx.lineTo(Math.round(W/2+130), bedBot)
      ctx.lineTo(neckX+3, bedBot)
      ctx.closePath(); ctx.fill()

      // Main blanket — big torso hump + knee hump
      ctx.fillStyle='#1e3a8a'
      ctx.beginPath()
      ctx.moveTo(neckX, chinY)
      // Steep rise for large torso hump
      ctx.quadraticCurveTo(Math.round(W/2+8),  Math.round(H-145), Math.round(W/2+58), Math.round(H-122))
      // Dip between torso and knees
      ctx.quadraticCurveTo(Math.round(W/2+85), Math.round(H-92),  Math.round(W/2+106),Math.round(H-108))
      // Knee bump
      ctx.quadraticCurveTo(Math.round(W/2+126),Math.round(H-114), Math.round(W/2+128),Math.round(H-76))
      // Taper to footboard
      ctx.quadraticCurveTo(Math.round(W/2+130),Math.round(H-60),  Math.round(W/2+122), bedBot)
      ctx.lineTo(neckX, bedBot)
      ctx.closePath(); ctx.fill()

      // Top-face highlight on torso hump (catches the light)
      ctx.fillStyle='#2850b8'
      ctx.beginPath()
      ctx.moveTo(neckX, chinY)
      ctx.quadraticCurveTo(Math.round(W/2+8),  Math.round(H-145), Math.round(W/2+48), Math.round(H-124))
      ctx.quadraticCurveTo(Math.round(W/2+28), Math.round(H-106), neckX, Math.round(H-94))
      ctx.closePath(); ctx.fill()

      // Chin-fold edge — bright vertical strip right at neck
      ctx.fillStyle='#2d63d4'
      ctx.fillRect(neckX, chinY, 10, shoulderY - chinY + 18)
      ctx.fillStyle='#4a80f0'
      ctx.fillRect(neckX+2, chinY, 5, 14)

      // Subtle vertical stripe texture
      ctx.fillStyle='rgba(255,255,255,.06)'
      for(let i=0;i<4;i++) ctx.fillRect(neckX+16+i*30, Math.round(H-105), 16, 80)

      // ── Head drawn LAST — overlaps blanket left edge, no visible gap ─
      const headOx=Math.round(W/2-108), headOy=Math.round(H-133)
      drawSleepingHead(ctx, headOx, headOy, bob, W, H)
    }

    // ── GAMING ───────────────────────────────────────────────────
    else if(scene==='gaming'){
      if(!s.sceneSnapped){
        s.charX=zL.ok?zL.min+20:60
        s.direction=1; s.sceneSnapped=true
        s.targetY=groundY   // sit at ground level, legs spread via pose
      }
      s.faceFlush=Math.max(0,s.faceFlush-0.01)
      pose.bodyDY=2
      pose.leftLegDX=-3; pose.rightLegDX=3
      // Smooth button-press: alternate arms on a sin cycle
      const btn=Math.sin(now*.006)
      pose.leftArmDY=Math.round(2+btn*1.5)
      pose.rightArmDY=Math.round(2-btn*1.5)
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H,32,NIGHTGOWN_MAP)
      drawController(ctx, Math.round(s.charX), Math.round(s.charY))
    }

    // ── IDLE (stationary) ────────────────────────────────────────
    else if(scene==='walk'){
      // Snap to a fixed position once
      if(!s.sceneSnapped){
        s.charX = zL.ok ? (zL.min+zL.max)/2 : 70
        s.direction = 1
        s.sceneSnapped = true
      }
      let extraBounce=0, shakeX=0
      if(ms==='bull'){
        // Head-bob — visible rhythmic bounce like he's vibing
        extraBounce = Math.round(Math.sin(now*.007)*-5)
        pose.leftArmDY  = Math.round(Math.sin(now*.007)*-3)
        pose.rightArmDY = Math.round(Math.sin(now*.007+Math.PI)*-3)
        s.faceFlush = Math.max(0, s.faceFlush-.005)
      } else if(ms==='bear'){
        // Stressed shake but stays put
        shakeX = Math.round(Math.sin(now*0.09)*1.5)
        s.faceFlush = Math.min(1, s.faceFlush+.003)
        pose.bodyDY += 1
      } else {
        // Neutral: visible idle bob so animation is apparent from frame 1
        extraBounce = Math.round(Math.sin(now*.005)*-4)
        pose.leftArmDY  = Math.round(Math.sin(now*.005)*-2)
        pose.rightArmDY = Math.round(Math.sin(now*.005+Math.PI)*-2)
        s.faceFlush = Math.max(0, s.faceFlush-.005)
        if(!s.paused){if(++s.pauseTimer>280){s.paused=true;s.scratchTimer=50;s.pauseTimer=0}}
        else{if(--s.scratchTimer<=0)s.paused=false}
      }
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,extraBounce,shakeX,W,H)
    }

    // ── DEFEAT (lying flat on ground) ───────────────────────────
    else if(scene==='defeat'){
      s.faceFlush=0
      // Character lying on their side: GRID row r → x axis, col c → y axis
      // This gives a top-down side-lying view: head on left, feet on right
      const lyingOx = Math.round(W/2 - 31*PX/2 - 20)   // slightly left of center
      const lyingOy = Math.round(H - 20 - 16*PX)        // bottom of figure at ground

      // Ground shadow ellipse
      ctx.fillStyle='rgba(0,0,0,.18)'
      ctx.beginPath()
      ctx.ellipse(lyingOx+80, Math.round(H-14), 90, 7, 0, 0, Math.PI*2)
      ctx.fill()

      // Draw full body lying flat (r→x, c→y)
      for(let r=0;r<32;r++){
        for(let c=0;c<20;c++){
          const raw=GRID[r][c]
          if(!raw) continue
          const px=lyingOx+r*PX
          const py=lyingOy+c*PX
          if(px<0||py<0||px+PX>W||py+PX>H) continue
          // Slight red flush on the face rows/cols
          let col=raw
          if(raw===SK && r>=4 && r<=11 && c>=4 && c<=13)
            col=lerpColor(SK,'#ff7070',.35)
          ctx.fillStyle=col
          ctx.fillRect(px,py,PX,PX)
        }
      }

      // Small "KO" indicator above head — X pupils over glasses area
      // Glasses lenses (G2) are at r=6-7, c=6-7 (left) and c=10-11 (right)
      // In lying coords: x=lyingOx+30, y1=lyingOy+30 / y2=lyingOy+50
      ctx.fillStyle='#ff2222'
      // Left lens X
      ctx.fillRect(lyingOx+30, lyingOy+28, PX, PX)
      ctx.fillRect(lyingOx+30, lyingOy+38, PX, PX)
      ctx.fillRect(lyingOx+35, lyingOy+33, PX, PX)  // center of X
      ctx.fillRect(lyingOx+25, lyingOy+33, PX, PX)
      // Right lens X
      ctx.fillRect(lyingOx+30, lyingOy+48, PX, PX)
      ctx.fillRect(lyingOx+30, lyingOy+58, PX, PX)
      ctx.fillRect(lyingOx+35, lyingOy+53, PX, PX)
      ctx.fillRect(lyingOx+25, lyingOy+53, PX, PX)

      // Sync charX/charY for overlay positioning (head is at lyingOx, lyingOy+40 center)
      s.charX=lyingOx; s.charY=Math.round(H-20-CHAR_H)
    }

    // ── WAKE-UP (jolt awake from sleep) ─────────────────────────
    else if(scene==='wakeup'){
      s.charX=W/2; s.faceFlush=0
      const elapsed=now-s.sceneStartMs
      if(elapsed<2200){
        // Phase 1: sleeping
        const bob=Math.round(Math.sin(now*0.0008)*2)
        drawBed(ctx,W/2,H)
        const neckX=Math.round(W/2-62)
        const bedBot=Math.round(H-8)
        ctx.fillStyle='#1e3a8a'
        ctx.beginPath()
        ctx.moveTo(neckX,Math.round(H-110))
        ctx.quadraticCurveTo(Math.round(W/2+8),Math.round(H-145),Math.round(W/2+58),Math.round(H-122))
        ctx.quadraticCurveTo(Math.round(W/2+85),Math.round(H-92),Math.round(W/2+106),Math.round(H-108))
        ctx.quadraticCurveTo(Math.round(W/2+126),Math.round(H-114),Math.round(W/2+128),Math.round(H-76))
        ctx.quadraticCurveTo(Math.round(W/2+130),Math.round(H-60),Math.round(W/2+122),bedBot)
        ctx.lineTo(neckX,bedBot); ctx.closePath(); ctx.fill()
        drawSleepingHead(ctx,Math.round(W/2-108),Math.round(H-133),bob,W,H)
      } else {
        // Phase 2: standing up, disoriented
        const joltT=(elapsed-2200)/1000
        const joltBob=Math.round(Math.sin(joltT*12)*Math.max(0,1-joltT)*-8)
        pose.leftArmDY=Math.round(Math.sin(joltT*8)*-6)
        pose.rightArmDY=Math.round(Math.sin(joltT*8+Math.PI)*-6)
        renderCharacter(ctx,pose,Math.round(s.charX-50),Math.round(s.charY),1,0,joltBob,Math.round(Math.sin(joltT*15)*3),W,H,32,NIGHTGOWN_MAP)
      }
    }

    // ── PEEK (slide in from edge, look around, slide back) ──────
    else if(scene==='peek'){
      s.faceFlush=0
      const elapsed=now-s.sceneStartMs
      const peekSide: 1|-1 = 1  // always from right
      const hiddenX = W+CHAR_W+10
      const peekX   = W-CHAR_W-18
      // Timeline: 0-1200ms slide in, 1200-4000ms hold, 4000-5200ms slide out
      let charX: number
      if(elapsed<1200){
        const t=elapsed/1200
        const ease=1-Math.pow(1-t,3)
        charX=hiddenX+(peekX-hiddenX)*ease
      } else if(elapsed<4000){
        charX=peekX
      } else {
        const t=Math.min(1,(elapsed-4000)/1200)
        const ease=t*t*t
        charX=peekX+(hiddenX-peekX)*ease
      }
      s.charX=charX
      const lookDir: 1|-1 = -1  // always looking inward
      const bob=Math.round(Math.sin(now*0.0015)*2)
      pose.bodyDY=bob
      renderCharacter(ctx,pose,Math.round(charX),Math.round(s.charY),lookDir,0,0,0,W,H)
    }

    // ── COFFEE (slow walk holding coffee cup) ───────────────────
    else if(scene==='coffee'){
      if(!s.sceneSnapped){ s.direction=1; s.sceneSnapped=true; s.charX=zL.ok?zL.min+20:50 }
      s.faceFlush=0
      // Glacially slow drift — sleepy zombie walk
      s.charX+=s.direction*0.18
      const coffeeMin=zL.ok?zL.min+10:40
      const coffeeMax=zL.ok?Math.min(zL.max,coffeeMin+180):220
      if(s.charX<coffeeMin){s.direction=1}
      if(s.charX>coffeeMax){s.direction=-1}
      // Smooth sin sway — no discrete frames, no pixel jumps
      const st=now*0.0009
      pose={
        leftArmDY:  0,
        rightArmDY: -2,
        leftLegDX:  Math.round(Math.sin(st)*1.6),
        rightLegDX: Math.round(Math.sin(st)*-1.6),
        bodyDY:     Math.round(Math.abs(Math.sin(st))*1.5),
      }
      drawCoffeeCup(ctx, Math.round(s.charX), Math.round(s.charY), s.direction)
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H)
    }

    // ── PHONE (pace back and forth on a call) ───────────────────
    else if(scene==='phone'){
      if(!s.sceneSnapped){
        s.charX=zL.ok?zL.min+30:70; s.direction=1; s.sceneSnapped=true
      }
      s.faceFlush=0
      const paceRange=60
      const paceCenter=zL.ok?(zL.min+zL.max)/2+20:100
      s.charX+=s.direction*0.55
      if(s.charX<paceCenter-paceRange){s.direction=1}
      if(s.charX>paceCenter+paceRange){s.direction=-1}
      // Smooth sin — no discrete walk frames, no pixel-jump jitter
      const pt=now*0.001
      pose={
        leftArmDY:  -14,                                        // locked at ear
        rightArmDY: Math.round(Math.sin(pt)*1.4),              // free arm sways gently
        leftLegDX:  Math.round(Math.sin(pt)*1.6),
        rightLegDX: Math.round(Math.sin(pt)*-1.6),
        bodyDY:     Math.round(Math.abs(Math.sin(pt))*1.5),
      }
      // Phone pressed to whichever side the left arm appears on (left when dir=1, right when dir=-1)
      const phoneEarX=s.direction===1
        ? Math.round(s.charX)+2                  // dir=1: left arm at charX+0..10
        : Math.round(s.charX)+CHAR_W-18          // dir=-1: left arm flips to charX+90..95
      const phoneEarY=Math.round(s.charY)+22     // ear level ~row 5
      ctx.fillStyle='#0f0f1a'; ctx.fillRect(phoneEarX,phoneEarY,9,16)
      ctx.fillStyle='#4a90d9'; ctx.fillRect(phoneEarX+1,phoneEarY+1,7,4)  // screen glow
      ctx.fillStyle='#1e3a8a'; ctx.fillRect(phoneEarX+1,phoneEarY+5,7,9)
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H)
    }

    // ── MEDITATION (float, zen pose) ─────────────────────────────
    // ── DARTBOARD (throw darts at a chart on the wall) ───────────

    // ── BUBBLE BATH (sitting in tub, bubbles floating) ───────────
    else if(scene==='bubblebath'){
      if(!s.sceneSnapped){ s.charX=W/2; s.direction=1; s.sceneSnapped=true }
      s.faceFlush=0
      const bob=Math.round(Math.sin(now*0.0007)*2)
      drawBathtub(ctx, Math.round(s.charX), H)
      // Only render top half of character (head + torso, cut off at waist)
      // Draw clipped to tub area
      ctx.save()
      ctx.beginPath(); ctx.rect(Math.round(s.charX)-100, H-200, 200, 200); ctx.clip()
      pose.bodyDY=4; pose.leftArmDY=3; pose.rightArmDY=3
      renderCharacter(ctx,pose,Math.round(s.charX)-CHAR_W/2,Math.round(s.charY+bob),s.direction,0,0,0,W,H,16,SHIRTLESS_MAP)
      ctx.restore()
      // Rubber duck
      const duckX=Math.round(s.charX)+55
      const duckY=H-52+bob
      ctx.fillStyle='#FFD700'
      ctx.beginPath(); ctx.ellipse(duckX,duckY,12,8,0,0,Math.PI*2); ctx.fill()
      ctx.fillStyle='#FFD700'
      ctx.beginPath(); ctx.ellipse(duckX-8,duckY-8,7,6,-0.3,0,Math.PI*2); ctx.fill()
      ctx.fillStyle='#FF6B35'
      ctx.beginPath(); ctx.moveTo(duckX-14,duckY-8); ctx.lineTo(duckX-10,duckY-6); ctx.lineTo(duckX-14,duckY-4); ctx.closePath(); ctx.fill()
      ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(duckX-11,duckY-10,1.5,0,Math.PI*2); ctx.fill()
      // Water foam line
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fillRect(Math.round(s.charX)-82,H-52,164,5)
      s.charY=Math.round(H-CHAR_H-20)
    }

    // ── MONEY COUNT ──────────────────────────────────────────────
    else if(scene==='money'){
      if(!s.sceneSnapped){
        s.charX=zL.ok?zL.min+30:70; s.direction=1; s.sceneSnapped=true
      }
      s.faceFlush=Math.max(0,s.faceFlush-.01)
      const flipT=now*.004
      // Slow deliberate counting arm motion
      pose.rightArmDY=Math.round(Math.sin(flipT)*-3)-1
      pose.leftArmDY=Math.round(Math.sin(flipT+0.8)*-1)+1
      pose.bodyDY=1
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H)
      // Draw a stack of bills in hand
      const billDir=s.direction
      const bx=billDir===1?Math.round(s.charX)+CHAR_W-8:Math.round(s.charX)-38
      const by=Math.round(s.charY)+65+Math.round(Math.sin(flipT)*-3)*PX
      // Stack of bills (offset layers)
      for(let i=3;i>=0;i--){
        ctx.fillStyle=i===0?'#85bb65':i===1?'#6aaa52':'#5a9944'
        ctx.fillRect(bx-i,by-i,38,22)
        if(i===0){
          ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(bx+3,by+3,32,4)
          ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(bx+3,by+10,28,3)
          ctx.fillStyle='#fff'; ctx.font='bold 8px monospace'
          ctx.fillText('$',bx+16,by+16)
        }
      }
    }

    // ── PARTY ────────────────────────────────────────────────────
    else if(scene==='party'){
      if(!s.sceneSnapped){
        s.charX=zL.ok?zL.min+30:70; s.direction=1; s.sceneSnapped=true
      }
      s.faceFlush=Math.max(0,s.faceFlush-.01)
      const t=now*.004
      pose.bodyDY=Math.round(Math.sin(t)*-5)
      pose.leftArmDY=Math.round(Math.sin(t)*-4); pose.rightArmDY=Math.round(Math.sin(t+Math.PI)*-4)
      pose.leftLegDX=Math.round(Math.sin(t*.7)*-2); pose.rightLegDX=Math.round(Math.sin(t*.7+Math.PI)*-2)
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H)
    }

    // ── BEACH ────────────────────────────────────────────────────
    else if(scene==='beach'){
      if(!s.sceneSnapped){
        s.charX=zL.ok?zL.min+20:60
        s.direction=1; s.sceneSnapped=true
      }
      s.faceFlush=Math.max(0,s.faceFlush-.01)
      const seatY=H-75  // must match drawBeachChair: base-55 = H-20-55
      drawBeachChair(ctx, Math.round(s.charX), H)
      const seatedY=seatY-CHAR_H+55  // sit character so torso rests on seat
      const breathe=Math.sin(now*.0008)
      pose.bodyDY=0
      pose.leftArmDY=3; pose.rightArmDY=2; pose.leftLegDX=-2; pose.rightLegDX=2
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(seatedY+breathe),s.direction,0,0,0,W,H,21)
    }

    // ── WEIGHTS ──────────────────────────────────────────────────
    else if(scene==='weights'){
      if(!s.sceneSnapped){
        s.charX=zL.ok?zL.min+30:70; s.direction=1; s.sceneSnapped=true
      }
      const liftCycle=(Math.sin(now*.0028)+1)/2   // 0→1→0, smooth press
      pose.leftArmDY =Math.round(liftCycle*-9)
      pose.rightArmDY=Math.round(liftCycle*-9)
      pose.bodyDY=Math.round(liftCycle*-1)
      s.faceFlush=Math.min(.35,s.faceFlush+.001)
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,0,W,H)
      drawDumbbell(ctx, Math.round(s.charX), Math.round(s.charY), liftCycle)
    }

    // ── NEWSPAPER ────────────────────────────────────────────────
    else if(scene==='newspaper'){
      if(!s.sceneSnapped){
        s.charX=zL.ok?zL.min+30:70; s.direction=1; s.sceneSnapped=true
      }
      s.faceFlush=Math.max(0,s.faceFlush-.01)
      const wave=Math.round(Math.sin(now*.0009)*2)  // integer wave for clean fillRect
      pose.bodyDY=1; pose.leftArmDY=2; pose.rightArmDY=2
      pose.leftLegDX=-1; pose.rightLegDX=1
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H)
      drawNewspaper(ctx, Math.round(s.charX), Math.round(s.charY), s.direction, wave)
    }

    // ── DESK ─────────────────────────────────────────────────────
    else if(scene==='desk'){
      if(!s.sceneSnapped){
        s.charX=55  // desk is always drawn at x=4, character stands at x=55 behind it
        s.direction=1; s.sceneSnapped=true
      }
      s.faceFlush=Math.min(1,s.faceFlush+.004)
      // Smooth arm cycle — sin curve replaces binary snap
      const bangT=now*.007
      const armPos=Math.round(Math.sin(bangT)*-4)   // integer, clean pixel movement
      const isBang=Math.sin(bangT)>.55
      // Body dips slightly on downstroke
      const bodyDip=Math.round((1-Math.abs(Math.sin(bangT)))*.5*-1)
      // Sin-based shake
      const shakeX=Math.round(Math.sin(now*.06)*1.5)
      renderCharacter(ctx,{...pose,leftArmDY:armPos,rightArmDY:armPos,bodyDY:bodyDip},
        Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,shakeX,W,H)
      drawDesk(ctx, Math.round(s.charX), H)
      const prev=Math.sin(bangT-.12)>.55
      if(isBang&&!prev)setBanging(true); if(!isBang&&prev)setBanging(false)
    }

    // ── DOOM SCROLL ──────────────────────────────────────────────
    else if(scene==='doomscroll'){
      if(!s.sceneSnapped){
        s.charX=zone.ok?(zone.min+zone.max)/2:60; s.direction=1; s.sceneSnapped=true
        s.faceFlush=0
      }
      s.faceFlush=Math.min(.55,s.faceFlush+.002)
      const micro=Math.sin(now*.0004)*0.8   // very slow transfixed sway
      pose.bodyDY=Math.round(3+micro)
      pose.leftArmDY=4; pose.rightArmDY=-1
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,0,W,H,32)
      drawPhone(ctx, Math.round(s.charX), Math.round(s.charY), s.direction, scrollOffRef.current)
    }

    // ── PANIC RUN ────────────────────────────────────────────────
    else if(scene==='panicrun'){
      const panicSpeed=8, panicFrameRate=3
      s.faceFlush=Math.min(1,s.faceFlush+.008)
      if(zone.ok){
        s.charX+=panicSpeed*s.direction
        if(s.charX>zone.max){s.charX=zone.max;s.direction=-1}
        if(s.charX<zone.min){s.charX=zone.min;s.direction=1}
      }else{
        s.charX+=panicSpeed*s.direction
        if(s.charX>W-CHAR_W-10){s.charX=W-CHAR_W-10;s.direction=-1}
        if(s.charX<10){s.charX=10;s.direction=1}
      }
      s.tick++; if(s.tick>=panicFrameRate){s.tick=0;s.frameIdx=(s.frameIdx+1)%8}
      const lean=s.direction===1?2:-2
      pose.bodyDY=-1
      // Flailing arms — sin-based, no random
      pose.leftArmDY =Math.round(Math.sin(now*.014)*-5)
      pose.rightArmDY=Math.round(Math.sin(now*.014+Math.PI)*-5)
      // Smooth sin shake instead of random per-frame
      const shakeX=Math.round(Math.sin(now*0.13)*2)
      renderCharacter(ctx,pose,Math.round(s.charX)+lean,Math.round(s.charY),s.direction,s.faceFlush,0,shakeX,W,H)
    }

    // ── THROW ────────────────────────────────────────────────────
    else if(scene==='throw'){
      if(!s.sceneSnapped){s.charX=zL.ok?zL.min+20:60;s.direction=1;s.sceneSnapped=true}
      const throwT=now*.005; const windup=Math.sin(throwT)>0
      pose.rightArmDY=windup?-5:2; pose.leftArmDY=windup?1:-1; pose.bodyDY=windup?-1:0
      s.faceFlush=Math.min(1,s.faceFlush+.003)
      // Smooth sin shake instead of random
      const shakeX=Math.round(Math.sin(now*0.07)*(windup?1.5:0.5))
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,shakeX,W,H)
    }

    // ── TELESCOPE ────────────────────────────────────────────────
    // ── PERCH ────────────────────────────────────────────────────
    else if(scene==='perch'){
      if(!s.sceneSnapped){
        s.sceneSnapped=true; s.atPerchTarget=false
        const vis=widgetPosRef.current.filter(w=>w.top>80&&w.top<H*.75&&w.bottom>0)
        if(vis.length>0){
          const widget=vis[Math.floor(Math.random()*vis.length)]
          s.targetY=widget.top-CHAR_H+4
          const innerEdge=ms==='bear'?widget.left-CHAR_W+10:widget.right-CHAR_W-10
          const z=zones[zKey]
          s.charX=Math.max(z.ok?z.min:5, Math.min(z.ok?z.max:W-CHAR_W-5, innerEdge))
        } else { s.targetY=H*.38 }
        s.direction=ms==='bear'?1:-1
      }
      const atTarget=Math.abs(s.charY-s.targetY)<6
      if(atTarget&&!s.atPerchTarget){ s.atPerchTarget=true; setShowPerchBubble(true) }
      if(!atTarget) setShowPerchBubble(false)
      if(atTarget){
        pose.bodyDY=Math.round(Math.sin(now*.001)*1)
        pose.leftLegDX=Math.round(Math.sin(now*.002)*-2)
        pose.rightLegDX=Math.round(Math.sin(now*.002+Math.PI)*-2)
        pose.rightArmDY=Math.round(Math.sin(now*.004)*-3)
      }
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H)
    }

    // ── Throttled React sync ──────────────────────────────────────
    if(now-s.lastStateUpdate>120){
      setCharXDisp(Math.round(s.charX))
      setCharYDisp(Math.round(s.charY))
      setDirDisp(s.direction)
      s.lastStateUpdate=now
    }

    rafRef.current=requestAnimationFrame(draw)
  // No scrollOff in deps — use ref instead to avoid rAF restart every 80ms
  },[])

  useEffect(()=>{
    rafRef.current=requestAnimationFrame(draw)
    return()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current) }
  },[draw])

  useEffect(()=>{
    const c=canvasRef.current; if(c){c.width=canvasW;c.height=viewH}
  },[canvasW,viewH])

  useEffect(()=>{ if(activeScene!=='perch') setShowPerchBubble(false) },[activeScene])

  const handleCharacterClick = () => {
    const ms = anim.current.currentScene
    const state = msRef.current
    const quips: Record<string, string[]> = {
      walk:       state==='bull' ? ['Crushing it! 📈','Leggo!','This is fine. 🔥'] : state==='bear' ? ['I hate Mondays','WHY','Not now.','...sigh'] : ['Hmm.','ok.','👀'],
      party:      ['YEAAAH!','LFG!!','🎉🎉🎉','WE ARE SO BACK'],
      beach:      ['...leave me alone.','zoning out rn','vibes only 🌊','go away'],
      desk:       ['I AM BUSY','not now!','*keyboard smash*','DO NOT DISTURB'],
      throw:      ['TAKE THAT!','AAAAAA','*throws harder*'],
      sleep:      ['Zzz...huh?!','5 more mins...','THE MARKET IS WHAT?!','*falls off bed*'],
      gaming:     ['ONE MORE GAME','gg no re','I\'m in the zone','shh'],
      doomscroll: ['stonks go down 📉','why do I do this','send help','it\'s fine'],
      panicrun:   ['AHHHHHH','SELL SELL SELL','NOT MY PORTFOLIO','MAYDAY MAYDAY'],
      wakeup:     ['WHAT TIME IS IT','THE MARKET IS OPEN?!','where\'s my coffee','*screams internally*'],
      peek:       ['...just checking','nothing to see here','👀','hi','I wasn\'t here'],
      coffee:     ['just need one more cup','don\'t talk to me','coffee = gains','...sipping'],
      phone:      ['hold on I\'m on a call','not now','yes...yes...WHAT?!','talking to my broker'],
      bubblebath: ['finally some me-time','no charts in the tub','squeaky clean gains','leave me alone'],
      money:      ['counting my gains','hmm...','not bad not bad','where did it all go'],
      newspaper:  ['Interesting...','hm, not great','who writes this stuff'],
      weights:    ['LETS GOOO 💪','gains only','PUSH PUSH PUSH','no pain no gain'],
      perch:      ['👀 observing','sus.','noted.'],
    }
    const pool = quips[ms] ?? ['Hey!', 'What?', 'Ow!']
    const quip = pool[Math.floor(Math.random() * pool.length)]
    if (clickBubbleTimer.current) clearTimeout(clickBubbleTimer.current)
    setClickBubble(quip)
    clickBubbleTimer.current = setTimeout(() => setClickBubble(null), 2200)
  }

  const STATE_COLOR:Record<MarketState,string>={bull:'#22c55e',bear:'#ef4444',neutral:'#94a3b8',closed:'#818cf8'}
  const STATE_LABEL:Record<MarketState,string>={bull:'📈 Bull',bear:'📉 Bear',neutral:'😐 Flat',closed:'🌙 Closed'}
  const zones=sideZones(canvasW)

  return (<>
    <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100vh',zIndex:10,pointerEvents:'none'}}>
      <canvas ref={canvasRef} width={canvasW} height={viewH}
        style={{display:'block',width:'100%',height:'100vh',imageRendering:'pixelated'}}/>
    </div>

    {/* Clickable zone over character */}
    <div
      style={{position:'fixed',left:charXDisp,top:charYDisp,width:CHAR_W,height:CHAR_H,
        cursor:'pointer',pointerEvents:'all',zIndex:16}}
      onClick={handleCharacterClick}
    />

    {/* Speech bubble on click */}
    {clickBubble && (
      <>
        <style>{`@keyframes bubblePop{0%{opacity:0;transform:translateX(-50%) scale(.5) translateY(8px)}15%{opacity:1;transform:translateX(-50%) scale(1.1) translateY(-2px)}25%{transform:translateX(-50%) scale(1) translateY(0)}85%{opacity:1;transform:translateX(-50%)}100%{opacity:0;transform:translateX(-50%) translateY(-10px)}}`}</style>
        <div style={{position:'fixed',left:charXDisp+CHAR_W/2,top:charYDisp-62,
          transform:'translateX(-50%)',
          zIndex:20,pointerEvents:'none',
          background:'#fff',border:'2px solid #222',borderRadius:12,
          padding:'6px 14px',fontSize:13,fontWeight:800,color:'#111',whiteSpace:'nowrap',
          boxShadow:'3px 3px 0 #222',
          animation:'bubblePop 2.2s ease forwards'}}>
          {clickBubble}
          <div style={{position:'absolute',bottom:-10,left:'50%',transform:'translateX(-50%)',
            width:0,height:0,borderLeft:'8px solid transparent',borderRight:'8px solid transparent',
            borderTop:'10px solid #222'}}/>
          <div style={{position:'absolute',bottom:-7,left:'50%',transform:'translateX(-50%)',
            width:0,height:0,borderLeft:'7px solid transparent',borderRight:'7px solid transparent',
            borderTop:'9px solid #fff'}}/>
        </div>
      </>
    )}

    {activeScene==='party'&&<>
      <ConfettiRain zoneX={charXDisp-80} zoneW={260}/>
      <MusicNotes charX={charXDisp}/>
    </>}
    {/* beach scene — chair is drawn on canvas, no overlay effects */}
    {activeScene==='desk'&&<><AngerMarks charX={charXDisp}/><FlyingPapers charX={charXDisp}/><BangText charX={charXDisp} show={banging}/></>}
    {activeScene==='throw'&&<FlyingObjects charX={charXDisp}/>}
    {activeScene==='sleep'&&<ZzzParticles charX={Math.round(canvasW/2-130)} charY={viewH-248} viewH={viewH}/>}
    {activeState==='closed'&&<NightSky/>}
    {activeScene==='perch'&&showPerchBubble&&<PerchBubble charX={charXDisp} charY={charYDisp} viewH={viewH}/>}
    {activeScene==='weights'&&<WeightSparkles charX={charXDisp} charY={charYDisp} viewH={viewH}/>}
    {activeScene==='doomscroll'&&<SweatDrops charX={charXDisp} charY={charYDisp} viewH={viewH}/>}
    {activeScene==='panicrun'&&<><DustCloud charX={charXDisp} dir={dirDisp}/><PanicExclaim charX={charXDisp}/></>}

    {activeScene==='defeat'&&<DefeatStars headX={Math.round(canvasW/2-31*PX/2-20)} viewH={viewH}/>}
    {activeScene==='wakeup'&&<ZzzParticles charX={Math.round(canvasW/2-130)} charY={viewH-248} viewH={viewH}/>}
    {activeScene==='bubblebath'&&<BathBubbles charX={charXDisp}/>}
    {activeScene==='phone'&&<PhoneBubble charX={charXDisp} charY={charYDisp} viewH={viewH}/>}
    {activeScene==='walk'&&activeState==='bear'&&<>
      <style>{`@keyframes stm{0%{opacity:.75;transform:translateY(0)}100%{opacity:0;transform:translateY(-55px)}}`}</style>
      {[0,1,2].map(i=>(
        <div key={i} style={{position:'fixed',left:charXDisp+24+i*12,bottom:18+(i%2)*9,
          width:8,height:8,borderRadius:'50%',
          background:i%2===0?'rgba(255,255,255,.8)':'rgba(180,180,205,.55)',
          animation:`stm ${.85+i*.12}s ease-out ${i*.14}s infinite`,pointerEvents:'none',zIndex:11}}/>
      ))}
    </>}
    {activeScene==='walk'&&activeState==='bull'&&<>
      <style>{`@keyframes spk{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1.4)}}`}</style>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{position:'fixed',left:charXDisp-20+i*22,bottom:16+(i%2)*18,
          color:'#fbbf24',fontSize:13,animation:`spk 1.5s ease-in-out ${i*.25}s infinite`,
          pointerEvents:'none',zIndex:11}}>✦</div>
      ))}
    </>}

    {/* closed-state overlay removed — no page dimming */}

    {/* Debug scene buttons — dev only */}
    {process.env.NODE_ENV === 'development' && (
      <div style={{position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:5,zIndex:30,pointerEvents:'all'}}>
        <div style={{display:'flex',gap:4}}>
          {(['bull','bear','neutral','closed'] as MarketState[]).map(st=>(
            <button key={st} onClick={()=>{setActiveState(st);setForcedScene(null);forcedSceneRef.current=null}} style={{
              padding:'3px 9px',borderRadius:16,fontSize:10,fontWeight:700,
              border:`1px solid ${activeState===st&&!forcedScene?STATE_COLOR[st]:'rgba(255,255,255,.15)'}`,
              background:activeState===st&&!forcedScene?STATE_COLOR[st]+'22':'rgba(10,10,20,.75)',
              color:activeState===st&&!forcedScene?STATE_COLOR[st]:'rgba(255,255,255,.4)',
              cursor:'pointer',backdropFilter:'blur(8px)',transition:'all .15s',
            }}>{STATE_LABEL[st]}</button>
          ))}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:3,maxWidth:420}}>
          {(['walk','party','beach','weights','desk','throw','doomscroll','panicrun','defeat','newspaper','money','perch','sleep','gaming','wakeup','peek','coffee','phone','bubblebath'] as Scene[]).map(sc=>(
            <button key={sc} onClick={()=>{
              forcedSceneRef.current=sc
              setForcedScene(sc)
              setActiveScene(sc)
              anim.current.sceneSnapped=false
              anim.current.sceneStartMs=performance.now()
            }} style={{
              padding:'2px 7px',borderRadius:12,fontSize:9,fontWeight:700,
              border:`1px solid ${forcedScene===sc?'#f97316':'rgba(255,255,255,.12)'}`,
              background:forcedScene===sc?'rgba(249,115,22,.2)':'rgba(10,10,20,.7)',
              color:forcedScene===sc?'#f97316':'rgba(255,255,255,.38)',
              cursor:'pointer',backdropFilter:'blur(8px)',transition:'all .12s',whiteSpace:'nowrap',
            }}>{sc}</button>
          ))}
        </div>
      </div>
    )}
  </>)
}
