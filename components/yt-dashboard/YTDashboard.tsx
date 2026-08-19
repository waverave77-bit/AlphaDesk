'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Rewritten from scratch 2026-08-19. The backend contract is untouched —
// every type, endpoint, request body and response shape below is identical
// to the previous version. Only the presentation changed:
//   - One long scroll of ~10 always-visible panels became 4 named sections
//     (Launch / Queue / Library / System), so the thing you came to do is
//     never more than one click away.
//   - Render mode (3-clip vs 1-clip) became a property of ONE launch form
//     rather than two separate stacked forms with duplicate pickers — you
//     pick who fights, then pick how it renders.
//   - Dropped the decorative layer (floating blobs, scanlines, radar sweep,
//     cursor glow, digit scramble, typewriter log) — it was animation
//     competing with the data rather than communicating anything.

/* ------------------------------------------------------------------ types */

type StatusResponse = {
  lockActive: boolean
  automationPaused: boolean
  cronSchedule: string
  cronFields: string | null
  lastModelUsed: string
  viduBalanceUsd: number | null
  viduCreditsRemaining: number | null
  viduTotalLoaded: number
  recentMatchups: string[]
  recentAlerts: { title: string; message: string; at: string }[]
  lastLogLines: string[]
  queuedDraftsCount: number
  heldDraftsCount: number
  checkedAt: string
}

// The "paper trail" — real per-video reasoning (Gemini's justification for
// the pick, the posted description, the on-screen dialogue lines) that used
// to be generated and thrown away. Optional/nullable throughout since
// videos logged before this feature simply don't have it.
type PaperTrail = {
  justification?: string | null
  description?: string | null
  winnerLine?: string | null
  loserLine?: string | null
  setting?: string | null
  pickMethod?: string | null
}

// renderMode is 'multishot' (3 clips, reference images) or 'singleshot'
// (1 continuous clip, text only). The droplet derives it from the model
// name for videos logged before the field existed, so it's populated for
// the whole back catalogue — see renderModeOf() in statusServer.js.
type RenderMode = 'multishot' | 'singleshot'

type VideoItem = {
  id: string
  title: string
  thumbnail: string | null
  publishedAt: string
  views: number
  likes: number
  comments: number
  model: string | null
  renderMode: RenderMode | null
  dryRun: boolean
  // Sent by the droplet's /videos (getVideosCached) — a dry-run draft that
  // was later published counts as a real video, so the two flags together
  // are what distinguish "still an unlisted draft" from "went live".
  published: boolean
} & PaperTrail

type ModelStats = Record<
  string,
  { count: number; totalViews: number; totalLikes: number; totalComments: number; avgViews: number; avgLikes: number }
>

type DraftItem = {
  videoId: string
  model: string | null
  renderMode: RenderMode | null
  loserName: string
  title: string
  postedAt: string
  held: boolean
} & PaperTrail

type RosterCharacter = { name: string; franchise: string; themeColor: string }

type TriggerState = 'idle' | 'confirm' | 'sending' | 'sent' | 'error'
type LaunchMode = 'multi' | 'single'

/* -------------------------------------------------------------- constants */

const CHANNEL_ID = 'UCdz-4eCUd3VjAC0zvzjhgRQ'
const DROPLET_LABEL = '167.172.147.89:3001'

// Day-of-week portion only — the hour is independently configurable (see
// CRON_HOUR_PRESETS), matching statusServer.js's split of preset (day
// pattern) vs hour as two separately-settable fields.
const CRON_DAY_PATTERNS: Record<string, string> = { daily: '* * *', '3x-week': '* * 1,3,5', weekly: '* * 1' }
const CRON_LABELS: Record<string, string> = { daily: 'Daily', '3x-week': '3× / week', weekly: 'Weekly' }
// UTC offsets assume US Eastern Daylight Time (UTC-4, roughly Mar-Nov) —
// this is a small personal-project dashboard, not worth building real DST
// handling for; re-pick during EST months if it matters.
const CRON_HOUR_PRESETS: { label: string; hourUtc: number }[] = [
  { label: '9 AM', hourUtc: 13 },
  { label: '12 PM', hourUtc: 16 },
  { label: '3 PM', hourUtc: 19 },
  { label: '6 PM', hourUtc: 22 },
]

// Real confirmed costs from the droplet's own logged `credits` field:
// 3-clip multishot = 2s + 10s + 3s beats at 720p ≈ $0.90 total; 1-clip
// singleshot = one 15s call at 540p ≈ $0.68.
const MODE_INFO: Record<LaunchMode, { label: string; cost: string; blurb: string }> = {
  multi: {
    label: '3 clips',
    cost: '$0.90',
    blurb: 'Intro, fight and finish rendered separately, using each character’s reference image plus the setting’s background image. Sharper likenesses, better pacing.',
  },
  single: {
    label: '1 clip',
    cost: '$0.68',
    blurb: 'The original single continuous take, generated from text only — no reference images. Cheaper, but likenesses drift more.',
  },
}

// Short labels for the render modes, used on cards and in the comparison.
const RENDER_MODE_LABEL: Record<RenderMode, string> = { multishot: '3-clip', singleshot: '1-clip' }
const RENDER_MODE_COLOR: Record<RenderMode, string> = { multishot: '#22d3ee', singleshot: '#c084fc' }

// Sukuna is excluded from 1-clip specifically: he's the character with real
// "doesn't look right" comments on the channel ("Temu Sukuna") from before
// reference images existed, and 1-clip never uses a reference image.
const SINGLE_MODE_EXCLUDED = 'Sukuna'

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
  Mahoraga: '#8B7355', Garou: '#B0C4DE',
}
function colorFor(name: string) {
  return CHARACTER_COLORS[name?.trim()] ?? '#67e8f9'
}

