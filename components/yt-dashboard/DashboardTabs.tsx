'use client'

import { useState } from 'react'
import YTDashboard from './YTDashboard'
import RUDashboard from '../ru-dashboard/RUDashboard'

const TABS = [
  { key: 'powerscale', label: '⚔ PowerScale' },
  { key: 'reddit-untold', label: '📖 Reddit Untold' },
] as const
type TabKey = (typeof TABS)[number]['key']

export default function DashboardTabs() {
  const [tab, setTab] = useState<TabKey>('powerscale')

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 flex justify-center border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="flex gap-1 px-4 py-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === t.key ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'powerscale' ? <YTDashboard /> : <RUDashboard />}
    </div>
  )
}
