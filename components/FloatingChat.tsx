'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, Maximize2 } from 'lucide-react'
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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
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
    const experience = typeof window !== 'undefined' ? (localStorage.getItem('zg_experience') ?? 'beginner') : 'beginner'
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages, experience }),
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
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[540px] flex flex-col rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 bg-gray-900 shrink-0">
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">AI Assistant</p>
              <p className="text-xs text-gray-500">Powered by Claude · For education only</p>
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
                <div className="h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Ask me anything</p>
                  <p className="text-gray-500 text-xs mt-1">Stocks, markets, investing concepts</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500/40 text-gray-300 hover:text-white rounded-xl px-3 py-2.5 transition-all leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800 bg-gray-900 shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about stocks, markets..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
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
          open
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-blue-600 hover:bg-blue-700'
        )}
        style={{ boxShadow: open ? undefined : '0 0 0 0 rgba(59,130,246,0.4), 0 4px 20px rgba(59,130,246,0.3)' }}
      >
        {open
          ? <X className="h-6 w-6 text-white" />
          : <MessageCircle className="h-6 w-6 text-white" />
        }
      </button>
    </>
  )
}
