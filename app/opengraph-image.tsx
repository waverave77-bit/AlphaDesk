import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mr. Guy Invests — learn investing the fun way'
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
// Mr. Guy pixel head, rendered as absolutely-positioned divs (Satori-friendly)
function Head({ px }: { px: number }) {
  return (
    <div style={{ position: 'relative', width: `${12 * px}px`, height: `${14 * px}px`, display: 'flex' }}>
      {HEAD.flatMap((row, r) =>
        row.map((color, c) =>
          color ? (
            <div key={`${r}-${c}`} style={{ position: 'absolute', left: `${c * px}px`, top: `${r * px}px`, width: `${px}px`, height: `${px}px`, background: color, display: 'flex' }} />
          ) : null
        )
      )}
    </div>
  )
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#fdf3d7',
          padding: '52px 60px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Logo / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', background: '#fff', border: '3px solid #16130a', padding: '6px', boxShadow: '4px 4px 0 #16130a' }}>
            <Head px={3} />
          </div>
          <span style={{ display: 'flex', fontSize: '24px', fontWeight: 800, color: '#16130a', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
            Mr. Guy Invests
          </span>
        </div>

        {/* Middle — headline + mascot */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '40px' }}>
            <div style={{ display: 'flex', fontSize: '62px', fontWeight: 800, color: '#16130a', lineHeight: 1, letterSpacing: '-2px', textTransform: 'uppercase' }}>
              Learn investing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ display: 'flex', fontSize: '62px', fontWeight: 800, color: '#16130a', letterSpacing: '-2px', textTransform: 'uppercase', marginRight: '16px' }}>
                like a
              </span>
              <span style={{ display: 'flex', fontSize: '62px', fontWeight: 800, color: '#16130a', letterSpacing: '-2px', textTransform: 'uppercase', background: '#ffd23f', border: '3px solid #16130a', padding: '0 16px', boxShadow: '5px 5px 0 #16130a' }}>
                game.
              </span>
            </div>
            <div style={{ display: 'flex', fontSize: '23px', color: '#6b6448', fontWeight: 600, marginTop: '30px' }}>
              Bite-sized lessons · $100K practice account · plain-English AI
            </div>
          </div>
          <div style={{ display: 'flex', background: '#fff', border: '4px solid #16130a', padding: '22px', boxShadow: '10px 10px 0 #16130a' }}>
            <Head px={14} />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px', paddingTop: '22px', borderTop: '3px solid #16130a' }}>
          <span style={{ display: 'flex', fontSize: '18px', color: '#16130a', fontWeight: 700 }}>mrguyinvests.com</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Beginners', 'Lessons', '$100K Challenge', 'Ask Mr. Guy', 'Dictionary'].map(tag => (
              <div key={tag} style={{ display: 'flex', fontSize: '14px', fontWeight: 700, color: '#16130a', background: '#fff', border: '2px solid #16130a', padding: '4px 12px' }}>
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