/* ---------------------------------------------------------------- helpers */

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
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor(total % 60)
  return `${m}m ${s}s`
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

/* ------------------------------------------------------------- primitives */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/10 bg-white/[0.035] ${className}`}>{children}</div>
}

function CardTitle({ children, right, accent = '#22d3ee' }: { children: React.ReactNode; right?: React.ReactNode; accent?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white/90">
        <span className="h-3.5 w-1 rounded-full" style={{ background: accent }} />
        {children}
      </h2>
      {right}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/35">{children}</div>
}

function Chip({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn' | 'info'; children: React.ReactNode }) {
  const tones = {
    neutral: 'bg-white/10 text-white/50',
    good: 'bg-emerald-400/15 text-emerald-300',
    warn: 'bg-amber-400/15 text-amber-300',
    info: 'bg-cyan-400/15 text-cyan-300',
  }
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>{children}</span>
}

function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const color = colorFor(name)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black"
      style={{ background: color, width: size, height: size }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

/* ------------------------------------------------------------- status bar */

function StatusBadge({ lockActive, paused, unreachable }: { lockActive?: boolean; paused?: boolean; unreachable: boolean }) {
  const cfg = unreachable
    ? { dot: 'bg-red-400', ring: 'border-red-500/40 bg-red-500/10 text-red-300', text: 'Offline', pulse: true }
    : lockActive
    ? { dot: 'bg-amber-400', ring: 'border-amber-400/40 bg-amber-400/10 text-amber-300', text: 'Rendering', pulse: true }
    : paused
    ? { dot: 'bg-slate-400', ring: 'border-slate-400/40 bg-slate-400/10 text-slate-300', text: 'Paused', pulse: false }
    : { dot: 'bg-emerald-400', ring: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', text: 'Ready', pulse: false }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${cfg.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {cfg.text}
    </span>
  )
}

function StatStrip({ status, countdownMs }: { status: StatusResponse | null; countdownMs: number }) {
  const balance = status?.viduBalanceUsd
  const pct = balance != null && status ? Math.max(0, Math.min(100, (balance / status.viduTotalLoaded) * 100)) : 0
  const low = balance != null && balance < 2

  const items = [
    {
      label: 'Balance',
      icon: '◈',
      // Balance is the one stat that changes meaning as it drops, so its
      // accent tracks the value rather than being fixed like the others.
      accent: low ? '#f87171' : pct > 50 ? '#34d399' : '#fbbf24',
      value: balance != null ? `$${balance.toFixed(2)}` : '—',
      sub: status?.viduCreditsRemaining != null ? `${status.viduCreditsRemaining} credits left` : 'check failed',
      bar: pct,
    },
    {
      label: 'Next post',
      icon: '◷',
      accent: '#fbbf24',
      value: status?.automationPaused ? 'Paused' : formatCountdown(countdownMs),
      sub: status?.automationPaused ? 'automation off' : status?.cronSchedule ?? '—',
    },
    {
      label: 'In queue',
      icon: '▦',
      accent: '#22d3ee',
      value: `${status?.queuedDraftsCount ?? 0}`,
      sub: status?.heldDraftsCount ? `${status.heldDraftsCount} held back` : 'drafts ready to post',
    },
    {
      label: 'Synced',
      icon: '◉',
      accent: '#c084fc',
      value: status ? relativeTime(status.checkedAt) : '—',
      sub: 'refreshes every 15s',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="relative overflow-hidden rounded-xl border p-4 transition-colors"
          style={{ borderColor: `${it.accent}33`, background: `linear-gradient(160deg, ${it.accent}14, rgba(255,255,255,0.02) 55%)` }}
        >
          <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl" style={{ background: `${it.accent}40` }} />
          <div className="relative flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: it.accent }}>
            <span aria-hidden>{it.icon}</span>
            {it.label}
          </div>
          <div className="relative mt-1.5 text-2xl font-semibold tabular-nums text-white/95">{it.value}</div>
          {it.bar != null && (
            <div className="relative mt-2 h-1 w-full overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${it.bar}%`, background: it.accent, boxShadow: `0 0 8px ${it.accent}` }}
              />
            </div>
          )}
          <div className="relative mt-1.5 text-xs text-white/45">{it.sub}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------- launch section */

