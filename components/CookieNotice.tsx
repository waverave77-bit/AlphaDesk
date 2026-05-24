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
          We use only functional session cookies required for authentication. Embedded{' '}
          <strong className="text-gray-300">TradingView</strong> charts may set their own cookies subject
          to{' '}
          <a
            href="https://www.tradingview.com/policies/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            TradingView&apos;s privacy policy
          </a>
          .{' '}
          <Link href="/privacy" className="text-blue-400 hover:underline">
            Our Privacy Policy
          </Link>
          .
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
