'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, Search, ArrowLeft } from 'lucide-react'

const _N = null
const _PIXELS: Array<Array<string | null>> = [
  [_N,_N,'#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',_N],
  [_N,'#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [_N,'#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',_N],
  [_N,'#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',_N,_N],
  [_N,_N,'#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',_N,_N],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'],
]
function MrGuyLogoSvg({ px = 3 }: { px?: number }) {
  return (
    <svg width={12 * px} height={14 * px} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}>
      {_PIXELS.flatMap((row, r) =>
        row.map((color, c) =>
          color ? <rect key={`${r}-${c}`} x={c * px} y={r * px} width={px} height={px} fill={color} /> : null
        )
      )}
    </svg>
  )
}

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Mini nav */}
      <nav className="flex items-center px-6 py-4 max-w-6xl mx-auto w-full">
        <Link href="/dashboard" className="flex items-center gap-2">
          <MrGuyLogoSvg px={3} />
          <span className="text-base font-bold">Mr. Guy Invests</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Large 404 */}
        <div className="mb-8 select-none">
          <p className="text-[6rem] sm:text-[8rem] font-black leading-none tracking-tighter text-gray-800">
            404
          </p>
          <div className="flex justify-center mt-2">
            <MrGuyLogoSvg px={6} />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Mr. Guy can&apos;t find that page
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-md leading-relaxed">
          Looks like this page doesn&apos;t exist — or it moved. Even I get lost sometimes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <Link
            href="/research"
            className="flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Search className="h-4 w-4" />
            Research a Stock
          </Link>
        </div>

        <button
          onClick={() => router.back()}
          className="mt-6 flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back
        </button>
      </div>

      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-gray-700">For informational purposes only. Not financial advice.</p>
      </footer>
    </div>
  )
}
