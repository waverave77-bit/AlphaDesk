'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type StatusResponse = {
  lockActive: boolean
  automationPaused: boolean
  cronSchedule: string
  cronFields: string | null
  lastModelUsed: string
  estimatedReplicateRemaining: number
  replicateTotalLoaded: number
  recentMatchups: string[]
  recentAlerts: { title: string; message: string; at: string }[]
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
  model: string | null
  dryRun: boolean
}

type ModelStats = Record<
  string,
  { count: number; totalViews: number; totalLikes: number; totalComments: number; avgViews: number; avgLikes: number }
>

type RosterCharacter = { name: string; franchise: string; themeColor: string }

const CHANNEL_ID = 'UCdz-4eCUd3VjAC0zvzjhgRQ'
const DROPLET_LABEL = '167.172.147.89:3001'
const CRON_PRESETS: Record<string, string> = { daily: '0 9 * * *', '3x-week': '0 9 * * 1,3,5', weekly: '0 9 * * 1' }
const CRON_LABELS: Record<string, string> = { daily: 'Daily', '3x-week': '3x/Week', weekly: 'Weekly' }

// Display-only lookup, duplicated (not imported) from matchup-shorts'
// characterRoster.js on purpose — the automation project stays fully
// isolated, this dashboard just needs the colors for its own UI. The real
// roster (for the picker dropdowns) is fetched live from the droplet.
const CHARACTER_COLORS: Record<string, string> = {
  Goku: '#FF8C00', Saitama: '#FFD400', Gojo: '#00BFFF', Superman: '#DC143C',
  Omniman: '#4682B4', Thanos: '#8B00FF', Thor: '#3FA9F5', Jiren: '#FF3B3B',
  Frieza: '#A020F0', Herobrine: '#39FF14', Sukuna: '#B22222', Zeno: '#87CEFA',
  Ichigo: '#FF4500', Luffy: '#FF0000', Zoro: '#228B22', Vegeta: '#4169E1',
  Kratos: '#8B0000', Naruto: '#FFA500', 'All Might': '#1E90FF', Beerus: '#9370DB',
}
function colorFor(name: string) {
  return CHARACTER_COLORS[name?.trim()] ?? '#67e8f9'
}

function msUntilNextRun(now: Date, cronFields: string | null) {
  // Only handles the simple "at HH:00 UTC" presets this dashboard offers —
  // good enough for a countdown display, not a general cron parser.
  const hour = cronFields ? Number(cronFields.split(/\s+/)[1]) : 9
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

// Slot-machine style: random digits that settle left-to-right into the real
// value, instead of just counting up numerically.
function useScramble(target: number, decimals = 2, durationMs = 800) {
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
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> In Combat — Rendering
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
  if (l.includes('uploaded') || l.includes('success') || l.includes('posted')) return 'text-emerald-400'
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-[10px] uppercase tracking-widest text-white/30">pipeline.log</span>
      </div>
      <div className="max-h-72 flex-1 overflow-y-auto p-3 text-[11px] leading-relaxed">
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
        <span className="inline-block h-3 w-1.5 translate-y-0.5 bg-cyan-400 animate-blink-cursor" />
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const color = colorFor(name)
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black"
      style={{ background: color, boxShadow: `0 0 8px ${color}99` }}
    >
      {initial}
    </span>
  )
}

