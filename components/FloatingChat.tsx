'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Maximize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFeatureFlags } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'What even is a stock?',
  'How do I start investing?',
  'How do I know if a stock is expensive?',
  'Why do stocks go up and down?',
]

function HedgehogFace({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,36 18,8 24,36"  fill="#2D1209" />
      <polygon points="22,36 30,2 38,36"  fill="#3D1F0A" />
      <polygon points="36,36 42,10 48,36" fill="#2D1209" />
      <circle cx="30" cy="40" r="18" fill="#8B5E3C" />
      <ellipse cx="15" cy="28" rx="5" ry="6" fill="#8B5E3C" />
      <ellipse cx="15" cy="29" rx="3" ry="4" fill="#C4856A" />
      <ellipse cx="45" cy="28" rx="5" ry="6" fill="#8B5E3C" />
      <ellipse cx="45" cy="29" rx="3" ry="4" fill="#C4856A" />
      <ellipse cx="30" cy="46" rx="9" ry="7" fill="#A0724E" />
      <ellipse cx="30" cy="41" rx="4" ry="3" fill="#1A0800" />
      <circle cx="22" cy="37" r="3.5" fill="#1A0800" />
      <circle cx="23.5" cy="36" r="1.2" fill="white" />
      <circle cx="38" cy="37" r="3.5" fill="#1A0800" />
      <circle cx="39.5" cy="36" r="1.2" fill="white" />
      <ellipse cx="18" cy="42" rx="5" ry="3" fill="#E88080" opacity="0.4" />
      <ellipse cx="42" cy="42" rx="5" ry="3" fill="#E88080" opacity="0.4" />
    </svg>
  )
}

export default function FloatingChat() {
  const { flags } = useFeatureFlags()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

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

  if (flags.floating_chat === false) return null

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[540px] flex flex-col rounded-2xl border border-amber-900/30 bg-gray-950 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-amber-900/20 bg-gray-900 shrink-0">
            <div className="h-10 w-10 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center shrink-0">
              <HedgehogFace size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Hedgie</p>
              <p className="text-xs text-amber-600/80">Your AI investing buddy</p>
            </div>
            <button
              onClick={() => { setOpen(false); router.push('/chat') }}
              className="h-7 w-7 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors"
              title="Open full chat"
            >
              <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="h-7 w-7 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pb-4">
                <div className="h-16 w-16 rounded-2xl bg-amber-900/20 border border-amber-700/30 flex items-center justify-center">
                  <HedgehogFace size={40} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Hey, I'm Hedgie!</p>
                  <p className="text-gray-500 text-xs mt-1">Ask me anything about stocks and investing</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs bg-gray-800 hover:bg-amber-900/20 border border-gray-700 hover:border-amber-700/40 text-gray-300 hover:text-white rounded-xl px-3 py-2.5 transition-all leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start items-end')}>
                {m.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-amber-900/40 flex items-center justify-center shrink-0 mb-0.5">
                    <HedgehogFace size={16} />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-amber-700 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-end gap-2">
                <div className="h-6 w-6 rounded-full bg-amber-900/40 flex items-center justify-center shrink-0">
                  <HedgehogFace size={16} />
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-amber-900/20 bg-gray-900 shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask Hedgie about stocks..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-700/60 transition-colors"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="h-10 w-10 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95',
          open ? 'bg-gray-700 hover:bg-gray-600' : 'bg-amber-800 hover:bg-amber-700'
        )}
        style={open ? undefined : {
          boxShadow: '0 0 0 0 rgba(180,83,9,0.4), 0 4px 20px rgba(180,83,9,0.35)',
          animation: 'hedgiePulse 2.5s ease-in-out infinite',
        }}
      >
        {open ? <X className="h-6 w-6 text-white" /> : <HedgehogFace size={30} />}
      </button>
    </>
  )
}
