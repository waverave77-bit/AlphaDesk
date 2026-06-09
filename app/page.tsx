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
  { code: 'AI',  color: '#ffd23f', title: 'AI Stock Tutor',       desc: 'Ask anything about a stock, get a straight answer — like a smart friend, not a wall of jargon.' },
  { code: '13F', color: '#3ef08f', title: 'Smart Money Tracker',  desc: 'See what hedge funds and insiders are quietly buying, straight from public SEC filings.' },
  { code: '100K',color: '#ff7a59', title: '$100K Challenge',       desc: 'Practice with $100,000 in virtual cash. Real stocks, real prices, zero risk.', badge: 'Free to play' },
  { code: 'AM',  color: '#2f9bff', title: 'Daily Market Brief',    desc: 'What moved markets overnight in ten seconds flat. Just the signal, none of the doom-scroll.' },
  { code: 'ER',  color: '#c084fc', title: 'Earnings Calendar',     desc: 'Never get blindsided by an earnings surprise. Every report date for your watchlist, up front.' },
  { code: 'A-Z', color: '#f472b6', title: 'Investing Dictionary',  desc: 'P/E ratio, short squeeze, market cap — every term explained like you are a person.' },
]

const FAQ = [
  { q: 'Is this financial advice?', a: 'No. Mr. Guy Invests is an educational and research tool. Nothing here is financial advice — always consult a qualified professional before making investment decisions.' },
  { q: 'Where does the Smart Money data come from?', a: 'All of it is sourced from public SEC filings (Form 13F and Form 4) — the same data professionals use, just made readable.' },
  { q: 'Are stock prices real-time?', a: 'Prices may be delayed up to 15 minutes. Always verify with your broker before making a trade.' },
  { q: "What's the difference between Free and Pro?", a: 'Free gives you the core research tools with daily limits. Pro removes every limit and unlocks full Smart Money and AI tools for $4.99/month.' },
  { q: 'Can I cancel Pro anytime?', a: 'Yes — cancel anytime, no fees. You keep Pro access until the end of your billing period.' },
  { q: 'What is the $100K Challenge?', a: 'A free game where you start with $100,000 in fake money and trade real stocks at real prices. A risk-free way to learn and climb the leaderboard.' },
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
              Understand any stock in{' '}
              <span className={`inline-block bg-[#ffd23f] px-2 ${sticker}`}>seconds.</span>
            </h1>
            <p className="font-mono text-[15px] leading-relaxed mt-7 mb-8 max-w-md font-bold">
              See what hedge funds and insiders are actually buying. Get straight answers from AI — no jargon. Then practice with $100K in virtual cash, risk-free.
            </p>
            <div className="flex flex-wrap gap-4">
              <Btn href="/dashboard" size="lg">Try it now →</Btn>
              <Btn href="/register" variant="white" size="lg">Start free</Btn>
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
          <h2 className="font-display uppercase text-3xl sm:text-4xl mb-3">Everything in one place</h2>
          <p className="font-mono text-sm mb-10 max-w-xl">The tools Wall Street pays thousands for — rebuilt so a beginner can actually use them.</p>
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
              {['Stock research (15-min delayed)','Earnings calendar & markets','Watchlist','Finance dictionary','3 Mr. Guy chats/day','2 AI analyses/day','Smart Money preview','$100K Challenge (full access)'].map((f) => (
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
              {['Everything in Free','Unlimited Mr. Guy chat','Unlimited AI analysis','Unlimited all AI tools','Full Smart Money access','Full Hedge Fund tracker'].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm"><span className="h-3 w-3 bg-[#ffd23f] border-[2px] border-[#16130a] shrink-0" />{f}</li>
              ))}
            </ul>
            <Btn href="/register" variant="yellow">Unlock Pro — $4.99</Btn>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20 max-w-2xl mx-auto text-center">
        <h2 className="font-display uppercase text-3xl sm:text-4xl mb-4">Your money deserves more than a gut feeling.</h2>
        <p className="font-mono text-sm mb-8">Join the people who stopped guessing and started understanding what they own.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Btn href="/register" size="lg">Try Mr. Guy free</Btn>
          <Btn href="/dashboard" variant="white" size="lg">Try it now →</Btn>
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
