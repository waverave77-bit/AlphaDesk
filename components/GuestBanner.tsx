'use client'
import Link from 'next/link'
import { UserPlus, LogIn } from 'lucide-react'

export default function GuestBanner() {
  return (
    <div className="w-full bg-blue-600 text-white text-sm px-4 py-2 flex items-center justify-between gap-4 z-50 shrink-0">
      <p className="font-medium hidden sm:block">
        You&apos;re browsing as a guest. Sign up free to save your watchlist, access all tools, and more.
      </p>
      <p className="font-medium sm:hidden">Browsing as guest</p>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-blue-100 hover:text-white border border-blue-400 hover:border-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign In
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 bg-white text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Sign Up Free
        </Link>
      </div>
    </div>
  )
}
