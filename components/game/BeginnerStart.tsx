'use client'
import { useState, useEffect } from 'react'
import MrGuyMascot from '@/components/learn/MrGuyMascot'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Check, Sparkles, ShieldCheck } from 'lucide-react'

/** Familiar, beginner-recognisable companies for a frictionless first trade. */
const FAMILIAR = [
  { ticker: 'AAPL',  name: 'Apple',     color: '#64748b' },
  { ticker: 'MSFT',  name: 'Microsoft', color: '#0ea5e9' },
  { ticker: 'NVDA',  name: 'Nvidia',    color: '#22c55e' },
  { ticker: 'TSLA',  name: 'Tesla',     color: '#ef4444' },
  { ticker: 'AMZN',  name: 'Amazon',    color: '#f59e0b' },
  { ticker: 'GOOGL', name: 'Google',    color: '#3b82f6' },
  { ticker: 'DIS',   name: 'Disney',    color: '#6366f1' },
  { ticker: 'NFLX',  name: 'Netflix',   color: '#dc2626' },
]
const STARTER_AMOUNT = 5000
// One-tap diversified mix: the whole market (SPY) + a few familiar names.
const STARTER_MIX: [string, number][] = [['SPY', 20000], ['AAPL', 10000], ['MSFT', 10000], ['DIS', 10000]]

async function priceOf(ticker: string): Promise<number | null> {
  try {
    const d = await fetch(`/api/stock/${ticker}`).then((r) => r.json())
    return d?.quote?.price ?? null
  } catch { return null }
}
async function buy(ticker: string, dollars: number, price: number) {
  const shares = +(dollars / price).toFixed(4)
  return fetch('/api/virtual/trade', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, shares, type: 'BUY' }),
  })
}

export default function BeginnerStart({ cash, onTraded }: { cash: number; onTraded: () => void | Promise<void> }) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    FAMILIAR.forEach(({ ticker }) => { priceOf(ticker).then((p) => { if (p) setPrices((s) => ({ ...s, [ticker]: p })) }) })
  }, [])

  const buyOne = async (ticker: string) => {
    if (busy) return
    const price = prices[ticker]
    if (!price) return
    setBusy(ticker)
    try { await buy(ticker, Math.min(STARTER_AMOUNT, cash), price); await onTraded() }
    finally { setBusy(null) }
  }

  const buildStarter = async () => {
    if (busy) return
    setBusy('starter')
    try {
      for (const [ticker, amt] of STARTER_MIX) {
        const price = prices[ticker] ?? (await priceOf(ticker))
        if (price) await buy(ticker, amt, price)
      }
      await onTraded()
    } finally { setBusy(null) }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8">
      {/* Intro */}
      <div className="flex items-end gap-2 mb-6">
        <div className="shrink-0 -mb-2"><MrGuyMascot px={3} mood="idle" /></div>
        <div className="bg-blue-500/10 border border-white/5 rounded-3xl rounded-bl-md px-4 py-3 relative">
          <p className="text-white font-bold text-base">You’ve got {formatCurrency(cash)} of fake money.</p>
          <p className="text-gray-300 text-sm mt-0.5">No real risk. Let’s buy your first stock — just tap a company you recognise.</p>
          <div className="absolute -left-1.5 bottom-3 w-3 h-3 bg-blue-500/10 rotate-45" />
        </div>
      </div>

      {/* Familiar companies */}
      <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Tap to buy {formatCurrency(STARTER_AMOUNT)} worth</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FAMILIAR.map((c) => {
          const price = prices[c.ticker]
          const isBusy = busy === c.ticker
          return (
            <button
              key={c.ticker}
              onClick={() => buyOne(c.ticker)}
              disabled={!price || !!busy}
              className="group text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 rounded-2xl p-3 transition-all disabled:opacity-60 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: c.color }}>{c.name[0]}</div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{c.name}</p>
                  <p className="text-[11px] text-gray-500">{c.ticker}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-sm font-semibold text-gray-300">{price ? formatCurrency(price) : '…'}</span>
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buy'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Starter portfolio */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      <button
        onClick={buildStarter}
        disabled={!!busy}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 disabled:opacity-60 text-white rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.99]"
        style={{ boxShadow: '0 4px 0 #1d4ed8' }}
      >
        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          {busy === 'starter' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div className="text-left flex-1">
          <p className="font-black text-base">Build me a starter portfolio</p>
          <p className="text-blue-100/90 text-sm">A mix of the whole market + a few big names — instant diversification.</p>
        </div>
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mt-4">
        <ShieldCheck className="h-3.5 w-3.5" /> 100% fake money. You can’t lose anything real.
      </p>
    </div>
  )
}
