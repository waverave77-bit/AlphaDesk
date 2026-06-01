/**
 * Simple in-memory IP rate limiter.
 *
 * Works within a single warm serverless instance — good enough to block
 * bots and runaway scripts. For cross-instance limiting, swap for Upstash.
 *
 * Usage:
 *   const ok = checkIpLimit(ip, 'stock', 60, 60_000) // 60 req / min
 *   if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

/**
 * @param ip      - Client IP address
 * @param key     - Namespace key (e.g. 'stock', 'search')
 * @param limit   - Max requests allowed in the window
 * @param windowMs - Window length in milliseconds
 * @returns true if the request is allowed, false if it should be blocked
 */
export function checkIpLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const storeKey = `${key}:${ip}`
  const now = Date.now()
  const bucket = store.get(storeKey)

  if (!bucket || now > bucket.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count++
  if (bucket.count > limit) return false

  return true
}

/** Extract the real client IP from a Next.js request. */
export function getIp(req: Request): string {
  const forwarded = (req.headers as any).get?.('x-forwarded-for')
    ?? (req as any).headers?.['x-forwarded-for']
  if (forwarded) return (forwarded as string).split(',')[0].trim()
  return 'unknown'
}