function LaunchPanel({
  roster,
  lockActive,
  state,
  onLaunch,
}: {
  roster: RosterCharacter[] | null
  lockActive: boolean
  state: TriggerState
  onLaunch: (mode: LaunchMode, a: string, b: string) => void
}) {
  const [mode, setMode] = useState<LaunchMode>('multi')
  const [charA, setCharA] = useState('')
  const [charB, setCharB] = useState('')

  // Mode is a rendering choice, not a different matchup — the picks carry
  // across when you switch. The one exception is the character 1-clip can't
  // render well, who gets cleared rather than silently sent anyway.
  const selectMode = (next: LaunchMode) => {
    setMode(next)
    if (next === 'single') {
      if (charA === SINGLE_MODE_EXCLUDED) setCharA('')
      if (charB === SINGLE_MODE_EXCLUDED) setCharB('')
    }
  }

  const options = useMemo(() => {
    if (!roster) return null
    return mode === 'single' ? roster.filter((c) => c.name !== SINGLE_MODE_EXCLUDED) : roster
  }, [roster, mode])

  const incomplete = (!!charA && !charB) || (!charA && !!charB)
  const info = MODE_INFO[mode]
  const disabled = lockActive || state === 'sending' || incomplete

  const buttonLabel = lockActive
    ? 'Rendering in progress…'
    : state === 'sending'
    ? 'Starting…'
    : state === 'sent'
    ? 'Started — check the Queue'
    : state === 'error'
    ? 'Failed — click to retry'
    : state === 'confirm'
    ? `Confirm — spend ${info.cost}`
    : `Generate ${info.label}`

  const buttonTone =
    disabled && !lockActive
      ? 'cursor-not-allowed bg-white/5 text-white/25'
      : lockActive
      ? 'cursor-not-allowed bg-white/5 text-white/30'
      : state === 'confirm'
      ? 'bg-amber-400 text-black hover:bg-amber-300'
      : state === 'sent'
      ? 'bg-emerald-400 text-black'
      : state === 'error'
      ? 'bg-red-400 text-black hover:bg-red-300'
      : 'bg-cyan-400 text-black hover:bg-cyan-300'

  return (
    <Card className="p-5">
      <CardTitle
        right={
          <div className="flex rounded-lg border border-white/10 bg-black/30 p-0.5">
            {(['multi', 'single'] as LaunchMode[]).map((m) => (
              <button
                key={m}
                onClick={() => selectMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === m ? 'bg-cyan-400/20 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.4)]' : 'text-white/45 hover:text-white/75'
                }`}
              >
                {MODE_INFO[m].label}
              </button>
            ))}
          </div>
        }
      >
        New battle
      </CardTitle>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <select
            value={charA}
            onChange={(e) => setCharA(e.target.value)}
            className="w-full rounded-lg border bg-black/40 px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-cyan-400/60"
            style={charA ? { borderColor: `${colorFor(charA)}88`, color: colorFor(charA) } : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}
          >
            <option value="" style={{ color: '#fff' }}>
              Random
            </option>
            {options?.map((c) => (
              <option key={c.name} value={c.name} disabled={c.name === charB} style={{ color: '#fff' }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <span className="shrink-0 text-xs font-bold text-white/30">VS</span>
        <div className="min-w-0 flex-1">
          <select
            value={charB}
            onChange={(e) => setCharB(e.target.value)}
            className="w-full rounded-lg border bg-black/40 px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-cyan-400/60"
            style={charB ? { borderColor: `${colorFor(charB)}88`, color: colorFor(charB) } : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}
          >
            <option value="" style={{ color: '#fff' }}>
              Random
            </option>
            {options?.map((c) => (
              <option key={c.name} value={c.name} disabled={c.name === charA} style={{ color: '#fff' }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/40">{info.blurb}</p>
      {mode === 'single' && (
        <p className="mt-1.5 text-xs text-white/30">{SINGLE_MODE_EXCLUDED} is left out here — his likeness needs a reference image.</p>
      )}
      {incomplete && <p className="mt-2 text-xs text-amber-300/90">Pick both fighters, or leave both on Random.</p>}

      <button
        onClick={() => onLaunch(mode, charA, charB)}
        disabled={disabled}
        className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${buttonTone}`}
      >
        {buttonLabel}
      </button>

      <p className="mt-2.5 text-center text-xs text-white/30">
        {state === 'confirm'
          ? 'Click again to confirm — this spends real money.'
          : 'Saves as an unlisted draft. Nothing goes public until you publish it or the next scheduled run picks it up.'}
      </p>
    </Card>
  )
}

/* ----------------------------------------------------------- queue section */

function PaperTrailBody({ item }: { item: PaperTrail }) {
  const rows: { label: string; value: string }[] = []
  if (item.pickMethod) rows.push({ label: 'Picked by', value: item.pickMethod })
  if (item.setting) rows.push({ label: 'Setting', value: item.setting })
  if (item.justification) rows.push({ label: 'Reasoning', value: item.justification })
  if (item.description) rows.push({ label: 'Description', value: item.description })
  if (item.winnerLine) rows.push({ label: 'Winner line', value: `“${item.winnerLine}”` })
  if (item.loserLine) rows.push({ label: 'Loser line', value: `“${item.loserLine}”` })

  if (rows.length === 0) {
    return <div className="mt-2 rounded-lg bg-black/40 p-3 text-xs text-white/30">No paper trail — posted before this was recorded.</div>
  }
  return (
    <div className="mt-2 space-y-2.5 rounded-lg bg-black/40 p-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300/60">{r.label}</div>
          <div className="mt-0.5 text-xs leading-snug text-white/65">{r.value}</div>
        </div>
      ))}
    </div>
  )
}

