'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="h-14 w-14 text-yellow-500 mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-gray-400 text-sm max-w-sm mb-8">
        Mr. Guy tripped over a cable. We&apos;ve logged the error and will look into it.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
      <p className="text-xs text-gray-700 mt-10">For informational purposes only. Not financial advice.</p>
    </div>
  )
}
