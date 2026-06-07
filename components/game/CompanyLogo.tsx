'use client'
import { useState, useEffect } from 'react'
import { COMPANIES } from '@/lib/sim-companies'

/**
 * Real company logo (via Clearbit) with a colored letter-badge fallback when
 * there's no domain or the logo fails to load. Logos sit on white so they read
 * in both light and dark mode.
 */
export default function CompanyLogo({ ticker, size = 40, radius = 12, name }: { ticker: string; size?: number; radius?: number; name?: string }) {
  const c = COMPANIES[ticker]
  const label = (c?.name || name || ticker)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [ticker])

  if (!failed) {
    const src = `/api/logo/${encodeURIComponent(ticker)}${c?.domain ? `?domain=${encodeURIComponent(c.domain)}` : ''}`
    return (
      <div className="bg-white flex items-center justify-center overflow-hidden shrink-0" style={{ width: size, height: size, borderRadius: radius }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} onError={() => setFailed(true)} loading="lazy"
          style={{ width: size * 0.74, height: size * 0.74, objectFit: 'contain' }} />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center text-[#fff] font-black shrink-0" style={{ width: size, height: size, borderRadius: radius, background: c?.color || '#3b82f6', fontSize: size * 0.42 }}>
      {label[0]}
    </div>
  )
}
