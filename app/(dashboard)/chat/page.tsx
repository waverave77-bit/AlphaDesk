'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Bot, Loader2, Sparkles, TrendingUp, BookOpen, Newspaper, BarChart2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Finn response renderer ───────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*'))
      return <em key={i} className="italic text-gray-200">{p.slice(1, -1)}</em>
    return p
  })
}

function FinnMessage({ content }: { content: string }) {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty
    if (!trimmed) { nodes.push(<div key={i} className="h-1" />); i++; continue }

    // Horizontal rule
    if (trimmed === '---') {
      nodes.push(<div key={i} className="border-t border-gray-700/60 my-3" />)
      i++; continue
    }

    // ## Section header
    if (trimmed.startsWith('##')) {
      const label = trimmed.replace(/^##\s*\*?\*?/, '').replace(/\*?\*?:?\s*$/, '').trim()
      nodes.push(
        <p key={i} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-4 mb-1.5">
          {label}
        </p>
      )
      i++; continue
    }

    // Recommendation badge: 🟢 🟡 🔴
    if (/^(🟢|🟡|🔴)/.test(trimmed)) {
      const isGreen = trimmed.startsWith('🟢')
      const isYellow = trimmed.startsWith('🟡')
      const style = isGreen
        ? 'bg-green-500/15 border-green-500/30 text-green-300'
        : isYellow
          ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'
          : 'bg-red-500/15 border-red-500/30 text-red-300'
      nodes.push(
        <div key={i} className={`flex items-center gap-2 rounded-xl border px-4 py-3 my-1.5 text-sm font-semibold ${style}`}>
          {renderInline(trimmed)}
        </div>
      )
      i++; continue
    }

    // ⚠️ disclaimer
    if (trimmed.startsWith('⚠️')) {
      nodes.push(
        <p key={i} className="text-xs text-gray-500 italic mt-3 pt-3 border-t border-gray-700/50">
          {trimmed}
        </p>
      )
      i++; continue
    }

    // Numbered list — collect consecutive items
    if (/^\d+\./.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ''))
        i++
      }
      nodes.push(
        <ol key={`ol-${i}`} className="space-y-2 my-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-gray-100 text-sm leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Bullet list — collect consecutive items
    if (/^[-•]/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-•]/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s*/, ''))
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-gray-100 text-sm leading-relaxed">
              <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 block" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Regular paragraph
    nodes.push(
      <p key={i} className="text-gray-100 text-base leading-relaxed">
        {renderInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{nodes}</div>
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const CATEGORIES = [
  {
    icon: BookOpen,
    label: 'Basics',
    color: 'text-blue-400',
    bg: 'bg-blue-600/10 border-blue-500/20',
    questions: [
      'What even is a stock?',
      'How do I start investing with $100?',
      'What is a index fund?',
      'Difference between stocks and bonds?',
    ],
  },
  {
    icon: Newspaper,
    label: 'News & Markets',
    color: 'text-purple-400',
    bg: 'bg-purple-600/10 border-purple-500/20',
    questions: [
      'What is moving markets today?',
      'How does inflation affect stocks?',
      'What happens to stocks when rates rise?',
      'How do earnings reports affect stock price?',
    ],
  },
  {
    icon: TrendingUp,
    label: 'Stocks',
    color: 'text-green-400',
    bg: 'bg-green-600/10 border-green-500/20',
    questions: [
      'What is a P/E ratio?',
      'How do I read a stock chart?',
      'What does market cap mean?',
      'What is a dividend?',
    ],
  },
  {
    icon: BarChart2,
    label: 'Strategy',
    color: 'text-amber-400',
    bg: 'bg-amber-600/10 border-amber-500/20',
    questions: [
      'What is dollar cost averaging?',
      'How should a beginner diversify?',
      'What is a good long-term strategy?',
      'When should I sell a stock?',
    ],
  },
]

export default function ChatPage() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Pre-fill from ?q= param (e.g. from chart spike "Ask AI why" button)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setInput(q)
      inputRef.current?.focus()
    }
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const updated: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Something went wrong. Try again!' }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const activeCat = CATEGORIES.find((c) => c.label === activeCategory)

  return (
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
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(isActive ? null : cat.label)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all',
                    isActive ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/60'
                  )}
                >
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
                <button
                  key={q}
                  onClick={() => send(q)}
                  className={cn(
                    'w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all leading-snug',
                    activeCat.bg,
                    'hover:brightness-125 text-gray-300'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <p className="text-xs font-bold text-gray-400">Powered by Claude</p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">Reads live market news to give you up-to-date answers. Always do your own research before investing.</p>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Finn — Market Analyst</p>
            <p className="text-xs text-gray-500">Live news · Buy/Hold/Sell reads · Not financial advice</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 pb-10">
              <div className="h-16 w-16 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Hey, I'm Finn.</p>
                <p className="text-gray-500 text-sm mt-1.5 max-w-sm">Ask me about any stock, sector, or what's moving the market. I'll give you a straight read with live news.</p>
              </div>
              {/* Mobile quick questions */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md lg:hidden">
                {CATEGORIES.flatMap((c) => c.questions.slice(0, 1)).map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 transition-all leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              {m.role === 'user' ? (
                <div className="max-w-[75%] rounded-2xl px-5 py-3.5 text-base leading-relaxed bg-blue-600 text-white rounded-br-sm">
                  {m.content}
                </div>
              ) : (
                <div className="flex-1 max-w-[92%] rounded-2xl bg-gray-800/80 border border-gray-700/50 px-5 py-4 rounded-bl-sm">
                  <FinnMessage content={m.content} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about stocks, markets, investing..."
              rows={1}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
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
              className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">Not financial advice · Always do your own research</p>
        </div>
      </div>
    </div>
  )
}
