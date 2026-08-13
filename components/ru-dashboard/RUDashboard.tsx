'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type QueueItem = {
  baseName: string
  hook: string
  uploaded: boolean
  videoId: string | null
  uploadedAt: string | null
}

type StatusResponse = {
  lockActive: boolean
  automationPaused: boolean
  cronSchedule: string
  cronFields: string | null
  queueTotal: number
  queueRemaining: number
  nextUp: QueueItem | null
  recentUploads: QueueItem[]
  characterCount: number | null
  characterLimit: number | null
  lastLogLines: string[]
  checkedAt: string
}

type VideoItem = {
  id: string
  title: string
  thumbnail: string | null
  publishedAt: string
  views: number
  likes: number
  comments: number
  baseName: string | null
  scriptText: string | null
}

const CHANNEL_HANDLE = '@redditstories808-x2v'
const DROPLET_LABEL = '167.172.147.89:3002'
const CRON_DAY_PATTERNS: Record<string, string> = { daily: '* * *', '3x-week': '* * 1,3,5', weekly: '* * 1' }
const CRON_LABELS: Record<string, string> = { daily: 'Daily', '3x-week': '3x/Week', weekly: 'Weekly' }
// Same DST caveat as the PowerScale dashboard this was forked from — small
// personal-project tooling, not worth building real DST handling for.
const CRON_HOUR_PRESETS: { label: string; hourUtc: number }[] = [
  { label: '9 AM ET', hourUtc: 13 },
  { label: '12 PM ET', hourUtc: 16 },
  { label: '3 PM ET', hourUtc: 19 },
  { label: '6 PM ET', hourUtc: 22 },
]

function msUntilNextRun(now: Date, cronFields: string | null) {
  const hour = cronFields ? Number(cronFields.split(/\s+/)[1]) : 13
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0))
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1)
  return next.getTime() - now.getTime()
}
function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600).toString().padStart(2, '0')
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(total % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}
function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

