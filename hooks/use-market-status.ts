'use client'
import { useState, useEffect } from 'react'
import { getMarketStatus } from '@/lib/market-hours'

type Status = ReturnType<typeof getMarketStatus>

/**
 * Live US-market status, computed on the client every 30s.
 *
 * getMarketStatus() is pure and timezone-correct (it derives Eastern time from the
 * UTC epoch, so it's right no matter where the user is). Computing it on the client
 * — rather than reading a cached value off an API — means the badge/mood flip the
 * moment the market opens or closes, and never go stale.
 *
 * Returns null until mounted to avoid an SSR/hydration mismatch.
 */
export function useMarketStatus(): Status | null {
  const [status, setStatus] = useState<Status | null>(null)
  useEffect(() => {
    const tick = () => setStatus(getMarketStatus())
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])
  return status
}
