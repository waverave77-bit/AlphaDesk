import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mr. Guy Invests: AI-powered stock research for everyday investors'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Mr. Guy pixel head — rendered as divs for ImageResponse
const N = null
const HEAD: Array<Array<string | null>> = [
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
const PX = 5 // pixel size — 12×5=60px wide, 14×5=70px tall

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          {/* Mr. Guy pixel head */}
          <div style={{ position: 'relative', width: `${12 * PX}px`, height: `${14 * PX}px`, display: 'flex' }}>
            {HEAD.flatMap((row, r) =>
              row.map((color, c) =>
                color ? (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: `${c * PX}px`,
                      top: `${r * PX}px`,
                      width: `${PX}px`,
                      height: `${PX}px`,
                      background: color,
                      display: 'flex',
                    }}
                  />
                ) : null
              )
            )}
          </div>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.3px' }}>
            Mr. Guy Invests
          </span>
        </div>

        {/* Main heading */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: '68px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '20px', display: 'flex' }}>
            Research stocks.
          </div>
          <div style={{ fontSize: '68px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '32px', display: 'flex' }}>
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              Invest smarter.
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
            {['Stocks', 'Easy Learning', 'Pro Analysis', 'Smart Money', 'AI'].map(tag => (
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