function useScramble(target: number, decimals = 0, durationMs = 800) {
  const finalStr = target.toFixed(decimals)
  const [display, setDisplay] = useState(finalStr)
  useEffect(() => {
    let raf: number
    const start = performance.now()
    function tick(t: number) {
      const p = Math.min(1, (t - start) / durationMs)
      const settled = Math.floor(finalStr.length * p)
      let out = ''
      for (let i = 0; i < finalStr.length; i++) {
        const ch = finalStr[i]
        out += !/[0-9]/.test(ch) || i < settled ? ch : Math.floor(Math.random() * 10).toString()
      }
      setDisplay(out)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setDisplay(finalStr)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [finalStr, durationMs])
  return display
}

function useMouseGlow() {
  const [pos, setPos] = useState({ x: -500, y: -500 })
  useEffect(() => {
    let raf = 0
    function handleMove(e: MouseEvent) {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setPos({ x: e.clientX, y: e.clientY }))
    }
    window.addEventListener('mousemove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      cancelAnimationFrame(raf)
    }
  }, [])
  return pos
}

function StatusPill({ lockActive, paused, unreachable }: { lockActive?: boolean; paused?: boolean; unreachable: boolean }) {
  if (unreachable) {
    return (
      <span className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-widest text-red-300">
        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> Connection Lost
      </span>
    )
  }
  if (lockActive) {
    return (
      <span className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs uppercase tracking-widest text-amber-300">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Narrating — Rendering
      </span>
    )
  }
  if (paused) {
    return (
      <span className="flex items-center gap-2 rounded-full border border-slate-400/40 bg-slate-400/10 px-4 py-2 text-xs uppercase tracking-widest text-slate-300">
        <span className="h-2 w-2 rounded-full bg-slate-400" /> Automation Paused
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-widest text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" /> Standing By
    </span>
  )
}

function HudTile({
  label,
  accent,
  delayMs = 0,
  children,
}: {
  label: string
  accent: string
  delayMs?: number
  children: React.ReactNode
}) {
  return (
    <div
      className="relative animate-tile-in rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition-colors hover:border-white/20"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2" style={{ borderColor: accent }} />
      <span className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2" style={{ borderColor: accent }} />
      <span className="absolute -left-px -bottom-px h-3 w-3 border-l-2 border-b-2" style={{ borderColor: accent }} />
      <span className="absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2" style={{ borderColor: accent }} />
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function lineColor(line: string) {
  const l = line.toLowerCase()
  if (l.includes('error') || l.includes('fail')) return 'text-red-400'
  if (l.includes('uploaded') || l.includes('done') || l.includes('success')) return 'text-emerald-400'
  return 'text-white/50'
}

function TypedLine({ text, instant, className }: { text: string; instant: boolean; className: string }) {
  const [shown, setShown] = useState(instant ? text : '')
  useEffect(() => {
    if (instant) {
      setShown(text)
      return
    }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, 12)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return <div className={className}>{shown}</div>
}

function TerminalPanel({ lines, unreachable }: { lines: string[]; unreachable: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const seenRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-[10px] uppercase tracking-widest text-white/30">pipeline.log</span>
      </div>
      <div ref={containerRef} className="max-h-72 flex-1 overflow-y-auto p-3 text-[11px] leading-relaxed">
        {unreachable ? (
          <div className="text-red-400/70">⚠ Cannot reach droplet — log unavailable</div>
        ) : lines.length === 0 ? (
          <div className="text-white/30">Waiting for output…</div>
        ) : (
          lines.map((line, i) => {
            const instant = seenRef.current.has(line)
            seenRef.current.add(line)
            return <TypedLine key={`${i}-${line}`} text={line} instant={instant} className={lineColor(line)} />
          })
        )}
        <span className="inline-block h-3 w-1.5 translate-y-0.5 bg-orange-400 animate-blink-cursor" />
      </div>
    </div>
  )
}

function StoryQueuePanel({ nextUp, queueRemaining, queueTotal }: { nextUp: QueueItem | null; queueRemaining: number; queueTotal: number }) {
  return (
    <div className="h-full rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/40">
        <span>Story Queue</span>
        <span className="text-white/30">{queueRemaining} of {queueTotal} left</span>
      </div>
      {!nextUp ? (
        <div className="py-8 text-center text-xs text-white/30">Queue empty — add more scripts to keep this running</div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-md border border-orange-400/30 bg-orange-400/5 px-3 py-2">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-orange-300/70">Up Next</div>
            <div className="text-xs font-semibold text-white/80">{nextUp.baseName}</div>
            <div className="mt-1 line-clamp-3 text-[11px] leading-snug text-white/50">{nextUp.hook}</div>
          </div>
          {queueRemaining > 1 && (
            <div className="text-center text-[10px] text-white/30">+ {queueRemaining - 1} more waiting behind this one</div>
          )}
        </div>
      )}
    </div>
  )
}

function RecentUploadsPanel({ uploads }: { uploads: QueueItem[] }) {
  return (
    <div className="h-full rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Recently Posted</div>
      {uploads.length === 0 ? (
        <div className="py-8 text-center text-xs text-white/30">Nothing posted yet</div>
      ) : (
        <div className="space-y-2">
          {uploads.map((u) => (
            <a
              key={u.baseName}
              href={`https://youtube.com/shorts/${u.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md border border-white/5 bg-black/20 px-3 py-2 transition-colors hover:border-emerald-400/30"
            >
              <div className="line-clamp-1 text-xs font-semibold text-white/80">{u.hook}</div>
              <div className="mt-1 text-[10px] text-white/30">{u.uploadedAt ? relativeTime(u.uploadedAt) : '—'}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

const VIDEO_SORTS = [
  { key: 'recent', label: 'Recent' },
  { key: 'views', label: 'Top Views' },
  { key: 'engagement', label: 'Top Engagement' },
] as const
type VideoSort = (typeof VIDEO_SORTS)[number]['key']

function VideoCard({ v }: { v: VideoItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/30 transition-colors hover:border-orange-400/40">
      <a href={`https://youtube.com/shorts/${v.id}`} target="_blank" rel="noopener noreferrer">
        {v.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.thumbnail} alt={v.title} className="aspect-video w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
        )}
      </a>
      <div className="p-3">
        <a
          href={`https://youtube.com/shorts/${v.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 block text-xs font-semibold text-white/80 hover:text-orange-200"
        >
          {v.title}
        </a>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/40">
          <span>👁 {formatNum(v.views)}</span>
          <span>❤ {formatNum(v.likes)}</span>
          <span>💬 {formatNum(v.comments)}</span>
        </div>
        <div className="mt-1.5 text-[10px] text-white/30">{relativeTime(v.publishedAt)}</div>
        {v.scriptText && (
          <>
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-2 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:border-white/25 hover:text-white/60"
            >
              {open ? '▴ Hide full story' : '▾ Read full story'}
            </button>
            {open && (
              <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-line rounded border border-white/10 bg-black/40 p-2.5 text-[11px] leading-snug text-white/70">
                {v.scriptText}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function VideoGrid({
  videos,
  unreachable,
  sort,
  onSortChange,
}: {
  videos: VideoItem[] | null
  unreachable: boolean
  sort: VideoSort
  onSortChange: (s: VideoSort) => void
}) {
  const sorted = useMemo(() => {
    if (!videos) return null
    const arr = [...videos]
    if (sort === 'views') arr.sort((a, b) => b.views - a.views)
    else if (sort === 'engagement') arr.sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
    else arr.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    return arr
  }, [videos, sort])

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">Posted Stories</div>
        <div className="flex gap-1.5">
          {VIDEO_SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => onSortChange(s.key)}
              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest transition-colors ${
                sort === s.key ? 'border-orange-400/60 bg-orange-400/10 text-orange-200' : 'border-white/10 text-white/40 hover:border-white/25'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {unreachable ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center text-xs text-white/30">
          📡 Live video stats unavailable — droplet unreachable
        </div>
      ) : sorted === null ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center text-xs text-white/30">No videos posted yet</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((v) => (
            <VideoCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function RUDashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [videos, setVideos] = useState<VideoItem[] | null>(null)
  const [videosUnreachable, setVideosUnreachable] = useState(false)
  const [videoSort, setVideoSort] = useState<VideoSort>('recent')
  const [now, setNow] = useState(() => new Date())
  const [triggerState, setTriggerState] = useState<'idle' | 'confirm' | 'sending' | 'sent' | 'error'>('idle')
  const [pauseBusy, setPauseBusy] = useState(false)
  const [cronConfirmPreset, setCronConfirmPreset] = useState<string | null>(null)
  const [cronConfirmHour, setCronConfirmHour] = useState<number | null>(null)
  const cronConfirmHourTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [cronBusy, setCronBusy] = useState(false)
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cronConfirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mouse = useMouseGlow()

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ru-dashboard/status', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'failed')
      setStatus(data)
      setStatusError(null)
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'unreachable')
    }
  }, [])

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/ru-dashboard/videos', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'failed')
      setVideos(data.videos ?? [])
      setVideosUnreachable(false)
    } catch {
      setVideosUnreachable(true)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchVideos()
    const statusInterval = setInterval(fetchStatus, 15000)
    const videosInterval = setInterval(fetchVideos, 60000)
    const clockInterval = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(statusInterval)
      clearInterval(videosInterval)
      clearInterval(clockInterval)
    }
  }, [fetchStatus, fetchVideos])

  useEffect(
    () => () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      if (cronConfirmTimeout.current) clearTimeout(cronConfirmTimeout.current)
      if (cronConfirmHourTimeout.current) clearTimeout(cronConfirmHourTimeout.current)
    },
    []
  )

  const handleTrigger = useCallback(async () => {
    if (triggerState === 'idle') {
      setTriggerState('confirm')
      confirmTimeout.current = setTimeout(() => setTriggerState('idle'), 4500)
      return
    }
    if (triggerState === 'confirm') {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      setTriggerState('sending')
      try {
        const res = await fetch('/api/ru-dashboard/trigger', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? 'failed')
        setTriggerState('sent')
        setTimeout(() => setTriggerState('idle'), 3000)
        fetchStatus()
      } catch {
        setTriggerState('error')
        setTimeout(() => setTriggerState('idle'), 3000)
      }
    }
  }, [triggerState, fetchStatus])

  const togglePause = useCallback(async () => {
    setPauseBusy(true)
    try {
      const endpoint = status?.automationPaused ? 'resume' : 'pause'
      const res = await fetch(`/api/ru-dashboard/${endpoint}`, { method: 'POST' })
      if (res.ok) await fetchStatus()
    } finally {
      setPauseBusy(false)
    }
  }, [status?.automationPaused, fetchStatus])

  const requestCronChange = useCallback(
    (preset: string) => {
      if (cronConfirmPreset === preset) {
        if (cronConfirmTimeout.current) clearTimeout(cronConfirmTimeout.current)
        setCronConfirmPreset(null)
        setCronBusy(true)
        fetch('/api/ru-dashboard/cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preset }),
        })
          .then(() => fetchStatus())
          .finally(() => setCronBusy(false))
        return
      }
      setCronConfirmPreset(preset)
      cronConfirmTimeout.current = setTimeout(() => setCronConfirmPreset(null), 4000)
    },
    [cronConfirmPreset, fetchStatus]
  )

  const requestCronHourChange = useCallback(
    (hourUtc: number) => {
      if (cronConfirmHour === hourUtc) {
        if (cronConfirmHourTimeout.current) clearTimeout(cronConfirmHourTimeout.current)
        setCronConfirmHour(null)
        setCronBusy(true)
        fetch('/api/ru-dashboard/cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hour: hourUtc }),
        })
          .then(() => fetchStatus())
          .finally(() => setCronBusy(false))
        return
      }
      setCronConfirmHour(hourUtc)
      cronConfirmHourTimeout.current = setTimeout(() => setCronConfirmHour(null), 4000)
    },
    [cronConfirmHour, fetchStatus]
  )

  const countdownMs = useMemo(() => msUntilNextRun(now, status?.cronFields ?? null), [now, status?.cronFields])
  const quotaDisplay = useScramble(status?.characterCount ?? 0, 0, 800)
  const queueDisplay = useScramble(status?.queueRemaining ?? 0, 0, 600)

  const quotaRemaining =
    status?.characterCount != null && status?.characterLimit != null ? status.characterLimit - status.characterCount : null
  const quotaPct =
    status?.characterLimit ? Math.max(0, Math.min(100, ((status.characterLimit - (status.characterCount ?? 0)) / status.characterLimit) * 100)) : 0
  const quotaColor = quotaPct > 50 ? '#39ff14' : quotaPct > 20 ? '#ffd400' : '#ff3b3b'

  const cronParts = status?.cronFields?.trim().split(/\s+/) ?? null
  const activeCronPreset = cronParts
    ? Object.entries(CRON_DAY_PATTERNS).find(([, p]) => p === `* * ${cronParts[4]}`)?.[0] ?? null
    : null
  const activeCronHourUtc = cronParts ? Number(cronParts[1]) : null

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0704] font-mono text-white selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] animate-blob-float rounded-full bg-orange-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] animate-blob-float rounded-full bg-emerald-700/20 blur-[120px]" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] animate-blob-float rounded-full bg-amber-200/10 blur-[120px]" style={{ animationDelay: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,246,220,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,246,220,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div
          className="absolute inset-0 transition-[background] duration-300"
          style={{ background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(241,97,79,0.08), transparent 40%)` }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-orange-400/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(241,97,79,0.8)]" />
              {now.toUTCString().slice(17, 25)} UTC
            </div>
            <h1 className="bg-gradient-to-r from-orange-400 via-[#FFF6DC] to-emerald-300 bg-clip-text text-4xl font-black tracking-tight text-transparent [text-shadow:0_0_40px_rgba(241,97,79,0.3)] sm:text-6xl">
              REDDIT UNTOLD
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-white/40">Story Pipeline</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill lockActive={status?.lockActive} paused={status?.automationPaused} unreachable={!!statusError} />
            <button
              onClick={togglePause}
              disabled={pauseBusy || !status}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-white/70 transition-colors hover:border-slate-300/50 hover:text-slate-200 disabled:opacity-40"
            >
              {status?.automationPaused ? '▶ Resume Automation' : '⏸ Pause Automation'}
            </button>
            <a
              href={`https://youtube.com/${CHANNEL_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-white/70 transition-colors hover:border-orange-400/50 hover:text-orange-300"
            >
              {CHANNEL_HANDLE} ↗
            </a>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <HudTile label="Voice Quota" accent="#F1614F" delayMs={0}>
            <div className="text-2xl font-bold tabular-nums text-orange-300">
              {quotaRemaining != null ? formatNum(quotaRemaining) : '—'}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${quotaPct}%`, background: quotaColor, boxShadow: `0 0 10px ${quotaColor}` }} />
            </div>
            <div className="mt-1 text-[10px] text-white/30">
              {status?.characterCount != null ? `${quotaDisplay} used` : 'quota check failed'} · of {status?.characterLimit ?? '—'} chars
            </div>
          </HudTile>

          <HudTile label="Narrator" accent="#4a7c59" delayMs={60}>
            <div className="text-lg font-bold uppercase text-emerald-300">George</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,124,89,0.7)]" />
            <div className="mt-1 text-[10px] text-white/30">ElevenLabs TTS · fixed voice</div>
          </HudTile>

          <HudTile label="Next Auto-Post" accent="#ffd400" delayMs={120}>
            <div className="text-2xl font-bold tabular-nums text-amber-300">{status?.automationPaused ? '—:—:—' : formatCountdown(countdownMs)}</div>
            <div className="mt-1 text-[10px] text-white/30">{status?.automationPaused ? 'paused' : status?.cronSchedule ?? '—'}</div>
          </HudTile>

          <HudTile label="Queue Remaining" accent="#F1614F" delayMs={180}>
            <div className="text-2xl font-bold tabular-nums text-orange-300">{queueDisplay}</div>
            <div className="mt-1 text-[10px] text-white/30">of {status?.queueTotal ?? '—'} scripts</div>
          </HudTile>

          <HudTile label="Last Checked" accent="#94a3b8" delayMs={240}>
            <div className="text-sm font-bold text-white/70">{status ? relativeTime(status.checkedAt) : '—'}</div>
            <div className="mt-1 text-[10px] text-white/30">auto-refresh 15s</div>
          </HudTile>
        </div>

        <div className="mx-auto mt-8 max-w-xl rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Manual Run</div>
          <p className="text-[11px] text-white/40">
            Picks the next un-uploaded script, generates whatever&apos;s missing, and posts it. There&apos;s no draft
            queue in this pipeline — this posts <span className="text-orange-300">live, publicly</span>, same as the
            scheduled run.
          </p>
          {status?.nextUp && (
            <div className="mt-3 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/60">
              Next up: <span className="text-white/80">{status.nextUp.baseName}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleTrigger}
            disabled={status?.lockActive || triggerState === 'sending' || !status?.nextUp}
            className={`relative overflow-hidden rounded-full px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all ${
              status?.lockActive || !status?.nextUp
                ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30'
                : triggerState === 'confirm'
                ? 'border border-amber-400 bg-amber-400/20 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
                : triggerState === 'sent'
                ? 'border border-emerald-400 bg-emerald-400/20 text-emerald-200'
                : triggerState === 'error'
                ? 'border border-red-400 bg-red-400/20 text-red-200'
                : 'border border-orange-400/60 bg-gradient-to-r from-orange-500/20 to-emerald-500/20 text-orange-100 shadow-[0_0_30px_rgba(241,97,79,0.35)] hover:scale-[1.03] hover:shadow-[0_0_45px_rgba(241,97,79,0.55)]'
            }`}
          >
            {status?.lockActive
              ? '🔒 Rendering In Progress'
              : !status?.nextUp
              ? 'Queue Empty'
              : triggerState === 'sending'
              ? 'Posting…'
              : triggerState === 'sent'
              ? '✅ Posted Live'
              : triggerState === 'error'
              ? '⚠ Post Failed — Retry'
              : triggerState === 'confirm'
              ? 'Confirm? Posts live immediately'
              : '📤 Post Next Story Now'}
          </button>
          {triggerState === 'confirm' && <p className="text-[11px] text-white/40">Click again within a few seconds to confirm</p>}
        </div>

        <div className="mx-auto mt-8 max-w-xl rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/40">
            <span>Posting Schedule</span>
            <span className="text-white/30">{status?.cronSchedule ?? '—'}</span>
          </div>
          <div className="flex gap-2">
            {Object.keys(CRON_DAY_PATTERNS).map((preset) => {
              const active = activeCronPreset === preset
              const confirming = cronConfirmPreset === preset
              return (
                <button
                  key={preset}
                  onClick={() => requestCronChange(preset)}
                  disabled={cronBusy}
                  className={`flex-1 rounded-md border px-3 py-2 text-[11px] uppercase tracking-widest transition-colors disabled:opacity-40 ${
                    confirming
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : active
                      ? 'border-orange-400/60 bg-orange-400/10 text-orange-200'
                      : 'border-white/15 text-white/50 hover:border-white/30'
                  }`}
                >
                  {confirming ? 'Confirm?' : CRON_LABELS[preset]}
                </button>
              )
            })}
          </div>
          <div className="mb-3 mt-4 text-[10px] uppercase tracking-[0.25em] text-white/40">Posting Time (ET)</div>
          <div className="flex gap-2">
            {CRON_HOUR_PRESETS.map(({ label, hourUtc }) => {
              const active = activeCronHourUtc === hourUtc
              const confirming = cronConfirmHour === hourUtc
              return (
                <button
                  key={hourUtc}
                  onClick={() => requestCronHourChange(hourUtc)}
                  disabled={cronBusy}
                  className={`flex-1 rounded-md border px-3 py-2 text-[11px] uppercase tracking-widest transition-colors disabled:opacity-40 ${
                    confirming
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                      : active
                      ? 'border-orange-400/60 bg-orange-400/10 text-orange-200'
                      : 'border-white/15 text-white/50 hover:border-white/30'
                  }`}
                >
                  {confirming ? 'Confirm?' : label}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/40">
            {status && status.queueRemaining > 0
              ? `${status.queueRemaining} script${status.queueRemaining === 1 ? '' : 's'} left in the queue at this rate.`
              : 'Queue is empty — add more scripts to scripts/ to keep this running.'}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-7">
          <div className="lg:col-span-2">
            <StoryQueuePanel nextUp={status?.nextUp ?? null} queueRemaining={status?.queueRemaining ?? 0} queueTotal={status?.queueTotal ?? 0} />
          </div>
          <div className="lg:col-span-3">
            <TerminalPanel lines={status?.lastLogLines ?? []} unreachable={!!statusError} />
          </div>
          <div className="lg:col-span-2">
            <RecentUploadsPanel uploads={status?.recentUploads ?? []} />
          </div>
        </div>

        <VideoGrid videos={videos} unreachable={videosUnreachable} sort={videoSort} onSortChange={setVideoSort} />

        <footer className="mt-10 border-t border-white/10 pt-4 text-center text-[10px] uppercase tracking-widest text-white/20">
          {CHANNEL_HANDLE} · droplet {DROPLET_LABEL} · {status?.cronSchedule ?? 'cron —'}
        </footer>
      </div>
    </div>
  )
}