function DraftCard({
  d,
  position,
  publishing,
  confirming,
  holdBusy,
  onPublishClick,
  onHold,
  dragging,
  onDragStart,
  onDragOverCard,
  onDropCard,
  onDragEnd,
}: {
  d: DraftItem
  // 1-based slot in the posting queue, or null for held drafts (which have
  // no slot — getNextQueuedDraft on the droplet skips them entirely).
  position: number | null
  publishing: boolean
  confirming: boolean
  holdBusy: boolean
  onPublishClick: () => void
  onHold: () => void
  dragging: boolean
  onDragStart: () => void
  onDragOverCard: (e: React.DragEvent<HTMLDivElement>) => void
  onDropCard: () => void
  onDragEnd: () => void
}) {
  const [open, setOpen] = useState(false)
  const queued = position != null
  const isNext = position === 1
  return (
    <div
      draggable={queued}
      onDragStart={onDragStart}
      onDragOver={onDragOverCard}
      onDrop={onDropCard}
      onDragEnd={onDragEnd}
      className={`relative overflow-hidden rounded-xl border transition-opacity ${dragging ? 'opacity-30' : queued ? '' : 'opacity-60'} ${
        isNext ? 'border-emerald-400/50 bg-emerald-400/[0.06]' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
      }`}
    >
      {queued && (
        <span
          className={`absolute left-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
            isNext ? 'bg-emerald-400 text-black' : 'bg-black/75 text-white/70'
          }`}
          title={isNext ? 'Posts on the next scheduled run' : `Slot ${position} in the queue`}
        >
          {position}
        </span>
      )}
      <a href={`https://youtube.com/shorts/${d.videoId}`} target="_blank" rel="noopener noreferrer" draggable={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${d.videoId}/mqdefault.jpg`} alt={d.title} className="aspect-video w-full object-cover" />
      </a>
      <div className="p-3">
        <div className="flex items-start gap-2">
          {queued && (
            <span className="mt-0.5 cursor-grab select-none text-white/25 active:cursor-grabbing" title="Drag to reorder">
              ⠿
            </span>
          )}
          <div className="line-clamp-2 flex-1 text-xs font-medium leading-snug text-white/80">{d.title}</div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {isNext && <Chip tone="good">next up</Chip>}
          {d.renderMode && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: RENDER_MODE_COLOR[d.renderMode], background: `${RENDER_MODE_COLOR[d.renderMode]}26` }}
            >
              {RENDER_MODE_LABEL[d.renderMode]}
            </span>
          )}
          <span className="text-xs text-white/30">{relativeTime(d.postedAt)}</span>
        </div>

        <div className="mt-3 flex gap-1.5">
          <button
            onClick={onPublishClick}
            disabled={publishing}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
              confirming ? 'bg-amber-400 text-black' : 'bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'
            }`}
          >
            {publishing ? 'Publishing…' : confirming ? 'Confirm?' : 'Publish now'}
          </button>
          <button
            onClick={onHold}
            disabled={holdBusy}
            className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 disabled:opacity-40"
            title={d.held ? 'Put back in the queue' : 'Keep this out of the queue'}
          >
            {holdBusy ? '…' : d.held ? 'Requeue' : 'Hold'}
          </button>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-1.5 w-full rounded-lg px-2 py-1 text-[11px] font-medium text-white/35 transition-colors hover:bg-white/5 hover:text-white/60"
        >
          {open ? 'Hide details' : 'Details'}
        </button>
        {open && <PaperTrailBody item={d} />}
      </div>
    </div>
  )
}

