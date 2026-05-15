import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Stock Research'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function fetchQuote(ticker: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    )
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) return null
    return {
      price: meta.regularMarketPrice as number,
      prevClose: meta.chartPreviousClose as number,
      companyName: (meta.longName ?? meta.shortName ?? ticker) as string,
      currency: (meta.currency ?? 'USD') as string,
    }
  } catch {
    return null
  }
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function Image({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const quote = await fetchQuote(ticker)

  const price = quote?.price ?? null
  const prevClose = quote?.prevClose ?? null
  const companyName = quote?.companyName ?? ticker
  const change = price && prevClose ? price - prevClose : null
  const changePct = change && prevClose ? (change / prevClose) * 100 : null
  const isUp = (changePct ?? 0) >= 0
  const changeColor = isUp ? '#34d399' : '#f87171'
  const changeSign = isUp ? '+' : ''

  // Truncate company name
  const displayName = companyName.length > 40 ? companyName.slice(0, 38) + '…' : companyName

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#080c14',
          padding: '52px 64px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow behind price */}
        <div style={{
          position: 'absolute', top: '50%', right: '80px',
          transform: 'translateY(-50%)',
          width: '360px', height: '360px', borderRadius: '50%',
          background: `radial-gradient(circle, ${isUp ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)'} 0%, transparent 70%)`,
          display: 'flex',
        }} />
        <div style={{ position: 'absolute', bottom: '-120px', left: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', display: 'flex' }} />

        {/* Subtle grid */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', opacity: 0.03 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} style={{ height: '1px', background: '#fff', display: 'flex' }} />)}
        </div>

        {/* Top: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '44px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16,7 22,7 22,13" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#94a3b8' }}>Zains Game</span>
          </div>
          <div style={{ fontSize: '13px', color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '6px 14px', display: 'flex' }}>
            Stock Research
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>

          {/* Ticker badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '5px 14px', letterSpacing: '1px', display: 'flex' }}>
              {ticker}
            </div>
            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', display: 'flex' }} />
          </div>

          {/* Company name */}
          <div style={{ fontSize: '42px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px', marginBottom: '32px', display: 'flex', lineHeight: 1.1 }}>
            {displayName}
          </div>

          {/* Price block */}
          {price ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
              <div style={{ fontSize: '76px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-3px', lineHeight: 1, display: 'flex' }}>
                ${fmt(price)}
              </div>
              {changePct !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: changeColor, display: 'flex', letterSpacing: '-0.5px' }}>
                    {changeSign}{fmt(Math.abs(change!))}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: changeColor, background: `${changeColor}18`, border: `1px solid ${changeColor}30`, borderRadius: '8px', padding: '3px 10px', display: 'flex' }}>
                    {changeSign}{changePct.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '48px', fontWeight: 700, color: '#334155', display: 'flex' }}>
              —
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '15px', color: '#334155', display: 'flex' }}>zainsgame.vercel.app</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Charts', 'News', 'Financials', 'Options', 'AI Analysis'].map(tag => (
              <div key={tag} style={{ fontSize: '11px', fontWeight: 600, color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '4px 10px', display: 'flex' }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
