'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Star, Settings, TrendingUp, LogOut, Menu, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/research', label: 'Research', icon: Search },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg bg-gray-900 border border-gray-700 p-2"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5 text-gray-300" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-gray-950 border-r border-gray-800 px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between px-2 mb-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AlphaDesk</span>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active ? 'bg-blue-600/15 text-blue-400' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </aside>
        </div>
      )}
    </>
  )
}