function QueueSection({
  drafts,
  publishingId,
  onPublish,
  holdBusyId,
  onHold,
  onReorder,
}: {
  drafts: DraftItem[]
  publishingId: string | null
  onPublish: (videoId: string) => void
  holdBusyId: string | null
  onHold: (videoId: string, held: boolean) => void
  onReorder: (videoIds: string[]) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [order, setOrder] = useState<string[]>(() => drafts.map((d) => d.videoId))
  const [dragId, setDragId] = useState<string | null>(null)

  // Resync local drag order only when the actual SET of draft ids changes
  // (publish/hold/a fresh draft altered membership) — keying on the joined
  // id list rather than the drafts array itself means a background 30s
  // refetch that returns the same ids in the same order doesn't fight an
  // in-progress or just-completed drag.
  const idsKey = drafts.map((d) => d.videoId).join(',')
  useEffect(() => {
    setOrder(drafts.map((d) => d.videoId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  useEffect(
    () => () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
    },
    []
  )

  function handleClick(videoId: string) {
    if (confirmId === videoId) {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      setConfirmId(null)
      onPublish(videoId)
      return
    }
    setConfirmId(videoId)
    confirmTimeout.current = setTimeout(() => setConfirmId(null), 4000)
  }

  function handleDrop(targetId: string) {
    const draggedId = dragId
    setDragId(null)
    if (!draggedId || draggedId === targetId) return
    const from = order.indexOf(draggedId)
    const to = order.indexOf(targetId)
    if (from === -1 || to === -1) return
    const next = [...order]
    next.splice(from, 1)
    next.splice(to, 0, draggedId)
    setOrder(next)
    onReorder(next)
  }

  const byId = new Map(drafts.map((d) => [d.videoId, d]))
  const ordered = order.map((id) => byId.get(id)).filter((d): d is DraftItem => !!d)
  // Two genuinely different things that were previously mixed into one grid:
  // what the next scheduled run will actually post (in order), and what's
  // been deliberately parked. `order` still holds every id so reordering
  // keeps sending the droplet a complete list, exactly as before.
  const queued = ordered.filter((d) => !d.held)
  const held = ordered.filter((d) => d.held)

  const card = (d: DraftItem, position: number | null) => (
    <DraftCard
      key={d.videoId}
      d={d}
      position={position}
      publishing={publishingId === d.videoId}
      confirming={confirmId === d.videoId}
      holdBusy={holdBusyId === d.videoId}
      onPublishClick={() => handleClick(d.videoId)}
      onHold={() => onHold(d.videoId, !d.held)}
      dragging={dragId === d.videoId}
      onDragStart={() => setDragId(d.videoId)}
      onDragOverCard={(e) => e.preventDefault()}
      onDropCard={() => handleDrop(d.videoId)}
      onDragEnd={() => setDragId(null)}
    />
  )

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CardTitle
          accent="#34d399"
          right={queued.length > 1 ? <span className="text-xs text-white/35">Drag to reorder</span> : undefined}
        >
          Posting queue
          <span className="ml-1.5 font-normal text-white/35">({queued.length})</span>
        </CardTitle>
        {queued.length === 0 ? (
          <Empty>
            Nothing waiting to post. The next scheduled run will generate a fresh video instead.
          </Empty>
        ) : (
          <>
            <p className="mb-4 text-xs text-white/40">
              Unlisted until they post. The next scheduled run takes <span className="text-emerald-300/80">#1</span>, then works down.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{queued.map((d, i) => card(d, i + 1))}</div>
          </>
        )}
      </Card>

      {held.length > 0 && (
        <Card className="p-5">
          <CardTitle accent="#94a3b8">
            Held back
            <span className="ml-1.5 font-normal text-white/35">({held.length})</span>
          </CardTitle>
          <p className="mb-4 text-xs text-white/40">
            Parked — these never post automatically. Requeue one to put it back in line, or publish it directly.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{held.map((d) => card(d, null))}</div>
        </Card>
      )}
    </div>
  )
}

/* --------------------------------------------------------- library section */

const VIDEO_SORTS = [
  { key: 'recent', label: 'Recent' },
  { key: 'views', label: 'Views' },
  { key: 'engagement', label: 'Engagement' },
] as const
type VideoSort = (typeof VIDEO_SORTS)[number]['key']

function VideoCard({ v }: { v: VideoItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20">
      <a href={`https://youtube.com/shorts/${v.id}`} target="_blank" rel="noopener noreferrer" className="block">
        {v.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.thumbnail} alt={v.title} className="aspect-video w-full object-cover" />
        )}
      </a>
      <div className="p-3">
        <a
          href={`https://youtube.com/shorts/${v.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 block text-xs font-medium leading-snug text-white/80 hover:text-cyan-200"
        >
          {v.title}
        </a>
        <div className="mt-2 flex items-center gap-3 text-xs tabular-nums text-white/45">
          <span title="views">👁 {formatNum(v.views)}</span>
          <span title="likes">♥ {formatNum(v.likes)}</span>
          <span title="comments">💬 {formatNum(v.comments)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {v.renderMode && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: RENDER_MODE_COLOR[v.renderMode], background: `${RENDER_MODE_COLOR[v.renderMode]}26` }}
            >
              {RENDER_MODE_LABEL[v.renderMode]}
            </span>
          )}
          {v.dryRun && <Chip>unlisted</Chip>}
          <span className="text-xs text-white/30">{relativeTime(v.publishedAt)}</span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-2 w-full rounded-lg px-2 py-1 text-[11px] font-medium text-white/35 transition-colors hover:bg-white/5 hover:text-white/60"
        >
          {open ? 'Hide details' : 'Details'}
        </button>
        {open && <PaperTrailBody item={v} />}
      </div>
    </div>
  )
}

function medianDaysOld(videos: VideoItem[]) {
  if (videos.length === 0) return null
  const days = videos
    .map((v) => (Date.now() - new Date(v.publishedAt).getTime()) / 86_400_000)
    .sort((a, b) => a - b)
  return days[Math.floor(days.length / 2)]
}

// 3-clip vs 1-clip head-to-head. Deliberately shows sample size and age
// alongside the averages: at the time this was built the 3-clip videos were
// ~1 day old and the 1-clip ones a median of 16 days, so raw average views
// made 3-clip look far worse purely because it had had less time to
// accumulate. Presenting the averages alone would have been misleading.
function FormatComparison({ videos, stats }: { videos: VideoItem[]; stats: ModelStats }) {
  const modes: RenderMode[] = ['multishot', 'singleshot']
  const present = modes.filter((m) => stats[m]?.count)
  if (present.length === 0) return null

  const ages = Object.fromEntries(
    modes.map((m) => [m, medianDaysOld(videos.filter((v) => v.renderMode === m && !(v.dryRun && !v.published)))])
  ) as Record<RenderMode, number | null>

  const best = Math.max(...present.map((m) => stats[m].avgViews))
  const leader = present.length === 2 ? present.reduce((a, b) => (stats[a].avgViews >= stats[b].avgViews ? a : b)) : null

  // Only call a winner when both sides have a few videos AND comparable
  // maturity — otherwise say plainly that it's too early.
  const youngest = Math.min(...present.map((m) => ages[m] ?? 0))
  const oldest = Math.max(...present.map((m) => ages[m] ?? 0))
  const thinSample = present.some((m) => stats[m].count < 4)
  const ageSkewed = present.length === 2 && oldest > 5 && youngest < oldest / 3
  const inconclusive = thinSample || ageSkewed

  return (
    <Card className="p-5">
      <CardTitle accent="#22d3ee">Format performance — 3-clip vs 1-clip</CardTitle>
      <div className="space-y-3">
        {present.map((m) => {
          const s = stats[m]
          const pct = best > 0 ? Math.max(4, (s.avgViews / best) * 100) : 4
          const age = ages[m]
          return (
            <div key={m}>
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: RENDER_MODE_COLOR[m] }}>
                  {RENDER_MODE_LABEL[m]}
                  {!inconclusive && leader === m && <Chip tone="good">ahead</Chip>}
                </span>
                <span className="text-xs tabular-nums text-white/45">
                  {formatNum(s.avgViews)} avg views · {s.avgLikes} avg likes
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${pct}%`, background: RENDER_MODE_COLOR[m] }}
                />
              </div>
              <div className="mt-1 text-xs text-white/35">
                {s.count} video{s.count === 1 ? '' : 's'}
                {age != null && ` · median ${age < 1 ? 'under a day' : `${Math.round(age)} day${Math.round(age) === 1 ? '' : 's'}`} old`}
              </div>
            </div>
          )
        })}
      </div>

      {inconclusive && (
        <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-amber-200/90">
          Too early to call.{' '}
          {ageSkewed
            ? 'The newer format hasn’t had the same time to pick up views, so comparing averages now favours whichever format is older.'
            : 'One format still has very few videos — a single outlier moves the average a lot.'}
        </p>
      )}
    </Card>
  )
}

