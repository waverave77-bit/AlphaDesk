'use client'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Sparkles, TrendingUp, BookOpen, Newspaper, BarChart2, ChevronRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
import Link from 'next/link'

// ── Mr. Guy pixel head (canvas) ───────────────────────────────────────────────
const N = null
const HEAD_PIXELS: Array<Array<string|null>> = [
  [N,    N,    '#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',N      ],
  [N,    '#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [N,    '#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N      ],
  [N,    '#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,    N      ],
  [N,    N,    '#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',N,    N      ],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'],
]
const HEAD_COLS = 12, HEAD_ROWS = 14

function MrGuyHead({ px = 3, className }: { px?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    HEAD_PIXELS.forEach((row, r) => {
      row.forEach((color, col) => {
        if (!color) return
        ctx.fillStyle = color
        ctx.fillRect(col * px, r * px, px, px)
      })
    })
  }, [px])
  return (
    <canvas
      ref={ref}
      width={HEAD_COLS * px}
      height={HEAD_ROWS * px}
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}

// ── Inline CSS for Mr. Guy animations ────────────────────────────────────────
const MR_GUY_STYLES = `
@keyframes mrg-idle {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
@keyframes mrg-wake {
  0% { transform: translateY(0px) scale(1); }
  30% { transform: translateY(-12px) scale(1.1); }
  60% { transform: translateY(-6px) scale(1.05); }
  80% { transform: translateY(-10px) scale(1.08); }
  100% { transform: translateY(0px) scale(1); }
}
@keyframes mrg-think {
  0%, 100% { transform: translateY(0px) rotate(-2deg); }
  50% { transform: translateY(-3px) rotate(2deg); }
}
@keyframes mrg-talk {
  0%, 100% { transform: translateY(0) scale(1); }
  20% { transform: translateY(-8px) scale(1.06); }
  40% { transform: translateY(-2px) scale(1.02); }
  60% { transform: translateY(-6px) scale(1.04); }
  80% { transform: translateY(-1px) scale(1.01); }
}
@keyframes bubble-pop {
  0% { opacity: 0; transform: scale(0.5) translateY(8px); }
  70% { transform: scale(1.05) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes typing-dot {
  0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-4px); }
}
.mrg-idle    { animation: mrg-idle  2.4s ease-in-out infinite; }
.mrg-wake    { animation: mrg-wake  0.6s ease-out forwards; }
.mrg-think   { animation: mrg-think 1.1s ease-in-out infinite; }
.mrg-talk    { animation: mrg-talk  0.7s ease-out forwards; }
.bubble-pop  { animation: bubble-pop 0.28s cubic-bezier(.34,1.56,.64,1) both; }
`

// ── Message renderer ──────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*'))
      return <em key={i} className="italic opacity-80">{p.slice(1, -1)}</em>
    return p
  })
}

