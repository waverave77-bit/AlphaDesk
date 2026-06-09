import Link from 'next/link'

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
    <svg width={12 * px} height={14 * px} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }} shapeRendering="crispEdges">
      {HEAD_PIXELS.flatMap((row, r) =>
        row.map((color, c) =>
          color ? <rect key={`${r}-${c}`} x={c * px} y={r * px} width={px + 0.5} height={px + 0.5} fill={color} /> : null
        )
      )}
    </svg>
  )
}

// ── Brand primitives (blue-arcade: thick ink border + hard "sticker" shadow) ──
const sticker = 'border-[3px] border-[#16130a] shadow-[5px_5px_0_#16130a]'
const stickerHover = 'transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#16130a]'

function Btn({ href, children, variant = 'blue', size = 'md' }: { href: string; children: React.ReactNode; variant?: 'blue' | 'white' | 'yellow'; size?: 'md' | 'lg' }) {
  const v = { blue: 'bg-[#2563eb] text-[#fff]', white: 'bg-[#fff] text-[#16130a]', yellow: 'bg-[#ffd23f] text-[#16130a]' }[variant]
  const s = size === 'lg' ? 'px-7 py-3.5 text-base' : 'px-5 py-2.5 text-sm'
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-tight ${v} ${s} ${sticker} ${stickerHover}`}>
      {children}
    </Link>
  )
}

// Colored code-tile that stands in for an icon (no lucide, no emoji)
function Tile({ code, color }: { code: string; color: string }) {
  return (
    <span className="grid place-items-center h-12 w-12 border-[3px] border-[#16130a] font-mono font-bold text-sm text-[#16130a] shrink-0" style={{ background: color }}>
      {code}
    </span>
  )
}

const FEATURES = [
  { code: 'XP',  color: '#ffd23f', title: 'Learn the Basics',     desc: 'Bite-sized lessons that take you from clueless to confident. Earn XP, keep your streak, level up.', badge: 'Start here' },
  { code: '100K',color: '#3ef08f', title: '$100K Challenge',      desc: 'Practice with $100,000 in virtual cash. Real stocks, real prices, zero real risk.', badge: 'Free to play' },
  { code: 'AI',  color: '#ff7a59', title: 'Ask Mr. Guy',          desc: 'Ask anything about any stock and get a straight, plain-English answer — never a wall of jargon.' },
  { code: 'A-Z', color: '#2f9bff', title: 'Investing Dictionary', desc: 'P/E ratio, market cap, short squeeze — every confusing term explained like you are a person.' },
  { code: 'P/E', color: '#c084fc', title: 'Research a Stock',     desc: 'When you are ready to go deeper: the real numbers, news, and charts for any company.' },
  { code: 'S&P', color: '#f472b6', title: 'Markets & Earnings',   desc: 'See what is moving today and which companies report next — without the endless doom-scroll.' },
]

const FAQ = [
  { q: 'Do I need to know anything about investing?', a: 'Nope — that is the whole point. You start at zero with short beginner lessons and a $100K practice account. No experience required.' },
  { q: 'Will I lose real money?', a: 'Never. The $100K Challenge uses 100% virtual cash, so you can practice and make mistakes with zero real risk.' },
  { q: 'Is this financial advice?', a: 'No. Mr. Guy Invests is an educational tool. Nothing here is financial advice — always do your own research and consult a qualified professional.' },
  { q: 'Is it actually free?', a: 'Yes. The lessons, the dictionary, and the full $100K Challenge are free. Pro just lifts the daily limits on the AI tools for $4.99/month.' },
  { q: 'Are stock prices real-time?', a: 'Prices may be delayed up to 15 minutes. Always verify with your broker before making a real trade.' },
  { q: 'Can I cancel Pro anytime?', a: 'Yes — cancel anytime, no fees. You keep Pro access until the end of your billing period.' },
]

const DISCLAIMER = 'For informational and educational purposes only. Not financial advice. Always consult a qualified professional before investing.'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fdf3d7] text-[#16130a]">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <span className={`bg-[#fff] p-1 ${sticker}`}><MrGuyLogoSvg px={2} /></span>
          <span className="font-mono font-bold text-base uppercase tracking-tight">Mr. Guy Invests</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="font-mono font-bold text-sm uppercase hover:opacity-70">Sign in</Link>
          <Btn href="/register">Start →</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-12 pb-16 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
          <div>
            <h1 className="font-display uppercase leading-[0.98] text-5xl sm:text-6xl">
              Learn investing like a{' '}
              <span className={`inline-block bg-[#ffd23f] px-2 ${sticker}`}>game.</span>
            </h1>
            <p className="font-mono text-[15px] leading-relaxed mt-7 mb-8 max-w-md font-bold">
              Bite-sized lessons, a $100K practice account, and Mr. Guy to explain anything in plain English. No finance degree. No jargon. No real risk.
            </p>
            <div className="flex flex-wrap gap-4">
              <Btn href="/register" size="lg">Start free</Btn>
              <Btn href="/dashboard" variant="white" size="lg">Look around first</Btn>
            </div>
            <p className="font-mono text-xs mt-5 opacity-70">No account needed to look around.</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="bg-[#fff] border-[4px] border-[#16130a] shadow-[10px_10px_0_#16130a] p-7">
              <MrGuyLogoSvg px={11} />
              <p className="font-mono font-bold text-center text-sm uppercase mt-4">Mr. Guy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#2563eb] text-[#fff] border-y-[3px] border-[#16130a]">
        <div className="px-6 py-16 max-w-6xl mx-auto">
          <h2 className="font-display uppercase text-3xl sm:text-4xl mb-3">Everything a beginner needs</h2>
          <p className="font-mono text-sm mb-10 max-w-xl">Six ways to go from “I have no idea” to “I’ve got this” — all in one place.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className={`bg-[#fff] text-[#16130a] p-5 ${sticker} ${stickerHover}`}>
                <div className="flex items-start justify-between mb-4">
                  <Tile code={f.code} color={f.color} />
                  {f.badge && <span className="font-mono font-bold text-[10px] uppercase bg-[#ffd23f] border-[2px] border-[#16130a] px-2 py-0.5">{f.badge}</span>}
                </div>
                <h3 className="font-display uppercase text-lg mb-1.5">{f.title}</h3>
                <p className="font-mono text-[12.5px] leading-relaxed font-bold">{f.desc}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-[11px] mt-8 opacity-80 max-w-2xl">{DISCLAIMER}</p>
        </div>
      </section>

      {/* $100K Challenge banner */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className={`bg-[#ffd23f] p-8 flex flex-col md:flex-row items-center gap-7 text-center md:text-left ${sticker}`}>
          <span className={`bg-[#fff] p-3 shrink-0 ${sticker}`}><MrGuyLogoSvg px={5} /></span>
          <div className="flex-1">
            <p className="font-mono font-bold text-xs uppercase tracking-widest mb-1">Free to play</p>
            <h3 className="font-display uppercase text-2xl sm:text-3xl mb-2">The $100K Challenge</h3>
            <p className="font-mono text-[13px] font-bold leading-relaxed max-w-xl">
              Think you can beat the market? Start with $100,000 in virtual cash, trade real stocks at real prices, and climb the leaderboard — before a single real dollar is on the line.
            </p>
          </div>
          <Btn href="/register" size="lg">Join the challenge</Btn>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <h2 className="font-display uppercase text-3xl sm:text-4xl text-center mb-3">Good questions</h2>
        <p className="font-mono text-sm text-center mb-10">Honest answers before you sign up for anything.</p>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <details key={q} className={`bg-[#fff] group ${sticker}`}>
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                <span className="font-mono font-bold text-sm sm:text-base">{q}</span>
                <svg className="h-4 w-4 shrink-0 ml-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 -mt-1">
                <p className="text-sm leading-relaxed">{a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <h2 className="font-display uppercase text-3xl sm:text-4xl text-center mb-3">Start free. Upgrade if you love it.</h2>
        <p className="font-mono text-sm text-center mb-10">No credit card, no commitment — real value from day one.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className={`bg-[#fff] p-7 ${sticker}`}>
            <p className="font-mono font-bold text-sm uppercase tracking-wider mb-2">Free</p>
            <div className="flex items-end gap-1 mb-1"><span className="font-display text-4xl">$0</span><span className="font-mono text-sm mb-1 opacity-60">/month</span></div>
            <p className="font-mono text-xs opacity-60 mb-6">No credit card needed</p>
            <ul className="space-y-2.5 mb-7">
              {['All lessons & the learning path','$100K Challenge (full access)','Investing dictionary','Markets, earnings & watchlist','3 Mr. Guy chats/day','2 AI stock breakdowns/day'].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm"><span className="h-3 w-3 bg-[#2563eb] border-[2px] border-[#16130a] shrink-0" />{f}</li>
              ))}
            </ul>
            <Btn href="/register" variant="white">Start for free</Btn>
          </div>
          {/* Pro */}
          <div className={`bg-[#2563eb] text-[#fff] p-7 relative ${sticker}`}>
            <span className="absolute -top-3 right-5 font-mono font-bold text-[10px] uppercase bg-[#ffd23f] text-[#16130a] border-[3px] border-[#16130a] px-2 py-0.5">Most popular</span>
            <p className="font-mono font-bold text-sm uppercase tracking-wider mb-2">Pro</p>
            <div className="flex items-end gap-1 mb-1"><span className="font-display text-4xl">$4.99</span><span className="font-mono text-sm mb-1 opacity-80">/month</span></div>
            <p className="font-mono text-xs opacity-80 mb-6">Cancel anytime</p>
            <ul className="space-y-2.5 mb-7">
              {['Everything in Free','Unlimited Mr. Guy chat','Unlimited AI stock breakdowns','Unlimited all AI tools','No daily limits, ever'].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm"><span className="h-3 w-3 bg-[#ffd23f] border-[2px] border-[#16130a] shrink-0" />{f}</li>
              ))}
            </ul>
            <Btn href="/register" variant="yellow">Unlock Pro — $4.99</Btn>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20 max-w-2xl mx-auto text-center">
        <h2 className="font-display uppercase text-3xl sm:text-4xl mb-4">Go from confused to confident.</h2>
        <p className="font-mono text-sm mb-8">Join the beginners learning investing the fun way — one small lesson at a time.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Btn href="/register" size="lg">Start free</Btn>
          <Btn href="/dashboard" variant="white" size="lg">Look around first</Btn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[3px] border-[#16130a] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <MrGuyLogoSvg px={2} />
            <span className="font-mono font-bold text-sm uppercase">Mr. Guy Invests</span>
          </div>
          <p className="font-mono text-[11px] opacity-70 max-w-md text-center">{DISCLAIMER}</p>
          <div className="flex gap-4 font-mono text-xs uppercase">
            <Link href="/privacy" className="hover:opacity-70">Privacy</Link>
            <Link href="/terms" className="hover:opacity-70">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
