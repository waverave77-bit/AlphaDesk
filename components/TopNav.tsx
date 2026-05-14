'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Settings, Menu, X, LogOut, ChevronDown, Sun, Moon, Shield } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
import { useAdmin } from '@/hooks/useAdmin'

const primaryNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/research',  label: 'Research' },
  { href: '/markets',   label: 'Markets' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/learn',     label: 'Learn' },
  { href: '/insiders',  label: 'Smart Money' },
  { href: '/chat',      label: '✨ AI Chat' },
]

const moreNav = [
  { href: '/earnings',    label: 'Earnings Calendar' },
  { href: '/hedgefunds',  label: 'Hedge Funds' },
  { href: '/quant',       label: 'Quant Strategy' },
  { href: '/game',        label: '🏆 $100K Challenge' },
]

export default function TopNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const { themeId, setTheme } = useTheme()
  const isDark = themeId !== 'white'
  const toggleDark = () => setTheme(isDark ? 'white' : 'default')

  const { isAdmin } = useAdmin()

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ZJ'

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const moreActive = moreNav.some(n => isActive(n.href))

  return (
    <>
      <header className={cn(
        'h-16 flex items-center px-8 gap-0 flex-shrink-0 sticky top-0 z-40 transition-colors',
        isDark
          ? 'bg-gray-900 border-b border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
          : 'bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      )}>
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-8 shrink-0">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `rgb(var(--accent, 37 99 235))` }}
          >
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <span className={cn('text-[15px] lg:text-base font-700 tracking-tight font-bold', isDark ? 'text-white' : 'text-slate-900')}>Zains Game</span>
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
                moreActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              More <ChevronDown className="h-3 w-3" />
            </button>
            {moreOpen && (
              <div className={cn('absolute top-full left-0 mt-1 w-44 rounded-xl shadow-lg py-1 z-50 border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200')}>
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
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Dark / Light toggle */}
          <button
            onClick={toggleDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700')}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              className={cn('hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors text-red-400 hover:text-red-300')}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
          <Link
            href="/settings"
            className={cn('hidden md:flex items-center gap-1.5 text-sm transition-colors', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>

          {/* Avatar */}
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
            style={{ backgroundColor: `rgb(var(--accent, 37 99 235))` }}
          >
            {initials}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className={cn('fixed right-0 top-0 h-full w-72 flex flex-col shadow-xl border-l', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200')}>
            <div className={cn('flex items-center justify-between px-5 py-4 border-b', isDark ? 'border-gray-800' : 'border-slate-100')}>
              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {[...primaryNav, ...moreNav].map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active ? 'bg-blue-600/10 text-blue-500' : isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className={cn('border-t p-4 space-y-1', isDark ? 'border-gray-800' : 'border-slate-100')}>
              {[
                { onClick: toggleDark, icon: isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, label: isDark ? 'Light Mode' : 'Dark Mode' },
              ].map(({ onClick, icon, label }) => (
                <button key={label} onClick={onClick} className={cn('flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}>
                  {icon} {label}
                </button>
              ))}
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={cn('flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm', isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100')}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
