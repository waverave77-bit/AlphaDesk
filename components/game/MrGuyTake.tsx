'use client'
import MrGuyMascot, { Mood } from '@/components/learn/MrGuyMascot'
import { formatCurrency } from '@/lib/utils'

/**
 * Mr. Guy's coaching take on the Portfolio tab — reacts to how you're doing
 * and headlines the one number that matters (your profit/loss).
 * Light-mode safe: adapting bg, gain colors with dark: variants.
 */
export default function MrGuyTake({ gainLoss, gainLossPct }: { gainLoss: number; gainLossPct: number }) {
  const up = gainLoss >= 0
  const big = gainLossPct >= 2
  const mood: Mood = big ? 'celebrate' : up ? 'happy' : 'sad'
  const line = gainLossPct === 0
    ? 'Fresh start. Buy a company you actually believe in.'
    : big ? "You're crushing it. Don't get cocky — let it ride."
    : up ? "Nicely done, you're in the green. Slow and steady wins."
    : "Down a little? Totally normal. Investing is a long game — zoom out."
  const numColor = up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'

  return (
    <div className="bg-gray-900 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border border-gray-800 rounded-3xl p-5 flex items-center gap-4">
      <div className="shrink-0 -mb-2 self-end"><MrGuyMascot px={3} mood={mood} /></div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Mr. Guy’s take</p>
        <p className={`text-3xl font-black ${numColor} leading-tight`}>
          {up ? '+' : ''}{formatCurrency(gainLoss)}
          <span className="text-lg ml-1">({gainLossPct >= 0 ? '+' : ''}{gainLossPct.toFixed(2)}%)</span>
        </p>
        <p className="text-sm text-gray-400 mt-0.5">{line}</p>
      </div>
    </div>
  )
}
