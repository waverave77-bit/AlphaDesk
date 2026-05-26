'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Star, Settings, TrendingUp, LogOut, Menu, X, FlaskConical, Building2, Users, Calendar, Activity, Bell, BookOpen, Zap } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/research', label: 'Research', icon: Search },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/earnings', label: 'Earnings', icon: Calendar },
  { href: '/learn', label: 'Dictionary', icon: BookOpen },
  { href: '/quant', label: 'Quant Strategy', icon: FlaskConical },
  { href: '/markets', label: 'Markets', icon: Activity },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/hedgefunds', label: 'Hedge Funds', icon: Building2 },
  { href: '/insiders', label: 'Smart Money', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const isPro = !!(session?.user as any)?.isPro

  return (
    <>
      <button
        aria-label="Open navigation menu"
        className="fixed top-2 left-2 z-50 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-gray-900 border border-gray-700 transition-colors hover:bg-gray-800"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5 text-gray-300" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" onClick={() => setOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-gray-950 border-r border-gray-800 px-4 py-6 flex flex-col z-50">
            <div className="flex items-center justify-between px-2 mb-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `rgb(var(--accent, 59 130 246))` }}>
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Mr. Guy Invests</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors hover:bg-gray-800"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      active ? 'border' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                    )}
                    style={active ? {
                      backgroundColor: `rgb(var(--accent, 59 130 246) / 0.15)`,
                      color: `rgb(var(--accent-light, 96 165 250))`,
                      borderColor: `rgb(var(--accent, 59 130 246) / 0.2)`,
                    } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-gray-800 pt-4 pb-6">
              {!isPro && (
                <Link
                  href="/upgrade"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 min-h-[44px] rounded-lg px-3 py-3 text-sm font-bold mb-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade to Pro
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-3 min-h-[44px] w-full rounded-lg px-3 py-3 text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
