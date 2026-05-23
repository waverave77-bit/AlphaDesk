'use client'
import Link from 'next/link'
import { Lock, UserPlus, LogIn } from 'lucide-react'

interface GuestGateProps {
  feature?: string
  children: React.ReactNode
}

// Wrap any tool/feature. When user has no session, shows a sign-up prompt instead.
export default function GuestGate({ feature = 'this feature', children }: GuestGateProps) {
  return <>{children}</>
}

// Standalone lock screen — drop this inside any page when session is null
export function GuestLock({ feature = 'this feature' }: { feature?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] text-center px-6">
      <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-5">
        <Lock className="h-8 w-8 text-blue-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign up to use {feature}</h2>
      <p className="text-gray-500 text-sm max-w-xs mb-7 leading-relaxed">
        Create a free account to unlock all tools, save your watchlist, and get AI-powered insights.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up Free
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Link>
      </div>
      <p className="text-xs text-gray-400 mt-5">Free forever · No credit card needed</p>
    </div>
  )
}

// Inline mini gate — for watchlist add button, etc.
export function GuestInline({ message = 'Sign up to use this feature' }: { message?: string }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
        <Lock className="h-4 w-4 shrink-0" />
        {message}
      </div>
      <div className="flex gap-2 shrink-0">
        <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
          Sign Up Free
        </Link>
        <Link href="/login" className="border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  )
}
