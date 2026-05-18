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
           | 'rain' | 'newspaper' | 'weights' | 'gaming' | 'doomscroll' | 'panicrun' | 'telescope'

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
const SCENE_CYCLES: Record<MarketState, Array<{ scene: Scene; ms: number }>> = {
  bull:    [
    { scene: 'walk',      ms: 4000  },
    { scene: 'party',     ms: 8000  },
    { scene: 'walk',      ms: 4000  },
    { scene: 'beach',     ms: 9000  },
    { scene: 'walk',      ms: 4000  },
    { scene: 'weights',   ms: 8000  },
    { scene: 'walk',      ms: 4000  },
    { scene: 'telescope', ms: 8000  },
  ],
  bear: [
    { scene: 'rain',       ms: 7000 },
    { scene: 'desk',       ms: 8000 },
    { scene: 'rain',       ms: 7000 },
    { scene: 'throw',      ms: 8000 },
    { scene: 'doomscroll', ms: 7000 },
    { scene: 'panicrun',   ms: 6000 },
  ],
  neutral: [
    { scene: 'walk',      ms: 8000  },
    { scene: 'newspaper', ms: 8000  },
    { scene: 'walk',      ms: 8000  },
    { scene: 'perch',     ms: 9000  },
  ],
  closed:  [
    { scene: 'sleep',  ms: 18000 },
    { scene: 'gaming', ms: 15000 },
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

      const isLL = r >= 24 && c >= 3 && c <= 6
      const isRL = r >= 24 && c >= 10 && c <= 13
      const isLS = r >= 29 && c >= 0 && c <= 6
      const isRS = r >= 29 && c >= 10 && c <= 15
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
  for (let r = 0; r <= 9; r++) {
    for (let c = 3; c <= 14; c++) {
      const color = GRID[r][c]
      if (!color) continue
      const px = headOx + (c-3)*PX, py = headOy + r*PX + bob
      if (px<0||py<0||px+PX>W||py+PX>H) continue
      ctx.fillStyle = color; ctx.fillRect(px,py,PX,PX)
    }
  }
  const capBaseY=headOy+bob-5, headW=12*PX
  const capTipX=headOx+headW*0.45+22, capTipY=capBaseY-50
  ctx.fillStyle='#1e40af'; ctx.beginPath()
  ctx.moveTo(headOx-6,capBaseY); ctx.lineTo(headOx+headW+6,capBaseY); ctx.lineTo(capTipX,capTipY); ctx.closePath(); ctx.fill()
  ctx.fillStyle='rgba(255,255,255,.15)'; ctx.beginPath()
  ctx.moveTo(headOx+headW*.3,capBaseY); ctx.lineTo(capTipX,capTipY)
  ctx.lineTo(capTipX+4,capTipY); ctx.lineTo(headOx+headW*.3+8,capBaseY); ctx.closePath(); ctx.fill()
  ctx.fillStyle='#e2e8f0'; ctx.fillRect(headOx-10,capBaseY-5,headW+20,9)
  ctx.fillStyle='rgba(150,150,170,.3)'; ctx.fillRect(headOx-10,capBaseY-5,headW+20,3)
  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(capTipX,capTipY,7,0,Math.PI*2); ctx.fill()
  ctx.fillStyle='rgba(180,200,220,.5)'; ctx.beginPath(); ctx.arc(capTipX-2,capTipY-2,3,0,Math.PI*2); ctx.fill()
}

function drawBeachChair(ctx: CanvasRenderingContext2D, cx: number, W: number, viewH: number) {
  const base=viewH-20, backX=W-18, seatY=base-55
  const seatW=Math.min(130,backX-cx+CHAR_W+10), seatX=backX-seatW
  ctx.fillStyle='#C8A96B'; ctx.fillRect(backX-14,seatY-90,14,100)
  for(let i=0;i<5;i++){ctx.fillStyle='#A0785A';ctx.fillRect(backX-12,seatY-84+i*17,10,3)}
  ctx.fillStyle='#D4B06A'; ctx.fillRect(seatX,seatY,seatW,13)
  for(let i=0;i<4;i++){ctx.fillStyle='#C19A6B';ctx.fillRect(seatX+i*(seatW/4)+3,seatY+2,seatW/4-5,9)}
  ctx.fillStyle='#8B5E3C'; ctx.fillRect(seatX+4,seatY-26,9,36); ctx.fillRect(backX-13,seatY-26,9,36)
  ctx.fillStyle='#6B4226'
  ctx.fillRect(seatX+6,seatY+13,6,base-seatY-13); ctx.fillRect(backX-12,seatY+13,6,base-seatY-13)
  ctx.fillRect(seatX+6,seatY+40,backX-seatX-18,5)
  const umX=backX-4
  ctx.fillStyle='#5C3A1E'; ctx.fillRect(umX,seatY-115,5,120)
  const cols=['#E74C3C','#F39C12','#2ECC71','#3498DB','#9B59B6','#E74C3C']
  for(let i=0;i<6;i++){
    ctx.fillStyle=cols[i]; ctx.beginPath(); ctx.moveTo(umX+2,seatY-115)
    ctx.arc(umX+2,seatY-115,48,Math.PI+(Math.PI/6)*i,Math.PI+(Math.PI/6)*(i+1)); ctx.fill()
  }
  ctx.strokeStyle='#333'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.arc(umX+2,seatY-115,48,Math.PI,2*Math.PI); ctx.stroke()
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
  const ny = charY+55+wave
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

/* ═══ CSS Particle Systems ══════════════════════════════════════════ */

const CONFETTI_DATA = Array.from({length:32},(_,i)=>({
  pct:(i*3.125)%100, delay:(i*0.22)%3.2, dur:2.3+(i*0.2)%2,
  color:['#FF6B6B','#4ECDC4','#45B7D1','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#82E0AA','#FF9FF3','#54A0FF'][i%10],
  size:6+(i*1.7)%8, rect:i%3!==0,
}))
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
function SweatDrops({charX}:{charX:number}){
  return(<>
    <style>{`@keyframes sw{0%{opacity:.9;transform:translateY(0)}100%{opacity:0;transform:translateY(36px) scaleY(.6)}}`}</style>
    {[0,1,2].map(i=>(
      <div key={i} style={{position:'fixed',left:charX+80+i*11,bottom:`calc(25% + ${i*9}px)`,
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

/* ── Perch bubble ──────────────────────────────────────────────────── */
function PerchBubble({charX,charY,viewH}:{charX:number;charY:number;viewH:number}){
  const bottom=viewH-charY-CHAR_H-30
  return(<>
    <style>{`@keyframes pbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    <div style={{position:'fixed',left:charX+30,bottom:bottom,
      background:'rgba(255,255,255,.94)',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,
      padding:'5px 10px',fontSize:13,fontWeight:700,color:'#333',whiteSpace:'nowrap',
      animation:'pbob 1.5s ease-in-out infinite',pointerEvents:'none',zIndex:15,
      boxShadow:'0 2px 12px rgba(0,0,0,.12)'}}>
      👀 what's this?
      <div style={{position:'absolute',bottom:-8,left:16,width:0,height:0,
        borderLeft:'7px solid transparent',borderRight:'7px solid transparent',
        borderTop:'8px solid rgba(255,255,255,.94)'}}/>
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

    // ── Scene management ─────────────────────────────────────────
    if(s.prevState !== ms){
      s.sceneIdx=0; s.sceneStartMs=now; s.prevState=ms; s.sceneSnapped=false; s.atPerchTarget=false
      s.charX=zone.ok?(zone.min+zone.max)/2:(ms==='bear'?60:W-160)
      s.targetY=groundY; s.charY=groundY; s.faceFlush=0
    }
    const cycle=SCENE_CYCLES[ms]
    const cfg=cycle[s.sceneIdx]
    if(cfg.ms<9999999 && now-s.sceneStartMs>cfg.ms){
      s.sceneIdx=(s.sceneIdx+1)%cycle.length; s.sceneStartMs=now; s.sceneSnapped=false; s.atPerchTarget=false
    }
    const scene=cycle[s.sceneIdx].scene
    if(scene!==s.currentScene){ s.currentScene=scene; setActiveScene(scene) }

    // ── Y lerp ───────────────────────────────────────────────────
    if(scene!=='perch'&&scene!=='sleep'&&scene!=='gaming') s.targetY=groundY
    if(Math.abs(s.charY-s.targetY)>0.5) s.charY+=(s.targetY-s.charY)*0.055
    else s.charY=s.targetY

    let pose:Pose={...WALK_FRAMES[s.frameIdx]}

    // ── SLEEP ────────────────────────────────────────────────────
    if(scene==='sleep'){
      s.charX=W/2; s.faceFlush=0
      const bob=Math.sin(now*0.0008)*2   // smooth float, no rounding
      drawBed(ctx, W/2, H)
      const headOx=Math.round(W/2-108), headOy=Math.round(H-102)
      drawSleepingHead(ctx, headOx, headOy, bob, W, H)
      ctx.fillStyle='#1e3a8a'
      ctx.fillRect(Math.round(W/2-117),Math.round(H-73),248,53)
      ctx.fillStyle='#2563eb'
      ctx.fillRect(Math.round(W/2-117),Math.round(H-73),248,14)
      ctx.fillStyle='rgba(255,255,255,.09)'
      for(let i=0;i<5;i++) ctx.fillRect(Math.round(W/2-108)+i*30,Math.round(H-69),18,38)
    }

    // ── GAMING ───────────────────────────────────────────────────
    else if(scene==='gaming'){
      if(!s.sceneSnapped){
        s.charX=zone.ok?(zone.min+zone.max)/2:W/2
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

    // ── WALK ─────────────────────────────────────────────────────
    else if(scene==='walk'){
      let walkSpeed=0.8, frameRate=14, extraBounce=0, shakeX=0
      if(ms==='bull'){
        walkSpeed=2.4; frameRate=8
        extraBounce=Math.sin(now*.005)*-3   // smooth, no rounding
      } else if(ms==='bear'){
        walkSpeed=3.8; frameRate=5
        s.faceFlush=Math.min(1,s.faceFlush+.003)
        // Sin-based shake instead of random — smooth periodic jitter
        shakeX=Math.round(Math.sin(now*0.09)*1.5)
      } else {
        pose.bodyDY+=1
        if(!s.paused){if(++s.pauseTimer>280){s.paused=true;s.scratchTimer=50;s.pauseTimer=0}}
        else{if(--s.scratchTimer<=0)s.paused=false}
      }
      if(ms!=='bear') s.faceFlush=Math.max(0,s.faceFlush-.005)
      if(!s.paused){
        if(zone.ok){
          s.charX+=walkSpeed*s.direction
          if(s.charX>zone.max){s.charX=zone.max;s.direction=-1}
          if(s.charX<zone.min){s.charX=zone.min;s.direction=1}
        }else{
          s.charX+=walkSpeed*s.direction
          if(s.charX>W-CHAR_W-10){s.charX=W-CHAR_W-10;s.direction=-1}
          if(s.charX<10){s.charX=10;s.direction=1}
        }
        s.tick++; if(s.tick>=frameRate){s.tick=0;s.frameIdx=(s.frameIdx+1)%8}
      }
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,Math.round(extraBounce),shakeX,W,H)
    }

    // ── RAIN WALK ────────────────────────────────────────────────
    else if(scene==='rain'){
      const walkSpeed=2.4, frameRate=7
      s.faceFlush=Math.min(.6,s.faceFlush+.0015)
      if(zone.ok){
        s.charX+=walkSpeed*s.direction
        if(s.charX>zone.max){s.charX=zone.max;s.direction=-1}
        if(s.charX<zone.min){s.charX=zone.min;s.direction=1}
      }else{
        s.charX+=walkSpeed*s.direction
        if(s.charX>W-CHAR_W-10){s.charX=W-CHAR_W-10;s.direction=-1}
        if(s.charX<10){s.charX=10;s.direction=1}
      }
      // Arm raised to hold umbrella — smooth with small sine wobble
      pose.rightArmDY=Math.round(-4+Math.sin(now*.002)*0.5)
      s.tick++; if(s.tick>=frameRate){s.tick=0;s.frameIdx=(s.frameIdx+1)%8}
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,0,W,H)
      drawUmbrella(ctx, Math.round(s.charX), Math.round(s.charY), s.direction)
    }

    // ── PARTY ────────────────────────────────────────────────────
    else if(scene==='party'){
      if(!s.sceneSnapped){
        s.charX=zone.ok?(zone.min+zone.max)/2:W-160; s.direction=-1; s.sceneSnapped=true
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
        s.charX=zone.ok?Math.max(zone.min,W-CHAR_W-70):W-CHAR_W-70
        s.direction=-1; s.sceneSnapped=true
      }
      s.faceFlush=Math.max(0,s.faceFlush-.01)
      drawBeachChair(ctx, Math.round(s.charX), W, H)
      const chairSeatY=H-62, seatedY=chairSeatY-15*PX
      // Smooth breathe — no integer rounding so no 1px flicker
      const breathe=Math.sin(now*.0008)
      pose.bodyDY=0  // keep static, use breathe offset below
      pose.leftArmDY=3; pose.rightArmDY=2; pose.leftLegDX=-2; pose.rightLegDX=2
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(seatedY+breathe),s.direction,0,0,0,W,H,21)
    }

    // ── WEIGHTS ──────────────────────────────────────────────────
    else if(scene==='weights'){
      if(!s.sceneSnapped){
        s.charX=zone.ok?(zone.min+zone.max)/2:W-160; s.direction=-1; s.sceneSnapped=true
      }
      const liftCycle=(Math.sin(now*.0028)+1)/2   // 0→1→0, smooth press
      pose.leftArmDY =liftCycle*-9
      pose.rightArmDY=liftCycle*-9
      pose.bodyDY=Math.round(liftCycle*-1)
      s.faceFlush=Math.min(.35,s.faceFlush+.001)
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,0,W,H)
      drawDumbbell(ctx, Math.round(s.charX), Math.round(s.charY), liftCycle)
    }

    // ── NEWSPAPER ────────────────────────────────────────────────
    else if(scene==='newspaper'){
      if(!s.sceneSnapped){
        s.charX=zone.ok?(zone.min+zone.max)/2:W-160; s.direction=-1; s.sceneSnapped=true
      }
      s.faceFlush=Math.max(0,s.faceFlush-.01)
      const wave=Math.sin(now*.0009)*1.8   // gentle paper sway, no rounding
      pose.bodyDY=1; pose.leftArmDY=2; pose.rightArmDY=2
      pose.leftLegDX=-1; pose.rightLegDX=1
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H,26)
      drawNewspaper(ctx, Math.round(s.charX), Math.round(s.charY), s.direction, wave)
    }

    // ── DESK ─────────────────────────────────────────────────────
    else if(scene==='desk'){
      if(!s.sceneSnapped){
        const deskW=135; s.charX=Math.max(zone.ok?zone.min:10, deskW-CHAR_W+20)
        s.direction=1; s.sceneSnapped=true
      }
      s.faceFlush=Math.min(1,s.faceFlush+.004)
      // Smooth arm cycle — sin curve replaces binary snap
      const bangT=now*.007
      const armPos=Math.sin(bangT)*-3.5         // -3.5 to +3.5, smooth
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
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,0,W,H,26)
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
      if(!s.sceneSnapped){s.charX=zone.ok?zone.max-10:60;s.direction=1;s.sceneSnapped=true}
      const throwT=now*.005; const windup=Math.sin(throwT)>0
      pose.rightArmDY=windup?-5:2; pose.leftArmDY=windup?1:-1; pose.bodyDY=windup?-1:0
      s.faceFlush=Math.min(1,s.faceFlush+.003)
      // Smooth sin shake instead of random
      const shakeX=Math.round(Math.sin(now*0.07)*(windup?1.5:0.5))
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,s.faceFlush,0,shakeX,W,H)
    }

    // ── TELESCOPE ────────────────────────────────────────────────
    else if(scene==='telescope'){
      if(!s.sceneSnapped){
        // Face INWARD toward content — left side for right zone, right side for left zone
        s.charX=zone.ok?zone.min+10:W-160
        s.direction=-1   // always face toward the content
        s.sceneSnapped=true
        s.faceFlush=0
      }
      pose.bodyDY=-1; pose.leftArmDY=2
      pose.rightArmDY=Math.round(Math.sin(now*.0012)*1)-2   // tiny scope adjustment
      renderCharacter(ctx,pose,Math.round(s.charX),Math.round(s.charY),s.direction,0,0,0,W,H)
      drawTelescope(ctx, Math.round(s.charX), Math.round(s.charY), s.direction)
    }

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
      rain:       ['I hate this job','it\'s always raining','umbrella gang ☔'],
      newspaper:  ['Interesting...','hm, not great','who writes this stuff'],
      weights:    ['LETS GOOO 💪','gains only','PUSH PUSH PUSH','no pain no gain'],
      telescope:  ['I see it now...','moon soon 🔭','DD complete'],
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
        style={{display:'block',width:'100%',height:'100vh'}}/>
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
        <style>{`@keyframes bubblePop{0%{opacity:0;transform:scale(.5) translateY(8px)}15%{opacity:1;transform:scale(1.1) translateY(-2px)}25%{transform:scale(1) translateY(0)}85%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}`}</style>
        <div style={{position:'fixed',left:charXDisp+(dirDisp===1?CHAR_W+6:-120),
          top:charYDisp-10,zIndex:20,pointerEvents:'none',
          background:'#fff',border:'2px solid #222',borderRadius:12,
          padding:'6px 12px',fontSize:13,fontWeight:800,color:'#111',whiteSpace:'nowrap',
          boxShadow:'3px 3px 0 #222',
          animation:'bubblePop 2.2s ease forwards'}}>
          {clickBubble}
          <div style={{position:'absolute',bottom:-10,
            [dirDisp===1?'left':'right']:12,
            width:0,height:0,
            borderLeft:'8px solid transparent',borderRight:'8px solid transparent',
            borderTop:'10px solid #222'}}/>
          <div style={{position:'absolute',bottom:-7,
            [dirDisp===1?'left':'right']:13,
            width:0,height:0,
            borderLeft:'7px solid transparent',borderRight:'7px solid transparent',
            borderTop:'9px solid #fff'}}/>
        </div>
      </>
    )}

    {activeScene==='party'&&<>
      <ConfettiRain zoneX={zones.R.ok?zones.R.min:canvasW-260} zoneW={zones.R.ok?zones.R.max-zones.R.min:250}/>
      <MusicNotes charX={charXDisp}/>
      <DiscoBall x={zones.R.ok?zones.R.min-10:canvasW-260}/>
    </>}
    {activeScene==='beach'&&<BeachAtmosphere canvasW={canvasW}/>}
    {activeScene==='desk'&&<><AngerMarks charX={charXDisp}/><FlyingPapers charX={charXDisp}/><BangText charX={charXDisp} show={banging}/></>}
    {activeScene==='throw'&&<FlyingObjects charX={charXDisp}/>}
    {activeScene==='sleep'&&<ZzzParticles charX={Math.round(canvasW/2-130)} charY={viewH-248} viewH={viewH}/>}
    {activeState==='closed'&&<NightSky/>}
    {activeScene==='perch'&&showPerchBubble&&<PerchBubble charX={charXDisp} charY={charYDisp} viewH={viewH}/>}
    {activeScene==='rain'&&<RainEffect zoneX={zones.L.ok?zones.L.min:0} zoneW={zones.L.ok?zones.L.max-zones.L.min:200}/>}
    {activeScene==='weights'&&<WeightSparkles charX={charXDisp} charY={charYDisp} viewH={viewH}/>}
    {activeScene==='doomscroll'&&<SweatDrops charX={charXDisp}/>}
    {activeScene==='panicrun'&&<><DustCloud charX={charXDisp} dir={dirDisp}/><PanicExclaim charX={charXDisp}/></>}
    {activeScene==='telescope'&&<TelescopeSparkles charX={charXDisp} dir={dirDisp}/>}

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

    {activeState==='closed'&&(
      <div style={{position:'fixed',inset:0,background:'rgba(5,5,20,0.45)',pointerEvents:'none',zIndex:9}}/>
    )}

    <div style={{position:'fixed',bottom:24,right:16,display:'flex',gap:6,zIndex:30,pointerEvents:'all'}}>
      {(['bull','bear','neutral','closed'] as MarketState[]).map(st=>(
        <button key={st} onClick={()=>setActiveState(st)} style={{
          padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,
          border:`1px solid ${activeState===st?STATE_COLOR[st]:'rgba(255,255,255,.15)'}`,
          background:activeState===st?STATE_COLOR[st]+'22':'rgba(10,10,20,.75)',
          color:activeState===st?STATE_COLOR[st]:'rgba(255,255,255,.4)',
          cursor:'pointer',backdropFilter:'blur(8px)',transition:'all .2s',
        }}>{STATE_LABEL[st]}</button>
      ))}
    </div>
  </>)
}