// Renders the body lines of a section (paragraphs, bullets, numbered lists)
function renderSectionBody(bodyLines: string[], keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let i = 0
  while (i < bodyLines.length) {
    const trimmed = bodyLines[i].trim()
    if (!trimmed) { i++; continue }
    if (/^\d+\./.test(trimmed)) {
      const items: string[] = []
      while (i < bodyLines.length && /^\d+\./.test(bodyLines[i].trim())) {
        items.push(bodyLines[i].trim().replace(/^\d+\.\s*/, '')); i++
      }
      nodes.push(
        <ol key={`${keyPrefix}-ol-${i}`} className="space-y-1.5 my-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-gray-200 text-sm leading-relaxed">
              <span className="shrink-0 w-4 h-4 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 text-[9px] font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      ); continue
    }
    if (/^[-•]/.test(trimmed)) {
      const items: string[] = []
      while (i < bodyLines.length && /^[-•]/.test(bodyLines[i].trim())) {
        items.push(bodyLines[i].trim().replace(/^[-•]\s*/, '')); i++
      }
      nodes.push(
        <ul key={`${keyPrefix}-ul-${i}`} className="space-y-1 my-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-gray-200 text-sm leading-relaxed">
              <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-orange-400/80 block" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      ); continue
    }
    nodes.push(<p key={`${keyPrefix}-p-${i}`} className="text-gray-200 text-sm leading-relaxed">{renderInline(trimmed)}</p>)
    i++
  }
  return nodes
}

interface H3Section { title: string; bodyLines: string[] }

function MrGuyMessage({ content }: { content: string }) {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) { nodes.push(<div key={i} className="h-1" />); i++; continue }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      nodes.push(<div key={i} className="border-t border-gray-700/60 my-3" />); i++; continue
    }

    // ## H2 — orange pill badge
    if (/^##\s/.test(trimmed)) {
      const text = trimmed.replace(/^##\s*/, '').toUpperCase()
      nodes.push(
        <div key={i} className="flex items-center gap-3 mt-4 mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black tracking-widest uppercase">
            {text}
          </span>
          <div className="flex-1 h-px bg-gray-700/60" />
        </div>
      ); i++; continue
    }

    // ### H3 — collect consecutive h3 sections into comparison cards
    if (/^###\s/.test(trimmed)) {
      const sections: H3Section[] = []
      while (i < lines.length && /^###\s/.test(lines[i].trim())) {
        const title = lines[i].trim().replace(/^###\s*/, '')
        i++
        const bodyLines: string[] = []
        while (i < lines.length && !/^##/.test(lines[i].trim()) && lines[i].trim() !== '---') {
          bodyLines.push(lines[i]); i++
        }
        // Trim trailing empty lines
        while (bodyLines.length > 0 && !bodyLines[bodyLines.length - 1].trim()) bodyLines.pop()
        sections.push({ title, bodyLines })
      }
      // Render as grid of cards
      const cols = sections.length >= 3 ? 'grid-cols-3' : sections.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
      nodes.push(
        <div key={`h3-group-${i}`} className={cn('grid gap-2 my-2', cols)}>
          {sections.map((sec, si) => (
            <div key={si} className="rounded-xl border border-gray-700/70 bg-gray-900/60 p-3 space-y-2">
              <p className="text-xs font-black text-orange-400 uppercase tracking-wider border-b border-gray-700/50 pb-1.5">
                {sec.title}
              </p>
              <div className="space-y-1">
                {renderSectionBody(sec.bodyLines, `sec-${si}`)}
              </div>
            </div>
          ))}
        </div>
      ); continue
    }

    // 🟢🟡🔴 signal lines
    if (/^(🟢|🟡|🔴)/.test(trimmed)) {
      const isGreen = trimmed.startsWith('🟢'), isYellow = trimmed.startsWith('🟡')
      nodes.push(
        <div key={i} className={cn(
          'flex items-center gap-2 rounded-xl border px-4 py-3 my-1.5 text-sm font-semibold',
          isGreen ? 'bg-green-500/15 border-green-500/30 text-green-300'
            : isYellow ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'
        )}>
          {renderInline(trimmed)}
        </div>
      ); i++; continue
    }

    // ⚠️ warning
    if (trimmed.startsWith('⚠️')) {
      nodes.push(<p key={i} className="text-xs text-gray-500 italic mt-3 pt-3 border-t border-gray-700/50">{trimmed}</p>)
      i++; continue
    }

    // Numbered list
    if (/^\d+\./.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s*/, '')); i++ }
      nodes.push(
        <ol key={`ol-${i}`} className="space-y-2 my-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-white text-sm leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      ); continue
    }

    // Bullet list
    if (/^[-•]/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-•]/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-•]\s*/, '')); i++ }
      nodes.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-white text-sm leading-relaxed">
              <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 block" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      ); continue
    }

    // Plain paragraph
    nodes.push(<p key={i} className="text-white text-[15px] leading-relaxed">{renderInline(trimmed)}</p>)
    i++
  }
  return <div className="space-y-1">{nodes}</div>
}

