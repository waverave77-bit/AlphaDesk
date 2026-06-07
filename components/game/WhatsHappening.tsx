'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Newspaper, GraduationCap, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react'

const MrGuyMascot = dynamic(() => import('@/components/learn/MrGuyMascot'), { ssr: false })

interface Mover { ticker: string; name: string; changePercent: number }
interface Article { title: string; link: string; source: string }

/** Mr. Guy's plain-English read on the market mood — teaches the mindset, not a tip. */
function moodTake(score: number): { label: string; line: string } {
  if (score <= 25) return { label: 'Extreme Fear', line: 'People are scared today. Stocks often go on sale when everyone’s fearful — but nobody can perfectly time the bottom. Long-term investors stay calm.' }
  if (score <= 45) return { label: 'Fear', line: 'The mood’s a little nervous. That’s normal — markets wobble all the time. Panic-selling is how beginners lose; zoom out.' }
  if (score < 55) return { label: 'Neutral', line: 'Pretty calm out there today. No drama — a fine time to learn the ropes.' }
  if (score < 75) return { label: 'Greed', line: 'People are feeling optimistic — things have been climbing. Just don’t chase hype; buy companies, not feelings.' }
  return { label: 'Extreme Greed', line: 'Everyone’s excited right now. When it feels too good, that’s often when people overpay. Stay level-headed.' }
}
const cleanName = (n: string) => n.replace(/,? (Inc|Corp|Corporation|Company|Co|Ltd|Holdings|Group|plc)\.?$/i, '').trim()

export default function WhatsHappening({ onBuy }: { onBuy: (ticker: string, name: string) => void }) {
  const [mood, setMood] = useState<{ score: number; label: string; line: string } | null>(null)
  const [movers, setMovers] = useState<Mover[]>([])
  const [news, setNews] = useState<Article[]>([])

  useEffect(() => {
    fetch('/api/fear-greed').then((r) => r.json()).then((d) => { if (typeof d.score === 'number') { const t = moodTake(d.score); setMood({ score: Math.round(d.score), ...t }) } }).catch(() => {})
    fetch('/api/movers').then((r) => r.json()).then((d) => {
      const g = (d.gainers || []).slice(0, 2); const l = (d.losers || []).slice(0, 2)
      setMovers([...g, ...l].filter((m: Mover) => m.ticker && Math.abs(m.changePercent) > 0))
    }).catch(() => {})
    fetch('/api/news/market').then((r) => r.json()).then((d) => setNews((d.articles || []).slice(0, 3))).catch(() => {})
  }, [])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
      <h2 className="text-lg font-black text-white mb-4">What’s happening today</h2>

      {/* Market mood */}
      {mood && (
        <div className="flex items-start gap-3 mb-5">
          <div className="shrink-0 -mb-2"><MrGuyMascot px={2} mood={mood.score < 45 ? 'think' : 'idle'} /></div>
          <div className="bg-blue-500/10 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 relative flex-1">
            <p className="text-sm font-bold text-white">Market mood: <span className={mood.score < 45 ? 'text-red-600 dark:text-red-400' : mood.score >= 55 ? 'text-green-600 dark:text-green-400' : 'text-gray-300'}>{mood.label} ({mood.score}/100)</span></p>
            <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{mood.line}</p>
            <div className="absolute -left-1.5 bottom-3 w-3 h-3 bg-blue-500/10 rotate-45" />
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Biggest moves */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Biggest moves today</p>
          {movers.length === 0 ? <p className="text-xs text-gray-600">Loading…</p> : (
            <div className="space-y-1.5">
              {movers.map((m) => {
                const up = m.changePercent >= 0
                return (
                  <button key={m.ticker} onClick={() => onBuy(m.ticker, cleanName(m.name))}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-left">
                    <span className="font-bold text-white text-sm truncate flex-1">{cleanName(m.name) || m.ticker}</span>
                    <span className={`text-sm font-black flex items-center gap-0.5 shrink-0 ${up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{up ? '+' : ''}{m.changePercent.toFixed(1)}%
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-[11px] text-gray-600 mt-2">Stocks swing every day — usually on news or earnings. That’s normal.</p>
        </div>

        {/* Headlines */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5"><Newspaper className="h-3.5 w-3.5" /> In the news</p>
          {news.length === 0 ? <p className="text-xs text-gray-600">Loading…</p> : (
            <div className="space-y-2">
              {news.map((a, i) => (
                <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="group block">
                  <p className="text-sm text-gray-300 group-hover:text-white leading-snug line-clamp-2">{a.title}</p>
                  <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">{a.source} <ExternalLink className="h-3 w-3" /></p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learn bridge */}
      <Link href="/learn" className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 bg-blue-500/10 rounded-2xl py-2.5">
        <GraduationCap className="h-4 w-4" /> New to this? Learn how to think about buying
      </Link>
    </div>
  )
}
