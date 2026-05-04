'use client'
import { useState } from 'react'
import { Brain, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AIAnalysisPanelProps {
  type: 'stock' | 'portfolio'
  data: any
  label?: string
}

export default function AIAnalysisPanel({ type, data, label }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      setAnalysis(json.analysis)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-blue-800/30 bg-gray-900/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">AI Analysis</span>
            {label && <span className="text-gray-400 font-normal">— {label}</span>}
          </CardTitle>
          <div className="flex gap-2">
            {analysis && (
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
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
              {analysis ? 'Re-analyze' : 'Analyze'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {(analysis || error) && expanded && (
        <CardContent>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          {analysis && (
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownRenderer content={analysis} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-2 text-sm text-gray-300">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-white font-semibold text-base mt-4 mb-1 first:mt-0">{line.slice(3)}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          const inner = line.slice(2, -2)
          const isRating = inner.startsWith('Rating:') || inner.startsWith('Verdict:')
          return (
            <p key={i} className={`font-semibold ${isRating ? 'text-blue-400 text-base' : 'text-white'}`}>
              {inner}
            </p>
          )
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <p key={i} className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span><span>{line.slice(2)}</span></p>
        }
        if (line.startsWith('---')) {
          return <hr key={i} className="border-gray-700 my-3" />
        }
        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
          return <p key={i} className="text-xs text-gray-500 italic">{line.slice(1, -1)}</p>
        }
        if (line.trim()) {
          return <p key={i} className="text-gray-300 leading-relaxed">{renderInlineBold(line)}</p>
        }
        return null
      })}
    </div>
  )
}

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
    }
    return part
  })
}
