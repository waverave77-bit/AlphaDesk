'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-gray-400 text-sm max-w-sm mb-7">
        This page hit an unexpected error. Your account data is safe — this is just a display issue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
        >
          <Home className="h-3.5 w-3.5" /> Dashboard
        </button>
      </div>
    </div>
  )
}
