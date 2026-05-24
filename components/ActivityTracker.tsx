'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function ActivityTracker() {
  const pathname = usePathname()
  const { status } = useSession()
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Record page view on every navigation
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {})
  }, [pathname, status])

  // Ping every 60s to mark user as live
  useEffect(() => {
    if (status !== 'authenticated') return

    const ping = () => {
      fetch('/api/analytics/ping', { method: 'POST' }).catch(() => {})
    }

    ping() // immediate ping on mount / auth
    pingRef.current = setInterval(ping, 60_000)

    return () => {
      if (pingRef.current) clearInterval(pingRef.current)
    }
  }, [status])

  return null
}
