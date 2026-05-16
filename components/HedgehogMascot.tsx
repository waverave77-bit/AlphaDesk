'use client'
import { useState, useEffect, useRef } from 'react'

export default function HedgehogMascot() {
  const [phase, setPhase] = useState<'hidden' | 'peeking'>('hidden')
  const [blink, setBlink] = useState(false)
  const [lookDir, setLookDir] = useState<'center' | 'left' | 'right'>('center')
  const scheduledRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const doPeek = () => {
      setPhase('peeking')
      setLookDir('center')

      // Blink sequence
      setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 160) }, 1200)
      setTimeout(() => { setLookDir('left') }, 2000)
      setTimeout(() => { setLookDir('right') }, 3000)
      setTimeout(() => { setLookDir('center') }, 3800)
      setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 160) }, 4200)

      // Hide after 5.5s then schedule next
      setTimeout(() => {
        setPhase('hidden')
        scheduledRef.current = setTimeout(doPeek, 18000 + Math.random() * 20000)
      }, 5500)
    }

    // First peek after 7s
    scheduledRef.current = setTimeout(doPeek, 7000)
    return () => { if (scheduledRef.current) clearTimeout(scheduledRef.current) }
  }, [])

  return (
    <div
      className="fixed bottom-0 left-1/2 z-30 pointer-events-none select-none"
      style={{
        transform: `translateX(-50%) translateY(${phase === 'peeking' ? '38%' : '100%'})`,
        transition: 'transform 0.85s cubic-bezier(0.34, 1.56, 0.64, 1)',
        width: 148,
        height: 170,
      }}
    >
      <HedgehogSVG blink={blink} lookDir={lookDir} />
    </div>
  )
}

function HedgehogSVG({ blink, lookDir }: { blink: boolean; lookDir: 'center' | 'left' | 'right' }) {
  const shineOffset = lookDir === 'left' ? -2 : lookDir === 'right' ? 2 : 0

  return (
    <svg viewBox="0 0 148 170" width={148} height={170} xmlns="http://www.w3.org/2000/svg">
      {/* Spikes */}
      <polygon points="28,98 40,18 52,98" fill="#2D1209" />
      <polygon points="46,98 59,5 72,98"  fill="#3D1F0A" />
      <polygon points="64,98 77,12 90,98" fill="#2D1209" />
      <polygon points="82,98 93,28 104,98" fill="#3D1F0A" />
      <polygon points="97,98 106,44 115,98" fill="#2D1209" />

      {/* Body (hangs below screen when peeking) */}
      <ellipse cx="74" cy="148" rx="52" ry="36" fill="#7B4F2E" />
      {/* Belly */}
      <ellipse cx="74" cy="155" rx="31" ry="24" fill="#EDD5A3" />

      {/* Head */}
      <circle cx="74" cy="95" r="40" fill="#8B5E3C" />

      {/* Left ear */}
      <ellipse cx="44" cy="63" rx="10" ry="14" fill="#8B5E3C" />
      <ellipse cx="44" cy="64" rx="6" ry="9"   fill="#C4856A" />
      {/* Right ear */}
      <ellipse cx="104" cy="63" rx="10" ry="14" fill="#8B5E3C" />
      <ellipse cx="104" cy="64" rx="6"  ry="9"  fill="#C4856A" />

      {/* Snout */}
      <ellipse cx="74" cy="105" rx="18" ry="13" fill="#A0724E" />
      {/* Nose */}
      <ellipse cx="74" cy="98" rx="6" ry="5" fill="#1A0800" />
      <ellipse cx="75.5" cy="97" rx="2" ry="1.5" fill="#5A3010" />

      {/* Left eye */}
      <circle cx="56" cy="87" r="7" fill="#1A0800" />
      <circle cx={56 + 2 + shineOffset} cy="85" r="2.5" fill="white" />
      {blink && <ellipse cx="56" cy="87" rx="7" ry="3.5" fill="#8B5E3C" />}

      {/* Right eye */}
      <circle cx="92" cy="87" r="7" fill="#1A0800" />
      <circle cx={92 + 2 + shineOffset} cy="85" r="2.5" fill="white" />
      {blink && <ellipse cx="92" cy="87" rx="7" ry="3.5" fill="#8B5E3C" />}

      {/* Blush */}
      <ellipse cx="46" cy="98" rx="9" ry="6" fill="#E88080" opacity="0.38" />
      <ellipse cx="102" cy="98" rx="9" ry="6" fill="#E88080" opacity="0.38" />

      {/* Left paw gripping screen edge */}
      <ellipse cx="38" cy="124" rx="15" ry="9" fill="#7B4F2E" />
      <line x1="30" y1="120" x2="28" y2="116" stroke="#5A3520" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="38" y1="118" x2="38" y2="114" stroke="#5A3520" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="46" y1="120" x2="48" y2="116" stroke="#5A3520" strokeWidth="1.8" strokeLinecap="round"/>

      {/* Right paw gripping screen edge */}
      <ellipse cx="110" cy="124" rx="15" ry="9" fill="#7B4F2E" />
      <line x1="102" y1="120" x2="100" y2="116" stroke="#5A3520" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="110" y1="118" x2="110" y2="114" stroke="#5A3520" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="118" y1="120" x2="120" y2="116" stroke="#5A3520" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
