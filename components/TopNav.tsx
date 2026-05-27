'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Settings, Menu, X, LogOut, ChevronDown, Sun, Moon, Shield, Zap, UserCircle, LogIn } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
import { useAdmin } from '@/hooks/useAdmin'

const primaryNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/research',  label: 'Research' },
  { href: '/learn',     label: 'Learn' },
  { href: '/trading-simulator', label: '$100K Challenge' },
  { href: '/chat',      label: 'Mr. Guy' },
  { href: '/markets',   label: 'Markets' },
]

const moreNav = [
  { href: '/watchlist',  label: 'Watchlist' },
  { href: '/dividends',  label: 'Dividends' },
  { href: '/insiders',   label: 'Smart Money' },
  { href: '/earnings',   label: 'Earnings Calendar' },
  { href: '/hedgefunds', label: 'Hedge Funds' },
  { href: '/quant',      label: 'Quant Strategy' },
]

const mrGuyNav = [
  { href: '/hot-take',      label: 'Hot Take' },
  { href: '/bull-vs-bear',  label: 'Bull vs Bear' },
  { href: '/challenge',     label: 'Pick of the Week' },
  { href: '/report-card',   label: 'Stock Report Card' },
  { href: '/reality-check', label: 'Reality Check' },
  { href: '/translator',    label: 'Finance Translator' },
]

/* ── Mr. Guy pixel head logo — canvas renderer ──────────────────
   Pixel data = GRID rows 0-13, cols 3-14 (the head + shirt top)  */
