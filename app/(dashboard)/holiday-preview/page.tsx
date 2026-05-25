'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'
import { Shield, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import { HOLIDAY_SCENES } from '@/components/HolidayAtmosphere'

// Dynamically import MarketCharacter (canvas + fixed positioning, SSR off)
const MarketCharacter = dynamic(() => import('@/components/MarketCharacter'), { ssr: false })

export default function HolidayPreviewPage() {
  const { isAdmin, loading } = useAdmin()
  const router = useRouter()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/dashboard')
  }, [isAdmin, loading, router])

  const prev = useCallback(() => setIdx(i => (i - 1 + HOLIDAY_SCENES.length) % HOLIDAY_SCENES.length), [])
  const next = useCallback(() => setIdx(i => (i + 1) % HOLIDAY_SCENES.length), [])

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (loading || !isAdmin) return null

  const holiday = HOLIDAY_SCENES[idx]

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden">

      {/* Admin badge */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/90 border border-red-800 text-red-400 text-xs font-semibold whitespace-nowrap">
        <Shield className="h-3.5 w-3.5 shrink-0" />
        Admin Preview — Not Live
      </div>

      {/* Back link */}
      <div className="fixed top-[72px] left-4 z-50">
        <Link href="/analytics" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
      </div>

      {/* Holiday name + description */}
      <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
        <p className="text-3xl font-bold text-white drop-shadow-lg">
          {holiday.emoji} {holiday.name}
        </p>
        <p className="text-sm text-gray-400 mt-1">{holiday.desc}</p>
        <p className="text-xs text-gray-600 mt-2">← → arrow keys or buttons below to switch</p>
      </div>

      {/* Character — raised 160px so bottom control bar doesn't cover him */}
      <MarketCharacter
        marketState="closed"
        changePercent={0}
        holidayPreview={holiday.name}
        bottomOffset={160}
      />

      {/* Bottom controls */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/90 border-t border-gray-800 backdrop-blur-sm px-4 py-4">

        {/* Prev / Next arrows + progress */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={prev}
            className="p-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs text-gray-500 font-medium tabular-nums w-16 text-center">
            {idx + 1} / {HOLIDAY_SCENES.length}
          </span>
          <button
            onClick={next}
            className="p-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Holiday pill buttons */}
        <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
          {HOLIDAY_SCENES.map((h, i) => (
            <button
              key={h.name}
              onClick={() => setIdx(i)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                i === idx
                  ? 'bg-white text-gray-950 border-white shadow-lg shadow-white/10'
                  : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {h.emoji} {h.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