function BattleLogPanel({ matchups }: { matchups: string[] }) {
  const items = [...matchups].reverse()
  return (
    <div className="h-full rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Battle Log</div>
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-white/30">No battles recorded yet</div>
      ) : (
        <div className="space-y-2">
          {items.map((pair, i) => {
            const [a, b] = pair.split(' vs ')
            return (
              <div key={i} className="flex items-center gap-2 rounded-md border border-white/5 bg-black/20 px-3 py-2 text-sm">
                <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-right font-bold" style={{ color: colorFor(a) }}>
                  {a}
                  <Avatar name={a} />
                </span>
                <span className="shrink-0 text-[10px] font-bold text-white/30">VS</span>
                <span className="flex flex-1 items-center gap-1.5 truncate font-bold" style={{ color: colorFor(b) }}>
                  <Avatar name={b} />
                  {b}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AlertsPanel({ alerts }: { alerts: { title: string; message: string; at: string }[] }) {
  return (
    <div className="h-full rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Alert History</div>
      {alerts.length === 0 ? (
        <div className="py-8 text-center text-xs text-white/30">No alerts — all clear</div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2">
              <div className="text-xs font-semibold text-amber-200">{a.title}</div>
              <div className="mt-0.5 line-clamp-2 text-[11px] text-white/50">{a.message}</div>
              <div className="mt-1 text-[10px] text-white/30">{relativeTime(a.at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModelStatsRow({ modelStats }: { modelStats: ModelStats }) {
  const entries = Object.entries(modelStats)
  if (entries.length === 0) return null
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      {entries.map(([model, s]) => (
        <div
          key={model}
          className={`rounded-lg border px-4 py-3 ${model === 'kling' ? 'border-fuchsia-400/30 bg-fuchsia-400/5' : 'border-cyan-400/30 bg-cyan-400/5'}`}
        >
          <div className={`text-[10px] font-bold uppercase tracking-widest ${model === 'kling' ? 'text-fuchsia-300' : 'text-cyan-300'}`}>
            {model} · {s.count} video{s.count === 1 ? '' : 's'}
          </div>
          <div className="mt-1 text-sm text-white/70">
            avg {formatNum(s.avgViews)} views · avg {s.avgLikes} likes
          </div>
        </div>
      ))}
    </div>
  )
}

const VIDEO_SORTS = [
  { key: 'recent', label: 'Recent' },
  { key: 'views', label: 'Top Views' },
  { key: 'engagement', label: 'Top Engagement' },
] as const
type VideoSort = (typeof VIDEO_SORTS)[number]['key']

function VideoGrid({
  videos,
  modelStats,
  notConfigured,
  unreachable,
  sort,
  onSortChange,
}: {
  videos: VideoItem[] | null
  modelStats: ModelStats
  notConfigured: boolean
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
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">Recent Deploys</div>
        <div className="flex gap-1.5">
          {VIDEO_SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => onSortChange(s.key)}
              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest transition-colors ${
                sort === s.key ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-white/40 hover:border-white/25'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {notConfigured || unreachable ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center text-xs text-white/30">
          📡 Live video stats unavailable{unreachable ? ' — droplet unreachable' : ''}
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
        <>
          <ModelStatsRow modelStats={modelStats} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((v) => (
              <a
                key={v.id}
                href={`https://youtube.com/shorts/${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/30 transition-colors hover:border-cyan-400/40"
              >
                {v.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail} alt={v.title} className="aspect-video w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
                )}
                <div className="p-3">
                  <div className="line-clamp-2 text-xs font-semibold text-white/80">{v.title}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/40">
                    <span>👁 {formatNum(v.views)}</span>
                    <span>❤ {formatNum(v.likes)}</span>
                    <span>💬 {formatNum(v.comments)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {v.model && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          v.model === 'kling' ? 'bg-fuchsia-400/20 text-fuchsia-300' : 'bg-cyan-400/20 text-cyan-300'
                        }`}
                      >
                        {v.model}
                      </span>
                    )}
                    {v.dryRun && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/50">dry run</span>}
                    <span className="text-[10px] text-white/30">{relativeTime(v.publishedAt)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function YTDashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [videos, setVideos] = useState<VideoItem[] | null>(null)
  const [modelStats, setModelStats] = useState<ModelStats>({})
  const [videosNotConfigured, setVideosNotConfigured] = useState(false)
  const [videosUnreachable, setVideosUnreachable] = useState(false)
  const [videoSort, setVideoSort] = useState<VideoSort>('recent')
  const [roster, setRoster] = useState<RosterCharacter[] | null>(null)
  const [charA, setCharA] = useState('')
  const [charB, setCharB] = useState('')
  const [dryRun, setDryRun] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [triggerState, setTriggerState] = useState<'idle' | 'confirm' | 'sending' | 'sent' | 'error'>('idle')
  const [pauseBusy, setPauseBusy] = useState(false)
  const [cronConfirmPreset, setCronConfirmPreset] = useState<string | null>(null)
  const [cronBusy, setCronBusy] = useState(false)
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cronConfirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mouse = useMouseGlow()

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/yt-dashboard/status', { cache: 'no-store' })
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
      const res = await fetch('/api/yt-dashboard/videos', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'failed')
      setVideos(data.videos ?? [])
      setModelStats(data.modelStats ?? {})
      setVideosNotConfigured(data.configured === false)
      setVideosUnreachable(false)
    } catch {
      setVideosUnreachable(true)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchVideos()
    fetch('/api/yt-dashboard/roster')
      .then((r) => r.json())
      .then((d) => setRoster(d.characters ?? []))
      .catch(() => setRoster([]))
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
    },
    []
  )

  const pickerIncomplete = (!!charA && !charB) || (!charA && !!charB)

  const handleTrigger = useCallback(async () => {
    if (pickerIncomplete) return
    if (triggerState === 'idle') {
      setTriggerState('confirm')
      confirmTimeout.current = setTimeout(() => setTriggerState('idle'), 4500)
      return
    }
    if (triggerState === 'confirm') {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      setTriggerState('sending')
      try {
        const res = await fetch('/api/yt-dashboard/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterA: charA || undefined, characterB: charB || undefined, dryRun }),
        })
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
  }, [triggerState, fetchStatus, pickerIncomplete, charA, charB, dryRun])

  const togglePause = useCallback(async () => {
    setPauseBusy(true)
    try {
      const endpoint = status?.automationPaused ? 'resume' : 'pause'
      const res = await fetch(`/api/yt-dashboard/${endpoint}`, { method: 'POST' })
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
        fetch('/api/yt-dashboard/cron', {
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

  const countdownMs = useMemo(() => msUntilNextRun(now, status?.cronFields ?? null), [now, status?.cronFields])
  const remainingDisplay = useScramble(status?.estimatedReplicateRemaining ?? 0, 2, 800)
  const battlesDisplay = useScramble(status?.recentMatchups.length ?? 0, 0, 600)

  const fuelPct = status ? Math.max(0, Math.min(100, (status.estimatedReplicateRemaining / status.replicateTotalLoaded) * 100)) : 0
  const fuelColor = fuelPct > 50 ? '#39ff14' : fuelPct > 20 ? '#ffd400' : '#ff3b3b'
  const modelDisplay = status?.lastModelUsed === 'kling' ? 'Kling v3' : status?.lastModelUsed === 'vidu' ? 'Vidu Q3 Pro' : status?.lastModelUsed ?? '—'
  const activeCronPreset = Object.entries(CRON_PRESETS).find(([, fields]) => fields === status?.cronFields)?.[0] ?? null

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#03040a] font-mono text-white selection:bg-cyan-500/30">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] animate-blob-float rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] animate-blob-float rounded-full bg-fuchsia-500/20 blur-[120px]" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] animate-blob-float rounded-full bg-amber-400/10 blur-[120px]" style={{ animationDelay: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_3px)]" />
        <div className="absolute left-0 right-0 h-24 animate-scan-sweep bg-gradient-to-b from-cyan-400/0 via-cyan-400/10 to-cyan-400/0" />
        <div className="absolute -right-24 -top-24 h-72 w-72 opacity-20">
          <div
            className="h-full w-full animate-radar-spin rounded-full"
            style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(34,211,238,0.7) 6%, transparent 18%)' }}
          />
        </div>
        <div
          className="absolute inset-0 transition-[background] duration-300"
          style={{ background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(34,211,238,0.06), transparent 40%)` }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-cyan-400/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)]" />
              {now.toUTCString().slice(17, 25)} UTC
            </div>
            <h1 className="animate-flicker-glow bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 bg-clip-text font-display text-4xl tracking-tight text-transparent [text-shadow:0_0_40px_rgba(34,211,238,0.35)] sm:text-6xl">
              POWERSCALE
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-white/40">Command Center</p>
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
              href="https://youtube.com/@powerscaleshorts"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-white/70 transition-colors hover:border-cyan-400/50 hover:text-cyan-300"
            >
              @powerscaleshorts ↗
            </a>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <HudTile label="Replicate Fuel" accent="#22d3ee" delayMs={0}>
            <div className="text-2xl font-bold tabular-nums text-cyan-300">${remainingDisplay}</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${fuelPct}%`, background: fuelColor, boxShadow: `0 0 10px ${fuelColor}` }} />
            </div>
            <div className="mt-1 text-[10px] text-white/30">of ${status?.replicateTotalLoaded ?? '—'} loaded</div>
          </HudTile>

          <HudTile label="Active Model" accent="#f472b6" delayMs={60}>
            <div className="text-lg font-bold uppercase text-fuchsia-300">{modelDisplay}</div>
            <div className="mt-2 flex gap-1.5">
              <span className={`h-1.5 flex-1 rounded-full ${status?.lastModelUsed === 'kling' ? 'bg-fuchsia-400 shadow-[0_0_8px_rgba(244,114,182,0.7)]' : 'bg-white/10'}`} />
              <span className={`h-1.5 flex-1 rounded-full ${status?.lastModelUsed === 'vidu' ? 'bg-fuchsia-400 shadow-[0_0_8px_rgba(244,114,182,0.7)]' : 'bg-white/10'}`} />
            </div>
            <div className="mt-1 text-[10px] text-white/30">Kling ⇄ Vidu rotation</div>
          </HudTile>

          <HudTile label="Next Auto-Launch" accent="#ffd400" delayMs={120}>
            <div className="text-2xl font-bold tabular-nums text-amber-300">{status?.automationPaused ? '—:—:—' : formatCountdown(countdownMs)}</div>
            <div className="mt-1 text-[10px] text-white/30">{status?.automationPaused ? 'paused' : status?.cronSchedule ?? '—'}</div>
          </HudTile>

          <HudTile label="Recent Battles" accent="#39ff14" delayMs={180}>
            <div className="text-2xl font-bold tabular-nums text-lime-300">{battlesDisplay}</div>
            <div className="mt-1 text-[10px] text-white/30">last 15 tracked</div>
          </HudTile>

          <HudTile label="Last Checked" accent="#94a3b8" delayMs={240}>
            <div className="text-sm font-bold text-white/70">{status ? relativeTime(status.checkedAt) : '—'}</div>
            <div className="mt-1 text-[10px] text-white/30">auto-refresh 15s</div>
          </HudTile>
        </div>

        <div className="mx-auto mt-8 max-w-xl rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Manual Launch Setup</div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={charA}
              onChange={(e) => setCharA(e.target.value)}
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80 outline-none focus:border-cyan-400/60"
            >
              <option value="">🎲 Random</option>
              {roster?.map((c) => (
                <option key={c.name} value={c.name} disabled={c.name === charB}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={charB}
              onChange={(e) => setCharB(e.target.value)}
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80 outline-none focus:border-cyan-400/60"
            >
              <option value="">🎲 Random</option>
              {roster?.map((c) => (
                <option key={c.name} value={c.name} disabled={c.name === charA}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="accent-cyan-400" />
            Dry run — upload unlisted for review, don&apos;t publish or comment
          </label>
          {pickerIncomplete && <p className="mt-2 text-[11px] text-amber-300/80">Pick both characters, or leave both on Random.</p>}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleTrigger}
            disabled={status?.lockActive || triggerState === 'sending' || pickerIncomplete}
            className={`relative overflow-hidden rounded-full px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all ${
              status?.lockActive || pickerIncomplete
                ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30'
                : triggerState === 'confirm'
                ? 'border border-amber-400 bg-amber-400/20 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
                : triggerState === 'sent'
                ? 'border border-emerald-400 bg-emerald-400/20 text-emerald-200'
                : triggerState === 'error'
                ? 'border border-red-400 bg-red-400/20 text-red-200'
                : 'border border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.35)] hover:scale-[1.03] hover:shadow-[0_0_45px_rgba(34,211,238,0.55)]'
            }`}
          >
            {status?.lockActive
              ? '🔒 Rendering In Progress'
              : triggerState === 'sending'
              ? 'Launching…'
              : triggerState === 'sent'
              ? '✅ Battle Launched'
              : triggerState === 'error'
              ? '⚠ Launch Failed — Retry'
              : triggerState === 'confirm'
              ? `Confirm? ~$0.60–$1.50 in render cost${dryRun ? ' (dry run)' : ''}`
              : dryRun
              ? '⚡ Launch Dry Run'
              : '⚡ Launch New Battle'}
          </button>
          {triggerState === 'confirm' && <p className="text-[11px] text-white/40">Click again within a few seconds to confirm</p>}
        </div>

        <div className="mx-auto mt-8 max-w-xl rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/40">
            <span>Posting Schedule</span>
            <span className="text-white/30">{status?.cronSchedule ?? '—'}</span>
          </div>
          <div className="flex gap-2">
            {Object.keys(CRON_PRESETS).map((preset) => {
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
                      ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                      : 'border-white/15 text-white/50 hover:border-white/30'
                  }`}
                >
                  {confirming ? 'Confirm?' : CRON_LABELS[preset]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-7">
          <div className="lg:col-span-2">
            <BattleLogPanel matchups={status?.recentMatchups ?? []} />
          </div>
          <div className="lg:col-span-3">
            <TerminalPanel lines={status?.lastLogLines ?? []} unreachable={!!statusError} />
          </div>
          <div className="lg:col-span-2">
            <AlertsPanel alerts={status?.recentAlerts ?? []} />
          </div>
        </div>

        <VideoGrid
          videos={videos}
          modelStats={modelStats}
          notConfigured={videosNotConfigured}
          unreachable={videosUnreachable}
          sort={videoSort}
          onSortChange={setVideoSort}
        />

        <footer className="mt-10 border-t border-white/10 pt-4 text-center text-[10px] uppercase tracking-widest text-white/20">
          channel {CHANNEL_ID} · droplet {DROPLET_LABEL} · {status?.cronSchedule ?? 'cron —'}
        </footer>
      </div>
    </div>
  )
}
