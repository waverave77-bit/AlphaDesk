'use client'
import { useState } from 'react'
import { Brain, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
import ProLimitBanner from '@/components/ProLimitBanner'

interface ModelResult {
  model: string
  signal: string
  rationale: string
  keyRisk: string
  keyStrength: string
  error?: boolean
}

interface EnsembleResult {
  models: ModelResult[]
  synthesis: string
  consensusSignal: string
  buyCount: number
  holdCount: number
  sellCount: number
}

interface AIAnalysisPanelProps {
  type: 'stock' | 'portfolio'
  data: any
  label?: string
}

const MODEL_COLORS: Record<string, string> = {
  'Claude Haiku':  'border-purple-500/40 bg-purple-500/5',
  'DeepSeek V3':   'border-blue-500/40 bg-blue-500/5',
  'Grok-2':        'border-green-500/40 bg-green-500/5',
  'Grok 4':        'border-green-500/40 bg-green-500/5',
}

const MODEL_BADGE: Record<string, string> = {
  'Claude Haiku':  'bg-purple-500/20 text-purple-300',
  'DeepSeek V3':   'bg-blue-500/20 text-blue-300',
  'Grok-2':        'bg-green-500/20 text-green-300',
  'Grok 4':        'bg-green-500/20 text-green-300',
}

function SignalBadge({ signal }: { signal: string }) {
  const s = signal.toUpperCase()
  const isBullish = s === 'BUY' || s === 'STRONG'
  const isBearish = s === 'SELL' || s === 'WEAK'
  return (
    <span className={cn(
      'text-xs font-bold px-2 py-0.5 rounded-full',
      isBullish ? 'bg-green-500/20 text-green-400' :
      isBearish ? 'bg-red-500/20 text-red-400' :
      'bg-yellow-500/20 text-yellow-400'
    )}>
      {signal}
    </span>
  )
}

export default function AIAnalysisPanel({ type, data, label }: AIAnalysisPanelProps) {
  const [result, setResult] = useState<EnsembleResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'

  const textMuted = isDark ? '#94a3b8' : '#475569'
  const textBody  = isDark ? '#cbd5e1' : '#1e293b'
  const textHead  = isDark ? '#f1f5f9' : '#0f172a'
  const borderCol = isDark ? '#374151' : '#e2e8f0'
  const cardBg    = isDark ? 'rgb(17 24 39 / 0.8)' : '#ffffff'

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setLimitReached(false)
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      })
      const json = await res.json()
      if (json.limitReached) { setLimitReached(true); return }
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      setResult(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const consensusIsBullish = result?.consensusSignal === 'BUY' || result?.consensusSignal === 'STRONG'
  const consensusIsBearish = result?.consensusSignal === 'SELL' || result?.consensusSignal === 'WEAK'
  const agreeCount = consensusIsBullish ? result?.buyCount : consensusIsBearish ? result?.sellCount : result?.holdCount

  return (
    <Card className="border-blue-500/30" style={{ backgroundColor: cardBg }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">AI Consensus</span>
            {label && <span style={{ color: textMuted }} className="font-normal">— {label}</span>}
          </CardTitle>
          <div className="flex gap-2">
            {result && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
              onClick={runAnalysis}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}
              {result ? 'Re-analyze' : 'Analyze'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {loading && (
        <CardContent>
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: '#60a5fa' }} />
            <span style={{ color: textMuted, fontSize: '13px' }}>Running Claude, DeepSeek & Grok in parallel...</span>
          </div>
        </CardContent>
      )}

      {limitReached && (
        <CardContent>
          <ProLimitBanner feature="ai-analysis" isDark={isDark} />
        </CardContent>
      )}

      {error && !limitReached && (
        <CardContent>
          <p style={{ color: '#f87171', fontSize: '13px' }}>{error}</p>
        </CardContent>
      )}

      {result && expanded && (
        <CardContent className="space-y-4">
          {/* Consensus banner */}
          <div className={cn(
            'flex items-center gap-4 p-4 rounded-xl border',
            consensusIsBullish ? 'border-green-500/30 bg-green-500/10' :
            consensusIsBearish ? 'border-red-500/30 bg-red-500/10' :
            'border-yellow-500/30 bg-yellow-500/10'
          )}>
            {consensusIsBullish
              ? <TrendingUp className="h-8 w-8 text-green-400 shrink-0" />
              : consensusIsBearish
              ? <TrendingDown className="h-8 w-8 text-red-400 shrink-0" />
              : <Minus className="h-8 w-8 text-yellow-400 shrink-0" />
            }
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">AI Consensus</p>
              <p className={cn('text-2xl font-bold',
                consensusIsBullish ? 'text-green-400' :
                consensusIsBearish ? 'text-red-400' : 'text-yellow-400'
              )}>
                {result.consensusSignal}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Agreement</p>
              <p className="text-lg font-bold text-white">{agreeCount}/3 models</p>
            </div>
          </div>

          {/* Individual model cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {result.models.map((m) => (
              <div key={m.model} className={cn('rounded-xl border p-3 space-y-2', MODEL_COLORS[m.model] ?? 'border-gray-700')}>
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', MODEL_BADGE[m.model] ?? 'bg-gray-700 text-gray-300')}>
                    {m.model}
                  </span>
                  <SignalBadge signal={m.signal} />
                </div>
                {/* Rationale — show even on error so the reason is visible */}
                {m.rationale ? (
                  <p style={{
                    color: m.error ? textMuted : textBody,
                    fontSize: '11px',
                    lineHeight: '1.6',
                    fontStyle: m.error ? 'italic' : 'normal',
                  }}>{m.rationale}</p>
                ) : m.error ? (
                  <p style={{ color: textMuted, fontSize: '11px', fontStyle: 'italic' }}>Model unavailable</p>
                ) : null}
                {!m.error && m.keyStrength && (
                  <p style={{ color: '#16a34a', fontSize: '10px' }}>↑ {m.keyStrength}</p>
                )}
                {!m.error && m.keyRisk && (
                  <p style={{ color: '#dc2626', fontSize: '10px' }}>↓ {m.keyRisk}</p>
                )}
              </div>
            ))}
          </div>

          {/* Full synthesis */}
          <div className="pt-2" style={{ borderTop: `1px solid ${borderCol}` }}>
            <MarkdownRenderer content={result.synthesis} textBody={textBody} textHead={textHead} textMuted={textMuted} />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function MarkdownRenderer({ content, textBody, textHead, textMuted }: {
  content: string
  textBody: string
  textHead: string
  textMuted: string
}) {
  const lines = content.split('\n')
  return (
    <div style={{ color: textBody }} className="space-y-1.5 text-sm">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} style={{ color: textHead, fontWeight: 600, fontSize: '14px', marginTop: '14px', marginBottom: '4px' }}>{line.slice(3)}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} style={{ color: textHead, fontWeight: 600 }}>{line.slice(2, -2)}</p>
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          const text = line.slice(2).trim()
          if (!text) return null
          return (
            <p key={i} style={{ display: 'flex', gap: '8px', color: textBody }}>
              <span style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }}>•</span>
              <span>{renderInlineBold(text, textHead)}</span>
            </p>
          )
        }
        if (line.startsWith('---')) {
          return <hr key={i} style={{ borderColor: textMuted, opacity: 0.3, margin: '10px 0' }} />
        }
        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
          return <p key={i} style={{ color: textMuted, fontSize: '11px', fontStyle: 'italic' }}>{line.slice(1, -1)}</p>
        }
        if (line.trim()) {
          return <p key={i} style={{ color: textBody, lineHeight: '1.6' }}>{renderInlineBold(line, textHead)}</p>
        }
        return null
      })}
    </div>
  )
}

function renderInlineBold(text: string, textHead: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: textHead }}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
