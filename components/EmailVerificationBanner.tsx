'use client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Mail, X, RefreshCw } from 'lucide-react'

export default function EmailVerificationBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const emailVerified = (session?.user as any)?.emailVerified
  const isDemo = (session?.user as any)?.isDemo

  // Don't show if: not logged in, already verified, demo user, or dismissed
  if (!session || emailVerified || isDemo || dismissed) return null

  const resend = async () => {
    setSending(true)
    setError('')
    const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
    setSending(false)
    if (res.ok) {
      setSent(true)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Failed to send. Try again.')
    }
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <Mail className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-yellow-300 leading-snug">
          <strong>Verify your email</strong> to unlock AI features —
          check your inbox for the link.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
        {error && <span className="text-red-400 text-xs">{error}</span>}
        {sent ? (
          <span className="text-green-400 text-xs font-medium">Sent ✓</span>
        ) : (
          <button
            onClick={resend}
            disabled={sending}
            className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${sending ? 'animate-spin' : ''}`} />
            Resend
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-2 -m-2 text-yellow-600 hover:text-yellow-400 transition-colors rounded-lg"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