function LibrarySection({
  videos,
  modelStats,
  renderModeStats,
  topPerformers,
  notConfigured,
  unreachable,
}: {
  videos: VideoItem[] | null
  modelStats: ModelStats
  renderModeStats: ModelStats
  topPerformers: string[]
  notConfigured: boolean
  unreachable: boolean
}) {
  const [sort, setSort] = useState<VideoSort>('recent')
  const [query, setQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState<RenderMode | 'all'>('all')

  const shown = useMemo(() => {
    if (!videos) return null
    let arr = [...videos]
    const q = query.trim().toLowerCase()
    if (q) arr = arr.filter((v) => v.title.toLowerCase().includes(q))
    if (formatFilter !== 'all') arr = arr.filter((v) => v.renderMode === formatFilter)
    if (sort === 'views') arr.sort((a, b) => b.views - a.views)
    else if (sort === 'engagement') arr.sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
    else arr.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    return arr
  }, [videos, sort, query, formatFilter])

  const modelEntries = Object.entries(modelStats)

  return (
    <div className="space-y-4">
      {videos && <FormatComparison videos={videos} stats={renderModeStats} />}

      {(modelEntries.length > 0 || topPerformers.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {modelEntries.length > 0 && (
            <Card className="p-5">
              <CardTitle accent="#c084fc">Model performance</CardTitle>
              <div className="space-y-2">
                {modelEntries.map(([model, s]) => (
                  <div key={model} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Chip tone="info">{model}</Chip>
                      <span className="text-xs text-white/40">
                        {s.count} video{s.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="text-xs tabular-nums text-white/65">
                      {formatNum(s.avgViews)} avg views · {s.avgLikes} avg likes
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {topPerformers.length > 0 && (
            <Card className="p-5">
              <CardTitle accent="#34d399">Top characters</CardTitle>
              <div className="flex flex-wrap gap-2">
                {topPerformers.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                    style={{ borderColor: `${colorFor(name)}66`, color: colorFor(name) }}
                  >
                    <Avatar name={name} size={16} />
                    {name}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/35">
                Pulled from your top 3 videos by views — the idea generator is told to lean into these.
              </p>
            </Card>
          )}
        </div>
      )}

      <Card className="p-5">
        <CardTitle
          right={
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-28 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white/75 outline-none transition-colors placeholder:text-white/25 focus:border-cyan-400/50 sm:w-40"
              />
              <div className="flex rounded-lg border border-white/10 bg-black/30 p-0.5">
                {VIDEO_SORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      sort === s.key ? 'bg-white/15 text-white/95' : 'text-white/45 hover:text-white/75'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          Published videos
        </CardTitle>

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {([['all', 'All formats'], ['multishot', '3-clip'], ['singleshot', '1-clip']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFormatFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                formatFilter === key ? 'bg-white/15 text-white/95' : 'bg-white/5 text-white/45 hover:text-white/75'
              }`}
              style={formatFilter === key && key !== 'all' ? { color: RENDER_MODE_COLOR[key], background: `${RENDER_MODE_COLOR[key]}22` } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {notConfigured || unreachable ? (
          <Empty>Live stats unavailable{unreachable ? ' — can’t reach the droplet' : ''}</Empty>
        ) : shown === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <Empty>{query ? `Nothing matches “${query}”` : 'No videos published yet'}</Empty>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ---------------------------------------------------------- system section */

function lineTone(line: string) {
  const l = line.toLowerCase()
  if (l.includes('error') || l.includes('fail')) return 'text-red-400'
  if (l.includes('uploaded') || l.includes('success') || l.includes('posted') || l.includes('done')) return 'text-emerald-400'
  return 'text-white/45'
}

function SystemSection({
  status,
  statusError,
  activeCronPreset,
  activeCronHourUtc,
  cronBusy,
  cronConfirmPreset,
  cronConfirmHour,
  onCronPreset,
  onCronHour,
}: {
  status: StatusResponse | null
  statusError: string | null
  activeCronPreset: string | null
  activeCronHourUtc: number | null
  cronBusy: boolean
  cronConfirmPreset: string | null
  cronConfirmHour: number | null
  onCronPreset: (p: string) => void
  onCronHour: (h: number) => void
}) {
  const logRef = useRef<HTMLDivElement>(null)
  // Memoised so the `?? []` fallback doesn't mint a fresh array on every
  // render and re-fire the auto-scroll effect below on renders where the log
  // didn't actually change.
  const lines = useMemo(() => status?.lastLogLines ?? [], [status?.lastLogLines])

  useEffect(() => {
    // Scroll only this panel's own log, not the page — scrollIntoView() walks
    // up every scrollable ancestor including the window, which used to yank
    // the whole dashboard back up on every 15s status poll.
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const alerts = status?.recentAlerts ?? []
  const matchups = [...(status?.recentMatchups ?? [])].reverse().slice(0, 8)

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CardTitle accent="#fbbf24" right={<span className="text-xs text-white/35">{status?.cronSchedule ?? '—'}</span>}>Posting schedule</CardTitle>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">How often</div>
        <div className="flex gap-2">
          {Object.keys(CRON_DAY_PATTERNS).map((preset) => {
            const active = activeCronPreset === preset
            const confirming = cronConfirmPreset === preset
            return (
              <button
                key={preset}
                onClick={() => onCronPreset(preset)}
                disabled={cronBusy}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
                  confirming ? 'bg-amber-400 text-black' : active ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {confirming ? 'Confirm?' : CRON_LABELS[preset]}
              </button>
            )
          })}
        </div>

        <div className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-white/40">What time (ET)</div>
        <div className="flex gap-2">
          {CRON_HOUR_PRESETS.map(({ label, hourUtc }) => {
            const active = activeCronHourUtc === hourUtc
            const confirming = cronConfirmHour === hourUtc
            return (
              <button
                key={hourUtc}
                onClick={() => onCronHour(hourUtc)}
                disabled={cronBusy}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
                  confirming ? 'bg-amber-400 text-black' : active ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {confirming ? 'Confirm?' : label}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-white/35">Click a button twice to change it — a bad edit here silently stops all future posting.</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="text-sm font-semibold text-white/85">Pipeline log</span>
            <span className="font-mono text-[10px] text-white/25">{DROPLET_LABEL}</span>
          </div>
          <div ref={logRef} className="max-h-64 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
            {statusError ? (
              <div className="text-red-400/70">Can’t reach the droplet — log unavailable</div>
            ) : lines.length === 0 ? (
              <div className="text-white/25">Waiting for output…</div>
            ) : (
              lines.map((line, i) => (
                <div key={`${i}-${line}`} className={lineTone(line)}>
                  {line}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle accent="#fbbf24">Alerts</CardTitle>
          {alerts.length === 0 ? (
            <Empty>No alerts — all clear</Empty>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 4).map((a, i) => (
                <div key={i} className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-xs font-semibold text-amber-200">{a.title}</div>
                    <div className="shrink-0 text-[10px] text-white/30">{relativeTime(a.at)}</div>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-white/50">{a.message}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <CardTitle accent="#f472b6">Recent matchups</CardTitle>
        {matchups.length === 0 ? (
          <Empty>No battles recorded yet</Empty>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {matchups.map((pair, i) => {
              const [a, b] = pair.split(' vs ')
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-black/25 px-3 py-2 text-sm">
                  <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-right font-medium" style={{ color: colorFor(a) }}>
                    {a}
                    <Avatar name={a} size={18} />
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-white/25">VS</span>
                  <span className="flex flex-1 items-center gap-1.5 truncate font-medium" style={{ color: colorFor(b) }}>
                    <Avatar name={b} size={18} />
                    {b}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------- page */

const SECTIONS = [
  { key: 'launch', label: 'Launch' },
  { key: 'queue', label: 'Queue' },
  { key: 'library', label: 'Library' },
  { key: 'system', label: 'System' },
] as const
type SectionKey = (typeof SECTIONS)[number]['key']

export default function YTDashboard() {
  const [section, setSection] = useState<SectionKey>('launch')

  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [videos, setVideos] = useState<VideoItem[] | null>(null)
  const [modelStats, setModelStats] = useState<ModelStats>({})
  const [renderModeStats, setRenderModeStats] = useState<ModelStats>({})
  const [topPerformers, setTopPerformers] = useState<string[]>([])
  const [videosNotConfigured, setVideosNotConfigured] = useState(false)
  const [videosUnreachable, setVideosUnreachable] = useState(false)
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null)
  const [holdBusyId, setHoldBusyId] = useState<string | null>(null)
  const [roster, setRoster] = useState<RosterCharacter[] | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [triggerState, setTriggerState] = useState<TriggerState>('idle')
  const [pauseBusy, setPauseBusy] = useState(false)
  const [cronConfirmPreset, setCronConfirmPreset] = useState<string | null>(null)
  const [cronConfirmHour, setCronConfirmHour] = useState<number | null>(null)
  const [cronBusy, setCronBusy] = useState(false)

  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cronConfirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cronConfirmHourTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      setRenderModeStats(data.renderModeStats ?? {})
      setTopPerformers(data.topPerformers ?? [])
      setVideosNotConfigured(data.configured === false)
      setVideosUnreachable(false)
    } catch {
      setVideosUnreachable(true)
    }
  }, [])

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/yt-dashboard/drafts', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setDrafts(data.drafts ?? [])
    } catch {
      // silent — drafts are a nice-to-have panel, not worth a whole error state
    }
  }, [])

  const publishDraft = useCallback(
    async (videoId: string) => {
      setPublishingDraftId(videoId)
      try {
        const res = await fetch('/api/yt-dashboard/drafts/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        })
        if (res.ok) {
          await fetchDrafts()
          fetchVideos()
        }
      } finally {
        setPublishingDraftId(null)
      }
    },
    [fetchDrafts, fetchVideos]
  )

  const holdDraft = useCallback(
    async (videoId: string, held: boolean) => {
      setHoldBusyId(videoId)
      try {
        const res = await fetch('/api/yt-dashboard/drafts/hold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, held }),
        })
        if (res.ok) {
          await fetchDrafts()
          fetchStatus()
        }
      } finally {
        setHoldBusyId(null)
      }
    },
    [fetchDrafts, fetchStatus]
  )

  // No busy/confirm state here on purpose — QueueSection already applies the
  // new order optimistically the instant a card is dropped, so this just
  // needs to persist it. fetchDrafts() afterward reconciles with the
  // authoritative (queueOrder-sorted) order from the droplet.
  const reorderDrafts = useCallback(
    async (videoIds: string[]) => {
      try {
        await fetch('/api/yt-dashboard/drafts/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds }),
        })
      } finally {
        fetchDrafts()
      }
    },
    [fetchDrafts]
  )

  useEffect(() => {
    fetchStatus()
    fetchVideos()
    fetchDrafts()
    fetch('/api/yt-dashboard/roster')
      .then((r) => r.json())
      .then((d) => setRoster(d.characters ?? []))
      .catch(() => setRoster([]))
    const statusInterval = setInterval(fetchStatus, 15000)
    const videosInterval = setInterval(fetchVideos, 60000)
    const draftsInterval = setInterval(fetchDrafts, 30000)
    const clockInterval = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(statusInterval)
      clearInterval(videosInterval)
      clearInterval(draftsInterval)
      clearInterval(clockInterval)
    }
  }, [fetchStatus, fetchVideos, fetchDrafts])

  useEffect(
    () => () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      if (cronConfirmTimeout.current) clearTimeout(cronConfirmTimeout.current)
      if (cronConfirmHourTimeout.current) clearTimeout(cronConfirmHourTimeout.current)
    },
    []
  )

  // One handler for both render modes — only the renderMode in the body
  // differs. 'singleshot' forces the old single-clip text2video path;
  // omitting renderMode lets the droplet use its default (multishot when the
  // matchup is eligible). See matchup-shorts/src/runPipeline.js.
  const launch = useCallback(
    async (mode: LaunchMode, charA: string, charB: string) => {
      if (triggerState === 'idle' || triggerState === 'error') {
        setTriggerState('confirm')
        confirmTimeout.current = setTimeout(() => setTriggerState('idle'), 4500)
        return
      }
      if (triggerState !== 'confirm') return
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current)
      setTriggerState('sending')
      try {
        const res = await fetch('/api/yt-dashboard/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterA: charA || undefined,
            characterB: charB || undefined,
            renderMode: mode === 'single' ? 'singleshot' : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? 'failed')
        setTriggerState('sent')
        setTimeout(() => setTriggerState('idle'), 3000)
        fetchStatus()
        fetchDrafts()
      } catch {
        setTriggerState('error')
        setTimeout(() => setTriggerState('idle'), 4000)
      }
    },
    [triggerState, fetchStatus, fetchDrafts]
  )

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

  const requestCronHourChange = useCallback(
    (hourUtc: number) => {
      if (cronConfirmHour === hourUtc) {
        if (cronConfirmHourTimeout.current) clearTimeout(cronConfirmHourTimeout.current)
        setCronConfirmHour(null)
        setCronBusy(true)
        fetch('/api/yt-dashboard/cron', {
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

  // cronFields is "0 <hour> <dom> <month> <dow>" — day pattern is always
  // "* * <dow>" (dom/month never used), matching CRON_DAY_PATTERNS' shape.
  const cronParts = status?.cronFields?.trim().split(/\s+/) ?? null
  const activeCronPreset = cronParts
    ? Object.entries(CRON_DAY_PATTERNS).find(([, p]) => p === `* * ${cronParts[4]}`)?.[0] ?? null
    : null
  const activeCronHourUtc = cronParts ? Number(cronParts[1]) : null

  const queueCount = drafts.filter((d) => !d.held).length
  const alertCount = status?.recentAlerts.length ?? 0

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#08090f] text-white/90 antialiased selection:bg-cyan-500/30">
      {/* One soft colour wash behind the header — enough to keep the page
          from reading as flat grey, without the animated blob field the
          previous version had competing with the content. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="absolute -top-24 right-1/4 h-56 w-[30rem] translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              PowerScale
            </h1>
            <p className="mt-0.5 text-xs text-white/45">
              {now.toUTCString().slice(17, 22)} UTC · autopilot for @powerscaleshorts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge lockActive={status?.lockActive} paused={status?.automationPaused} unreachable={!!statusError} />
            <button
              onClick={togglePause}
              disabled={pauseBusy || !status}
              className="rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white/95 disabled:opacity-40"
            >
              {status?.automationPaused ? 'Resume' : 'Pause'}
            </button>
            <a
              href="https://youtube.com/@powerscaleshorts"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-cyan-300"
            >
              Channel ↗
            </a>
          </div>
        </header>

        {/* at-a-glance numbers */}
        <div className="mt-6">
          <StatStrip status={status} countdownMs={countdownMs} />
        </div>

        {/* section nav */}
        <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {SECTIONS.map((s) => {
            const badge = s.key === 'queue' ? queueCount : s.key === 'system' ? alertCount : 0
            const active = section === s.key
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  active
                    ? 'bg-gradient-to-b from-cyan-400/25 to-cyan-400/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]'
                    : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                {s.label}
                {badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                      s.key === 'system' ? 'bg-amber-400/20 text-amber-300' : 'bg-cyan-400/20 text-cyan-300'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* section body */}
        <main className="mt-4">
          {section === 'launch' && (
            <div className="mx-auto max-w-xl">
              <LaunchPanel roster={roster} lockActive={!!status?.lockActive} state={triggerState} onLaunch={launch} />
            </div>
          )}

          {section === 'queue' && (
            <QueueSection
              drafts={drafts}
              publishingId={publishingDraftId}
              onPublish={publishDraft}
              holdBusyId={holdBusyId}
              onHold={holdDraft}
              onReorder={reorderDrafts}
            />
          )}

          {section === 'library' && (
            <LibrarySection
              videos={videos}
              modelStats={modelStats}
              renderModeStats={renderModeStats}
              topPerformers={topPerformers}
              notConfigured={videosNotConfigured}
              unreachable={videosUnreachable}
            />
          )}

          {section === 'system' && (
            <SystemSection
              status={status}
              statusError={statusError}
              activeCronPreset={activeCronPreset}
              activeCronHourUtc={activeCronHourUtc}
              cronBusy={cronBusy}
              cronConfirmPreset={cronConfirmPreset}
              cronConfirmHour={cronConfirmHour}
              onCronPreset={requestCronChange}
              onCronHour={requestCronHourChange}
            />
          )}
        </main>

        <footer className="mt-10 border-t border-white/10 pt-4 text-center font-mono text-[10px] text-white/20">
          {CHANNEL_ID} · {DROPLET_LABEL} · {status?.cronSchedule ?? 'cron —'}
        </footer>
      </div>
    </div>
  )
}