const N = null
const HEAD_PIXELS: Array<Array<string|null>> = [
  [N,    N,    '#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',N      ], // r0
  [N,    '#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'], // r1
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'], // r2
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'], // r3
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'], // r4
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'], // r5
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'], // r6 sunglasses
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'], // r7
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'], // r8
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'], // r9
  [N,    '#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N      ], // r10 chin
  [N,    '#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,    N      ], // r11
  [N,    N,    '#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',N,    N      ], // r12 collar
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'], // r13 shirt
]
const COLS = 12, ROWS = 14

function MrGuyPixelHead({ px = 3 }: { px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    HEAD_PIXELS.forEach((row, r) => {
      row.forEach((color, col) => {
        if (!color) return
        ctx.fillStyle = color
        ctx.fillRect(col * px, r * px, px, px)
      })
    })
  }, [px])
  return (
    <canvas
      ref={ref}
      width={COLS * px}
      height={ROWS * px}
      style={{ display: 'block', imageRendering: 'pixelated', flexShrink: 0 }}
    />
  )
}

export default function TopNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mrGuyOpen, setMrGuyOpen] = useState(false)
  const { themeId, setTheme } = useTheme()
  const isDark = themeId !== 'white'
  const toggleDark = () => setTheme(isDark ? 'white' : 'default')

  const { isAdmin } = useAdmin()
  const isPro = !!(session?.user as any)?.isPro

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : null

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const moreActive = moreNav.some(n => isActive(n.href))
  const mrGuyToolsActive = mrGuyNav.some(n => isActive(n.href))

  return (
    <>
      <header className={cn(
        'h-16 flex items-center px-4 md:px-8 gap-0 flex-shrink-0 sticky top-0 z-40 transition-colors',
        isDark
          ? 'bg-gray-900 border-b border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
          : 'bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      )}>
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-3 md:mr-8 shrink-0">
          <MrGuyPixelHead px={3} />
          <span className={cn('text-[15px] lg:text-base font-700 tracking-tight font-bold', isDark ? 'text-white' : 'text-slate-900')}>Mr. Guy</span>
        </Link>

        {/* Primary nav — desktop */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {primaryNav.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-600/10 text-blue-500'
                    : isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {label}
              </Link>
            )
          })}

          {/* More dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                moreActive ? 'bg-blue-600/10 text-blue-500' : isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              More <ChevronDown className="h-3 w-3" />
            </button>
            {moreOpen && (
              <div className={cn('absolute top-full left-0 mt-1 w-48 rounded-xl shadow-lg py-1 z-50 border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200')}>
                {moreNav.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'block px-4 py-2 text-sm transition-colors',
                      isActive(href) ? 'text-blue-500 bg-blue-600/10' : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mr. Guy Tools dropdown */}
          <div className="relative">
            <button
              onClick={() => setMrGuyOpen(!mrGuyOpen)}
              onBlur={() => setTimeout(() => setMrGuyOpen(false), 150)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                mrGuyToolsActive ? 'bg-orange-500/10 text-orange-400' : isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              Mr. Guy Tools <ChevronDown className="h-3 w-3" />
            </button>
            {mrGuyOpen && (
              <div className={cn('absolute top-full left-0 mt-1 w-52 rounded-xl shadow-lg py-1 z-50 border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200')}>
                <div className={cn('px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>
                  Mr. Guy Features
                </div>
                {mrGuyNav.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'block px-4 py-2 text-sm transition-colors',
                      isActive(href) ? 'text-orange-400 bg-orange-500/10' : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Dark / Light toggle */}
          <button
            onClick={toggleDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn('min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center transition-colors', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700')}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAdmin && (
            <Link
              href="/analytics"
              className={cn('hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors text-red-400 hover:text-red-300')}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
          {session && !isPro && (
            <Link
              href="/upgrade"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade
            </Link>
          )}
          {session ? (
            <Link
              href="/settings"
              className={cn('hidden md:flex items-center gap-1.5 text-sm transition-colors', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn('hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Avatar — only shown when logged in */}
          {session && (
            <div
              className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
              style={{ backgroundColor: `rgb(var(--accent, 37 99 235))` }}
            >
              {initials}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            aria-label="Open navigation menu"
            className={cn('md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors', isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-slate-500 hover:bg-slate-100')}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside id="mobile-nav" aria-label="Mobile navigation" className={cn('fixed right-0 top-0 h-full w-72 flex flex-col shadow-xl border-l', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200')}>
            <div className={cn('flex items-center justify-between px-5 py-4 border-b', isDark ? 'border-gray-800' : 'border-slate-100')}>
              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className={cn('min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none', isDark ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}
              >
                <X className={cn('h-5 w-5', isDark ? 'text-gray-400' : 'text-slate-500')} />
              </button>
            </div>

            <nav aria-label="Mobile navigation links" className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {[...primaryNav, ...moreNav].map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center min-h-[44px] px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      active ? 'bg-blue-600/10 text-blue-500' : isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
              <div className={cn('px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>
                Mr. Guy Tools
              </div>
              {mrGuyNav.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center min-h-[44px] px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      active ? 'bg-orange-500/10 text-orange-400' : isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className={cn('border-t p-4 space-y-1 pb-safe', isDark ? 'border-gray-800' : 'border-slate-100')}>
              {[
                { onClick: toggleDark, icon: isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, label: isDark ? 'Light Mode' : 'Dark Mode' },
              ].map(({ onClick, icon, label }) => (
                <button key={label} onClick={onClick} className={cn('flex items-center gap-2 w-full min-h-[44px] px-3 py-3 rounded-lg text-sm', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}>
                  {icon} {label}
                </button>
              ))}
              {session ? (
                <>
                  {!isPro && (
                    <Link
                      href="/upgrade"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] px-3 py-3 rounded-lg text-sm font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                    >
                      <Zap className="h-4 w-4" /> Upgrade
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className={cn('flex items-center gap-2 min-h-[44px] px-3 py-3 rounded-lg text-sm', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className={cn('flex items-center gap-2 w-full min-h-[44px] px-3 py-3 rounded-lg text-sm', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className={cn('flex items-center gap-2 min-h-[44px] px-3 py-3 rounded-lg text-sm font-medium', isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}
                >
                  <LogIn className="h-4 w-4" /> Sign In
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