// While a reply is streaming we render it FLAT, line-by-line, with stable keys.
// The full MrGuyMessage renderer groups consecutive lines into cards/pills whose
// boundaries shift every chunk — that reshuffles React keys and causes the
// line-by-line flicker. This keeps each line stable until the stream finishes,
// then MrGuyMessage takes over for the rich layout. One clean swap, no flashing.
function StreamingMessage({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const t = line.trim()
        if (!t) return <div key={i} className="h-1.5" />
        if (t === '---' || t === '***' || t === '___')
          return <div key={i} className="border-t border-gray-700/60 my-2" />
        if (/^#{1,3}\s/.test(t))
          return <p key={i} className="text-orange-400 font-black text-xs uppercase tracking-widest mt-3 mb-1">{t.replace(/^#{1,3}\s*/, '')}</p>
        if (/^[-•]\s/.test(t))
          return (
            <div key={i} className="flex gap-2.5 text-white text-[15px] leading-relaxed">
              <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 block" />
              <span>{renderInline(t.replace(/^[-•]\s*/, ''))}</span>
            </div>
          )
        const num = t.match(/^(\d+)\.\s+(.*)/)
        if (num)
          return (
            <div key={i} className="flex gap-3 text-white text-[15px] leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{num[1]}</span>
              <span>{renderInline(num[2])}</span>
            </div>
          )
        return <p key={i} className="text-white text-[15px] leading-relaxed">{renderInline(t)}</p>
      })}
    </div>
  )
}

// ── Types & constants ─────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string }
type CharState = 'idle' | 'wake' | 'think' | 'talk'

const CATEGORIES = [
  { icon: TrendingUp, label: 'Hot Takes', color: 'text-orange-400', bg: 'bg-orange-600/10 border-orange-500/20',
    questions: ['How do I evaluate a stock right now?', 'What metrics matter most for NVDA?', 'What is the market doing today?', 'Walk me through how to analyze a trade idea'] },
  { icon: Newspaper, label: 'News & Markets', color: 'text-purple-400', bg: 'bg-purple-600/10 border-purple-500/20',
    questions: ['What is moving markets today?', 'Is a recession coming?', 'What happens to stocks when rates drop?', 'Why did the market drop today?'] },
  { icon: BookOpen, label: 'Explain It', color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-500/20',
    questions: ['What even is a P/E ratio?', 'Why do stocks go up when news is bad?', 'What does market cap actually mean?', 'What is a short squeeze?'] },
  { icon: BarChart2, label: 'Strategy', color: 'text-amber-400', bg: 'bg-amber-600/10 border-amber-500/20',
    questions: ['Should I buy the dip or wait?', 'How do I know when to sell?', 'Is dollar cost averaging actually good?', 'What should a beginner do with $1000?'] },
]

// ── Guest trial chat (no sign-up required, 3 questions max) ──────────────────
const GUEST_CHAT_KEY = 'mrg_guest_chat_used'
const GUEST_CHAT_LIMIT = 3

