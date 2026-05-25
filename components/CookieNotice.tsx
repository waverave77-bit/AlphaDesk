'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('cookie-notice-dismissed')
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('cookie-notice-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 px-4 py-3 shadow-lg">
      <div className="max-w-5xl mx-auto flex items-start sm:items-center gap-3 justify-between">
        <p className="text-xs text-gray-400 leading-relaxed">
          We use functional session cookies required for authentication, and Vercel Analytics collects anonymised page-view data to help us improve the service. No advertising or third-party tracking cookies are used. See our{' '}
          <Link href="/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss cookie notice"
          className="shrink-0 p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
