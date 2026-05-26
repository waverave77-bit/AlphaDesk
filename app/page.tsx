import Link from 'next/link'
import { Brain, Zap, BookOpen, Users, ChevronRight, Check, TrendingUp, Trophy } from 'lucide-react'

// ── Mr. Guy pixel head — SVG version (works in server components) ─────────────
const N = null
const HEAD_PIXELS: Array<Array<string | null>> = [
  [N,N,'#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',N],
  [N,'#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [N,'#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N],
  [N,'#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,N],
  [N,N,'#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',N,N],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'],
]

function MrGuyLogoSvg({ px = 3 }: { px?: number }) {
  return (
    <svg
      width={12 * px}
      height={14 * px}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
      shapeRendering="crispEdges"
    >
      {HEAD_PIXELS.flatMap((row, r) =>
        row.map((color, c) =>
          color ? <rect key={`${r}-${c}`} x={c * px} y={r * px} width={px + 0.5} height={px + 0.5} fill={color} /> : null
        )
      )}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const displayCount = null // will show live count when merged to production

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <MrGuyLogoSvg px={3} />
          <span className="text-xl font-bold">Mr. Guy Invests</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
          <Zap className="h-3.5 w-3.5" />
          No finance degree required — just curiosity
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Understand any stock{' '}
          <span className="text-blue-400">in seconds.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          See what hedge funds and insiders are really buying. Get straight answers
          from AI — no jargon, no noise. Finally know what your money is actually doing.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
          <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            Start for Free <ChevronRight className="h-5 w-5" />
          </Link>
          <Link href="/dashboard" className="border border-gray-700 hover:border-blue-500/50 hover:bg-blue-600/5 text-gray-300 hover:text-blue-300 px-8 py-3.5 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2">
            Try It Now →
          </Link>
        </div>

        <p className="text-sm text-gray-600">Free forever · No credit card needed</p>

        {/* Social proof */}
        {displayCount && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <div className="flex -space-x-1.5">
              {['#3b82f6','#10b981','#f59e0b','#ef4444'].map((c, i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-gray-950 flex items-center justify-center text-[9px] font-bold" style={{ background: c }}>
                  {['A','J','M','S'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              <span className="text-white font-semibold">{displayCount} investors</span> already using Mr. Guy
            </p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Stop guessing. Start knowing.</h2>
        <p className="text-gray-400 text-center mb-12">The same tools Wall Street uses — explained in plain English so you can actually act on them.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Brain className="h-6 w-6 text-blue-400" />,
              title: 'AI Stock Tutor',
              desc: 'Ask anything about a stock and get a straight answer — not a wall of financial jargon. Like having a knowledgeable friend you can actually ask "so should I be worried?"',
              disclaimer: true,
              badge: null,
            },
            {
              icon: <Users className="h-6 w-6 text-emerald-400" />,
              title: 'Smart Money Tracker',
              desc: 'Know what hedge funds and insiders are quietly buying before it hits the news. All sourced from public SEC filings (Form 13F & Form 4) — the same data professionals pay thousands for.',
              disclaimer: true,
              badge: null,
            },
            {
              icon: <Trophy className="h-6 w-6 text-yellow-400" />,
              title: '$100K Challenge',
              desc: 'Practice investing with $100,000 in virtual cash — real stocks, real prices, zero risk. Build confidence before you put a single real dollar on the line.',
              disclaimer: false,
              badge: 'Free to play',
            },
            {
              icon: <Zap className="h-6 w-6 text-orange-400" />,
              title: 'Daily Market Brief',
              desc: 'Know what moved markets overnight in 10 seconds flat. No doom-scrolling through financial news sites — just the signal, not the noise.',
              disclaimer: false,
              badge: null,
            },
            {
              icon: <TrendingUp className="h-6 w-6 text-pink-400" />,
              title: 'Earnings Calendar',
              desc: 'Never be caught off guard by an earnings surprise again. Every upcoming report date for your watchlist, front and center.',
              disclaimer: false,
              badge: null,
            },
            {
              icon: <BookOpen className="h-6 w-6 text-violet-400" />,
              title: 'Investing Dictionary',
              desc: 'Finally understand what people mean when they say P/E ratio, short squeeze, or market cap — every term explained like you\'re a person, not a Bloomberg terminal.',
              disclaimer: false,
              badge: null,
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-4">
                {f.icon}
                {f.badge && (
                  <span className="text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                    {f.badge}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">{f.desc}</p>
              {f.disclaimer && (
                <p className="text-gray-600 text-xs mt-3 leading-relaxed">
                  For informational and educational purposes only. Not financial advice. Always consult a qualified professional before investing.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* $100K Challenge banner */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="text-6xl shrink-0">🏆</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">Featured</p>
            <h3 className="text-2xl font-bold text-white mb-2">The $100K Challenge</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
              Think you can beat the market? Prove it. Start with $100,000 in virtual cash, trade real stocks at real prices, and climb the leaderboard. Build your instincts before a single real dollar is on the line.
            </p>
          </div>
          <Link href="/register" className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
            Join the Challenge
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Good questions</h2>
        <p className="text-gray-400 text-center mb-10">Honest answers before you sign up for anything.</p>

        <div className="space-y-3">
          {[
            {
              q: 'Is this financial advice?',
              a: 'No. Mr. Guy Invests is an educational and research tool. Nothing here should be taken as financial advice. Always consult a qualified professional before making investment decisions.',
            },
            {
              q: 'Where does the Smart Money / hedge fund data come from?',
              a: 'All data is sourced from public SEC filings (Form 13F and Form 4). This is the same data professionals use, just made easier to read.',
            },
            {
              q: 'Are stock prices real-time?',
              a: 'Stock prices may be delayed up to 15 minutes. Always verify with your broker before making a trade.',
            },
            {
              q: "What's the difference between Free and Pro?",
              a: 'Free gives you access to core research tools with daily usage limits. Pro removes every limit and unlocks full Smart Money and AI tools for $4.99/month — less than a coffee a week.',
            },
            {
              q: 'Can I cancel Pro anytime?',
              a: 'Yes. Cancel anytime with no fees or penalties. You keep Pro access until the end of your billing period.',
            },
            {
              q: 'What is the $100K Challenge?',
              a: 'A free virtual trading game where you start with $100,000 in fake money and buy/sell real stocks at real prices. It\'s a risk-free way to learn investing and compete with other users on the leaderboard.',
            },
          ].map(({ q, a }) => (
            <details
              key={q}
              className="bg-gray-900 border border-gray-800 rounded-2xl group"
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none select-none">
                <span className="font-semibold text-white text-sm sm:text-base">{q}</span>
                <svg
                  className="h-4 w-4 text-gray-500 shrink-0 ml-3 transition-transform group-open:rotate-180"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-5">
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Start free. Upgrade if you love it.</h2>
        <p className="text-gray-400 text-center mb-12">No credit card, no commitment — get real value from day one.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Free</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500 mb-1">/month</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">No credit card needed</p>
            <ul className="space-y-3 mb-8">
              {[
                'Stock research (prices may be 15 min delayed)',
                'Earnings calendar & markets',
                'Watchlist',
                'Finance dictionary',
                '3 Mr. Guy chats/day',
                '2 AI stock analyses/day',
                'Smart Money preview',
                '$100K Challenge (full access)',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-gray-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full py-3 rounded-xl border border-gray-700 text-center text-sm font-semibold text-gray-400 hover:border-gray-500 hover:text-white transition-colors">
              Start for Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gray-900 border-2 border-blue-500 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg tracking-wide">
              MOST POPULAR
            </div>
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2 mt-2">Pro</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold">$4.99</span>
              <span className="text-gray-400 mb-1">/month</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Cancel anytime</p>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Free',
                'Unlimited Mr. Guy chat',
                'Unlimited AI stock analysis',
                'Unlimited all AI tools',
                'Full Smart Money access',
                'Full Hedge Fund tracker',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <Check className="h-4 w-4 text-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-center text-sm font-bold text-white transition-colors shadow-lg shadow-blue-600/20">
              Unlock Pro — $4.99/month
            </Link>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Your money deserves more than a gut feeling.</h2>
        <p className="text-gray-400 mb-8">Join investors who stopped guessing and started actually understanding what they own.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            Try Mr. Guy Invests Free <ChevronRight className="h-5 w-5" />
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            See How It Works →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MrGuyLogoSvg px={2} />
            <span className="font-semibold">Mr. Guy Invests</span>
          </div>
          <p className="text-xs text-gray-600">For informational and educational purposes only. Not financial advice. Always consult a qualified professional before investing.</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
