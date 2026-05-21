/**
 * ████████████████████████████████████████████████████████████
 *  UPGRADE / PRICING PAGE  —  NOT PUBLISHED YET
 *
 *  TO PUBLISH (checklist):
 *  [ ] npm install stripe
 *  [ ] Add env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID
 *  [ ] npx prisma migrate dev --name add-pro-fields
 *  [ ] Register webhook in Stripe dashboard → /api/stripe/webhook
 *  [ ] Uncomment Stripe blocks in /api/stripe/checkout and /api/stripe/webhook
 *  [ ] Add "Upgrade" link to TopNav (settings dropdown or nav item)
 *  [ ] Add upgrade CTA to dashboard page for free users
 *  [ ] Add isPro gate to AI API routes (/api/chat, /api/report-card, etc.)
 * ████████████████████████████████████████████████████████████
 */

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Check, Zap, Brain, BarChart2, MessageSquare, Shield, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const FREE_FEATURES = [
  'Stock research & live prices',
  'Earnings calendar',
  'Watchlist (up to 10 stocks)',
  'Markets overview',
  'Finance dictionary',
  'Insider & hedge fund tracker',
  '10 AI requests per day',
]

const PRO_FEATURES = [
  { icon: Brain,          text: 'Unlimited AI requests — Mr. Guy chat, Report Card, Bull vs Bear, everything' },
  { icon: MessageSquare,  text: 'Priority AI responses — faster, more detailed analysis' },
  { icon: BarChart2,      text: 'Portfolio Roast — unlimited portfolio roasts' },
  { icon: Zap,            text: 'Reality Check & Finance Translator — unlimited' },
  { icon: Star,           text: 'Hot Takes & Am I Dumb — unlimited' },
  { icon: Shield,         text: 'Unlimited watchlist stocks' },
]

export default function UpgradePage() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold">Mr. Guy Invests</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
            <Zap className="h-3.5 w-3.5" />
            Simple pricing
          </div>
          <h1 className="text-5xl font-bold mb-4">Upgrade to Pro</h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto">
            All the AI features, unlimited. One flat price.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-500 mb-1">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">No credit card needed</p>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-gray-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="w-full py-3 rounded-xl border border-gray-700 text-center text-sm font-semibold text-gray-500">
              Current Plan
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-blue-500 bg-gray-900 p-8 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg tracking-wide">
              MOST POPULAR
            </div>

            <div className="mb-6 mt-3">
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">$6.99</span>
                <span className="text-gray-400 mb-1">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Cancel anytime</p>
            </div>

            <p className="text-sm font-semibold text-gray-300 mb-3">Everything in Free, plus:</p>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <Icon className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={cn(
                'w-full py-3.5 rounded-xl font-bold text-base transition-all',
                loading
                  ? 'bg-blue-600/50 cursor-not-allowed text-white/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30'
              )}
            >
              {loading ? 'Redirecting…' : 'Get Pro — $6.99/month'}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'What counts as an AI request?',
                a: 'Any time you generate an AI response — Mr. Guy chat message, Stock Report Card, Bull vs Bear, Reality Check, Finance Translator, Am I Dumb, Hot Take, or Portfolio Roast. Free users get 10 per day. Pro users get unlimited.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel from your account settings and your Pro access stays until the end of the billing period.',
              },
              {
                q: 'Is my payment secure?',
                a: 'Payments are handled entirely by Stripe. We never see or store your card details.',
              },
              {
                q: 'What happens to my data if I cancel?',
                a: 'Nothing changes. Your watchlist, portfolio, and history stay intact. You just drop back to the free tier.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-800 pb-6">
                <p className="font-semibold text-white mb-2">{q}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center mt-16 px-4">
          For informational purposes only. Not financial advice.{' '}
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
        </p>
      </main>
    </div>
  )
}