function GuestChatTrial() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  // Persist used count in localStorage so it survives page refreshes
  const [usedCount, setUsedCount] = useState(0)

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(GUEST_CHAT_KEY) ?? '0', 10)
    setUsedCount(stored)
    if (stored >= GUEST_CHAT_LIMIT) setLimitReached(true)
  }, [])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    const updated = [...messages, { role: 'user' as const, content: msg }]
    setMessages([...updated, { role: 'assistant', content: '' }])
    setLoading(true)

    // Increment and persist the count before sending so closing mid-stream still counts
    const newCount = usedCount + 1
    setUsedCount(newCount)
    localStorage.setItem(GUEST_CHAT_KEY, String(newCount))

    try {
      const res = await fetch('/api/chat/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      if (res.status === 429) { setLimitReached(true); setMessages(updated); setLoading(false); return }
      if (!res.ok || !res.body) { setMessages([...updated, { role: 'assistant', content: 'Something went wrong!' }]); setLoading(false); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'assistant', content: fullText }; return n })
      }
      if (newCount >= GUEST_CHAT_LIMIT) setLimitReached(true)
    } catch { setMessages([...updated, { role: 'assistant', content: 'Something went wrong!' }]) }
    setLoading(false)
  }

  const STARTERS = ['What even is a stock?', 'Why does the market crash?', 'Is Tesla a good buy right now?', 'What is the S&P 500?']
  const questionsLeft = Math.max(0, GUEST_CHAT_LIMIT - usedCount)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <MrGuyHead px={5} className="mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900 mt-3">Ask Mr. Guy anything</h1>
        <p className="text-slate-500 text-sm">Try 3 free questions — no sign-up needed</p>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex items-start gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && <MrGuyHead px={3} className="shrink-0 mt-1" />}
              <div className={cn('rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              )}>
                {m.content || <span className="opacity-40">Thinking…</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Starter questions */}
      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {STARTERS.map(q => (
            <button key={q} onClick={() => { setInput(q); }} className="text-left text-sm bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-3 py-2.5 rounded-xl transition-all">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Limit reached CTA */}
      {limitReached && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center space-y-3">
          <p className="font-semibold text-slate-900">You've used your 3 free questions</p>
          <p className="text-sm text-slate-500">Sign up free to get unlimited Mr. Guy chat, stock research, and more.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              Sign up free →
            </Link>
            <Link href="/login" className="border border-slate-300 text-slate-600 hover:border-slate-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              Log in
            </Link>
          </div>
        </div>
      )}

      {/* Input */}
      {!limitReached && (
        <div className="space-y-2">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything about investing…"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">{questionsLeft} free question{questionsLeft !== 1 ? 's' : ''} left</p>
            <Link href="/register" className="text-xs text-blue-500 hover:underline">Sign up for unlimited →</Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ChatPageWrapper() {
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  )
}

function ChatPage() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [experience, setExperience] = useState<string>('beginner')
  const [charState, setCharState] = useState<CharState>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const charTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    // Prefer session (DB) value; fall back to localStorage for guests
    const sessionLevel = (session?.user as any)?.experienceLevel
    if (sessionLevel) {
      setExperience(sessionLevel)
      localStorage.setItem('zg_experience', sessionLevel) // keep in sync
    } else {
      const saved = localStorage.getItem('zg_experience') ?? 'beginner'
      setExperience(saved)
    }
  }, [session?.user?.email])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setInput(q); inputRef.current?.focus() }
  }, [searchParams])

  // Keep the chat panel pinned to the bottom — scroll ONLY the inner panel,
  // never the page. Skip the yank if the user has scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || (messages.length === 0 && !loading)) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  // Drive Mr. Guy character state
  useEffect(() => {
    if (loading) {
      setCharState('think')
    }
  }, [loading])

  const triggerChar = useCallback((state: CharState, duration = 800) => {
    if (charTimerRef.current) clearTimeout(charTimerRef.current)
    setCharState(state)
    charTimerRef.current = setTimeout(() => setCharState('idle'), duration)
  }, [])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    triggerChar('wake', 600)
    const updated: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages, experience }),
      })

      if (res.status === 429) {
        setLimitReached(true)
        setLoading(false)
        return
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        if (data.emailUnverified) {
          setMessages([...updated, { role: 'assistant', content: 'Please verify your email first — check your inbox for the verification link, then come back and try again!' }])
          setLoading(false)
          return
        }
      }

      if (!res.ok || !res.body) {
        setMessages([...updated, { role: 'assistant', content: 'Something went wrong. Try again!' }])
        setLoading(false)
        return
      }

      // Start streaming — add an empty assistant message and fill it in
      setMessages([...updated, { role: 'assistant', content: '' }])
      triggerChar('talk', 1000)
      setIsStreaming(true)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: fullText }
          return next
        })
      }
      setIsStreaming(false)
    } catch {
      setIsStreaming(false)
      setMessages([...updated, { role: 'assistant', content: 'Something went wrong. Try again!' }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const activeCat = CATEGORIES.find((c) => c.label === activeCategory)

  const charCss = charState === 'idle' ? 'mrg-idle'
    : charState === 'wake' ? 'mrg-wake'
    : charState === 'think' ? 'mrg-think'
    : 'mrg-talk'

  if (status === 'loading') return null
  if (!session) return <GuestChatTrial />

  return (
    <>
      <style>{MR_GUY_STYLES}</style>
      <div className="flex h-[calc(100vh-7rem)] gap-5">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex-1 overflow-y-auto">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Ask about</p>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.label
                return (
                  <button key={cat.label}
                    onClick={() => setActiveCategory(isActive ? null : cat.label)}
                    className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all',
                      isActive ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/60')}>
                    <Icon className={cn('h-4 w-4 shrink-0', cat.color)} />
                    <span className="text-sm font-medium text-gray-300">{cat.label}</span>
                    <ChevronRight className={cn('h-3.5 w-3.5 text-gray-600 ml-auto transition-transform', isActive && 'rotate-90')} />
                  </button>
                )
              })}
            </div>
            {activeCat && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-gray-600 px-1 mb-2">Tap to ask</p>
                {activeCat.questions.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    className={cn('w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all leading-snug',
                      activeCat.bg, 'hover:brightness-125 text-gray-300')}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <p className="text-xs font-bold text-gray-400">Powered by Claude</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">Fetches live price, P/E, EPS, analyst targets and news for every stock you ask about. Mr. Guy does the rest.</p>
          </div>
        </aside>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
            <div className={cn('shrink-0', charCss)}>
              <MrGuyHead px={3} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Mr. Guy</p>
              <p className="text-xs text-gray-500">Live data · real takes · not financial advice (seriously)</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Empty state — Mr. Guy centered, large */}
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5 pb-16">
                <div className={cn('flex flex-col items-center gap-3', charCss)}>
                  <MrGuyHead px={6} />
                </div>
                <div>
                  <p className="text-white font-bold text-xl mt-2">Mr. Guy, at your service.</p>
                  <p className="text-gray-500 text-sm mt-2 max-w-sm leading-relaxed">Ask me about any stock. I pull live data and explain things in plain English — ask me anything about stocks, markets, or investing.</p>
                </div>
                {/* Mobile quick questions */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-md lg:hidden">
                  {CATEGORIES.flatMap((c) => c.questions.slice(0, 1)).map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 transition-all leading-snug">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && (
                  <div className="shrink-0 mt-1">
                    <MrGuyHead px={3} />
                  </div>
                )}
                {m.role === 'user' ? (
                  <div className="max-w-[75%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed bg-blue-600 text-white rounded-br-sm">
                    {m.content}
                  </div>
                ) : (
                  <div className="flex-1 max-w-[92%] rounded-2xl bg-gray-800 border border-gray-700/60 px-5 py-4 rounded-bl-sm bubble-pop">
                    {isStreaming && i === messages.length - 1
                      ? <StreamingMessage content={m.content} />
                      : <MrGuyMessage content={m.content} />}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator — comes from Mr. Guy */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className={cn('shrink-0 mt-1', charCss)}>
                  <MrGuyHead px={3} />
                </div>
                <div className="bg-gray-800 border border-gray-700/60 rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-2 w-2 rounded-full bg-orange-400"
                      style={{ animation: `typing-dot 1.2s ${delay}ms ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800 shrink-0">
            {limitReached ? (
              <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-yellow-300">Mr. Guy's done talking for today</p>
                  <p className="text-sm text-gray-400 mt-0.5">You've used your 3 free chats. Upgrade for unlimited conversations.</p>
                </div>
                <Link
                  href="/upgrade"
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-sm font-bold transition-colors whitespace-nowrap"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Upgrade Now
                </Link>
              </div>
            ) : (
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything about stocks, markets, investing..."
                  rows={1}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/60 transition-colors resize-none leading-relaxed"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                  onInput={(e) => {
                    const t = e.currentTarget
                    t.style.height = 'auto'
                    t.style.height = Math.min(t.scrollHeight, 120) + 'px'
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="h-11 w-11 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            )}
            {!limitReached && <p className="text-xs text-gray-600 mt-2 text-center">Not financial advice · Always do your own research</p>}
          </div>
        </div>
      </div>
    </>
  )
}
