import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mr. Guy Invests: Stock Research and Portfolio Tracker'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#080c14',
          padding: '60px 70px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow circles */}
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '-150px', left: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', display: 'flex' }} />

        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', opacity: 0.04 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '1px', background: '#fff', display: 'flex' }} />
          ))}
        </div>

        {/* Logo / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '12px',
            background: 'rgba(59,130,246,0.2)',
            border: '1px solid rgba(59,130,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,7 22,7 22,13" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.3px' }}>
            Mr. Guy Invests
          </span>
        </div>

        {/* Main heading */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: '68px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap' }}>
            Research stocks.
          </div>
          <div style={{ fontSize: '68px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '32px', display: 'flex' }}>
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              Track your portfolio.
            </span>
          </div>
          <div style={{ fontSize: '24px', color: '#64748b', fontWeight: 400, display: 'flex' }}>
            AI-powered research · Earnings calendar · Live prices · Options data
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '16px', color: '#475569', display: 'flex' }}>mrguyinvests.com</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Stocks', 'Easy Learning', 'Pro Analysis', 'Portfolio', 'AI'].map(tag => (
              <div key={tag} style={{ fontSize: '12px', fontWeight: 600, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '4px 12px', display: 'flex' }}>
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
