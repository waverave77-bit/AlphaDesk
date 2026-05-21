'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Star, Settings, TrendingUp, LogOut, FlaskConical, Building2, Users, Calendar, Activity, Bell, BookOpen } from 'lucide-react'
import { signOut } from 'next-auth/react'
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

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-64 bg-gray-950 border-r border-gray-800 px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `rgb(var(--accent, 59 130 246))` }}
        >
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Zains Game</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'border' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
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

      <div className="border-t border-gray-800 pt-4">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <p className="text-xs text-gray-600 px-3 mt-3 leading-relaxed">
          For informational purposes only. Not financial advice.
        </p>
      </div>
    </aside>
  )
}
