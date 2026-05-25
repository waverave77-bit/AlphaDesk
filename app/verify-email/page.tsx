'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async res => {
        if (res.redirected) {
          // Successful — API redirected to /dashboard?verified=1
          router.push('/dashboard?verified=1')
          return
        }
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
        }
      })
      .catch(() => { setStatus('error'); setMessage('Something went wrong. Try again.') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-5">
        <span className="text-4xl">🧑‍💼</span>

        {status === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
            <p className="text-white font-semibold text-lg">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto" />
            <p className="text-white font-bold text-xl">Email verified! ✅</p>
            <p className="text-gray-400 text-sm">Redirecting you to the dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-red-400 mx-auto" />
            <p className="text-white font-bold text-xl">Verification failed</p>
            <p className="text-gray-400 text-sm">{message || 'The link may have expired or already been used.'}</p>
            <Link
              href="/dashboard"
              className="inline-block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
            <p className="text-gray-600 text-xs">
              You can resend the verification email from the banner on your dashboard.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
