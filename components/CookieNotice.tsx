'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const choice = localStorage.getItem('cookie-analytics-choice')
    if (!choice) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-analytics-choice', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie-analytics-choice', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 px-4 py-4 shadow-lg">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <p className="text-xs text-gray-400 leading-relaxed">
          We use strictly necessary session cookies for authentication, and optional analytics
          (Vercel Analytics + page-visit logging) to improve the Service. No advertising or
          third-party tracking.{' '}
          <Link href="/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-3 py-1.5 rounded text-xs font-semibold text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-200 transition-colors"
          >
            Decline analytics
          </button>
          <button
            onClick={accept}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
