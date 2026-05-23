import Link from 'next/link'
import { Brain, Zap, BookOpen, Users, ChevronRight, Check, FlaskConical, TrendingUp, Trophy, Play } from 'lucide-react'
import { prisma } from '@/lib/prisma'

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

// ── Dashboard preview mockup ───────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-4xl px-6 pb-4">
      {/* Glow */}
      <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Browser chrome */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-700/60 shadow-2xl shadow-black/60 bg-gray-900">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-950 border-b border-gray-800">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 mx-3 bg-gray-800 rounded-md text-gray-500 text-xs px-3 py-1 text-center">
            mrguyinvests.com/dashboard
          </div>
        </div>

        {/* Nav bar */}
        <div className="flex items-center gap-6 px-5 py-2.5 bg-gray-950 border-b border-gray-800/50 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MrGuyLogoSvg px={2} />
            <span className="font-bold text-white text-sm">Mr. Guy</span>
          </div>
          {['Dashboard','Research','Markets','Watchlist','Learn'].map(t => (
            <span key={t} className={t === 'Dashboard' ? 'text-blue-400 font-medium' : ''}>{t}</span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">⚡ Upgrade</div>
          </div>
        </div>

        {/* Ticker bar */}
        <div className="flex gap-5 px-5 py-1.5 bg-gray-900 border-b border-gray-800/50 text-[10px] text-gray-400 overflow-hidden">
          {[
            { l: 'S&P 500', v: '7,473', c: '+0.54%', up: true },
            { l: 'NASDAQ', v: '26,344', c: '+0.28%', up: true },
            { l: 'VIX', v: '16.70', c: '-0.36%', up: false },
            { l: 'Fear & Greed', v: '59 · Greed', c: '', up: true },
            { l: 'BTC', v: '$75.4k', c: '-0.07%', up: false },
          ].map(item => (
            <span key={item.l} className="whitespace-nowrap flex gap-1.5">
              <span className="text-gray-600">{item.l}</span>
              <span className="text-white font-medium">{item.v}</span>
              {item.c && <span className={item.up ? 'text-green-400' : 'text-red-400'}>{item.c}</span>}
            </span>
          ))}
        </div>

        {/* Main content */}
        <div className="p-5 bg-white">
          <p className="text-xl font-bold text-gray-900 mb-0.5">Good morning, Alex ☀️</p>
          <p className="text-xs text-gray-400 mb-4">Saturday, May 23</p>

          {/* Market recap */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MrGuyLogoSvg px={2} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MR. GUY MARKET RECAP</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              Stocks closed the week at record highs, buoyed by optimism around Fed leadership. The big thing to watch Monday is how treasury yields hold up — Goldman flagged rising bond yields as a real vulnerability for stocks...
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Watchlist */}
            <div className="border border-gray-200 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">My Watchlist</p>
              {[
                { t: 'AAPL', p: '$308.82', c: '+1.26%', up: true },
                { t: 'NVDA', p: '$142.50', c: '+2.41%', up: true },
                { t: 'TSLA', p: '$248.10', c: '-0.83%', up: false },
              ].map(s => (
                <div key={s.t} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs font-bold text-gray-800">{s.t}</span>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-800">{s.p}</p>
                    <p className={`text-[10px] font-medium ${s.up ? 'text-green-600' : 'text-red-500'}`}>{s.c}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Market indices */}
            <div className="border border-gray-200 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Market Indices</p>
              {[
                { t: 'S&P 500', p: '7,473.47', c: '+0.54%', up: true },
                { t: 'NASDAQ', p: '26,343.97', c: '+0.28%', up: true },
                { t: 'DOW', p: '50,579.70', c: '+1.14%', up: true },
              ].map(s => (
                <div key={s.t} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs font-bold text-gray-800">{s.t}</span>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-800">{s.p}</p>
                    <p className={`text-[10px] font-medium ${s.up ? 'text-green-600' : 'text-red-500'}`}>{s.c}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  // Live user count from DB
  const userCount = await prisma.user.count().catch(() => 0)
  // Round down to nearest 50 for social proof (e.g. 183 → "150+")
  const displayCount = userCount >= 50 ? `${Math.floor(userCount / 50) * 50}+` : null

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
          Built for young investors who want to understand their money
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Investing made{' '}
          <span className="text-blue-400">simple.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          No jargon. No confusion. See what hedge funds and insiders are buying,
          get AI analysis in plain English, and actually understand your stocks.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
          <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            Start for Free <ChevronRight className="h-5 w-5" />
          </Link>
          <Link href="/dashboard" className="border border-gray-700 hover:border-blue-500/50 hover:bg-blue-600/5 text-gray-300 hover:text-blue-300 px-8 py-3.5 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2">
            <Play className="h-4 w-4" /> Preview Demo
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

      {/* Dashboard screenshot mockup */}
      <section className="pb-20">
        <DashboardPreview />
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to invest smarter</h2>
        <p className="text-gray-400 text-center mb-12">All the tools that pros use, explained so anyone can understand.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Brain className="h-6 w-6 text-blue-400" />,
              title: 'AI Stock Tutor',
              desc: 'Ask anything about a stock. Get a straight answer in plain English, no finance degree needed.',
              disclaimer: true,
              badge: null,
            },
            {
              icon: <Users className="h-6 w-6 text-emerald-400" />,
              title: 'Smart Money Tracker',
              desc: 'See what hedge funds and corporate insiders have recently reported buying and selling, sourced from public SEC filings (Form 13F & Form 4).',
              disclaimer: true,
              badge: null,
            },
            {
              icon: <Trophy className="h-6 w-6 text-yellow-400" />,
              title: '$100K Challenge',
              desc: 'Start with $100,000 in virtual cash. Build a portfolio, compete on the leaderboard, and see how you stack up against other investors — no real money at risk.',
              disclaimer: false,
              badge: 'Free to play',
            },
            {
              icon: <Zap className="h-6 w-6 text-orange-400" />,
              title: 'Daily Market Brief',
              desc: 'Wake up to a quick summary of what moved markets overnight. Takes 10 seconds to read.',
              disclaimer: false,
              badge: null,
            },
            {
              icon: <TrendingUp className="h-6 w-6 text-pink-400" />,
              title: 'Earnings Calendar',
              desc: 'Never miss an earnings report. See upcoming dates for every stock on your watchlist.',
              disclaimer: false,
              badge: null,
            },
            {
              icon: <BookOpen className="h-6 w-6 text-violet-400" />,
              title: 'Investing Dictionary',
              desc: 'Every finance term explained simply. P/E ratio, short interest, market cap — all covered.',
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
                  For informational purposes only. Not financial advice. Always do your own research before making investment decisions.
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
              Think you can beat the market? Start with $100,000 in virtual cash, build a portfolio with real stock prices, and climb the leaderboard. Learn by doing — with zero risk to your real money.
            </p>
          </div>
          <Link href="/register" className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
            Join the Challenge
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Frequently asked questions</h2>
        <p className="text-gray-400 text-center mb-10">Everything you need to know before getting started.</p>

        <div className="space-y-3">
          {[
            {
              q: 'Is this financial advice?',
              a: 'No. Mr. Guy Invests is a research and educational tool. Nothing on this site should be taken as financial advice. Always consult a professional before making investment decisions.',
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
              a: 'Free gives you access to core research tools with daily limits. Pro removes all limits and gives full access to Smart Money and AI tools for $4.99/month.',
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
        <h2 className="text-3xl font-bold text-center mb-3">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-12">Start free. Upgrade when you want more.</p>

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
              Get Started Free
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
              Get Pro — $4.99/month
            </Link>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Ready to actually understand your investments?</h2>
        <p className="text-gray-400 mb-8">Join young investors learning about markets with real data and AI-powered tools.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            Create Free Account <ChevronRight className="h-5 w-5" />
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            <Play className="h-4 w-4" /> Preview Demo
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
          <p className="text-xs text-gray-600">For informational purposes only. Not financial advice.</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
