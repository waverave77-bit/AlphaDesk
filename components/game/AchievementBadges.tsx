'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Award } from 'lucide-react'

interface Portfolio {
  totalGainLoss: number
  totalGainLossPct: number
  holdings?: any[]
  trades?: any[]
}

interface Props {
  portfolio: Portfolio | null
}

interface Badge {
  id: string
  emoji: string
  label: string
  desc: string
  unlocked: boolean
}

export default function AchievementBadges({ portfolio }: Props) {
  const [spyChange, setSpyChange] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/stock/SPY')
      .then(r => r.json())
      .then(d => {
        if (d?.quote?.changePercent) setSpyChange(d.quote.changePercent)
      })
      .catch(() => {})
  }, [])

  if (!portfolio) return null

  const tradesLen = portfolio.trades?.length ?? 0
  const holdingsLen = portfolio.holdings?.length ?? 0

  const badges: Badge[] = [
    {
      id: 'first-trade',
      emoji: '🎯',
      label: 'First Trade',
      desc: 'Execute your first trade',
      unlocked: tradesLen > 0,
    },
    {
      id: 'in-the-green',
      emoji: '💰',
      label: 'In the Green',
      desc: 'Achieve a positive P&L',
      unlocked: portfolio.totalGainLoss > 0,
    },
    {
      id: 'moon-shot',
      emoji: '🚀',
      label: 'Moon Shot',
      desc: 'Gain more than +10% on your portfolio',
      unlocked: portfolio.totalGainLossPct > 10,
    },
    {
      id: 'diamond-hands',
      emoji: '💎',
      label: 'Diamond Hands',
      desc: 'Hold positions and make 5+ trades',
      unlocked: holdingsLen > 0 && tradesLen >= 5,
    },
    {
      id: 'market-beater',
      emoji: '🏆',
      label: 'Market Beater',
      desc: 'Beat SPY return today',
      unlocked: spyChange !== null && portfolio.totalGainLossPct > spyChange,
    },
    {
      id: 'diversified',
      emoji: '🧠',
      label: 'Diversified',
      desc: 'Hold 5 or more different stocks',
      unlocked: holdingsLen >= 5,
    },
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Award className="h-4 w-4 text-yellow-400" />
          Achievements
          <span className="ml-auto text-xs text-gray-500 font-normal">{unlockedCount}/{badges.length} unlocked</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {badges.map(b => (
            <div
              key={b.id}
              className={cn(
                'rounded-lg border p-3 flex flex-col items-center text-center gap-1 transition-all',
                b.unlocked
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-gray-900 border-gray-800 opacity-50 grayscale'
              )}
            >
              <span className="text-2xl">{b.emoji}</span>
              <p className={cn('text-xs font-semibold', b.unlocked ? 'text-white' : 'text-gray-500')}>{b.label}</p>
              <p className="text-xs text-gray-500 leading-tight">{b.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
