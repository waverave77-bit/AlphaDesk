'use client'
import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Filing {
  formType: string
  filedDate: string
  entityName: string
  description: string
  url: string
}

function formColor(type: string) {
  if (type === '10-K') return 'border-blue-500/40 text-blue-400'
  if (type === '10-Q') return 'border-purple-500/40 text-purple-400'
  return 'border-gray-600/40 text-gray-400'
}

export default function SecFilings({ ticker }: { ticker: string }) {
  const [filings, setFilings] = useState<Filing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sec/${ticker}`)
      .then(r => r.json())
      .then(d => setFilings(d.filings ?? []))
      .catch(() => setFilings([]))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return (
    <Card><CardContent className="p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </CardContent></Card>
  )

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">SEC Filings</p>
        {filings.length === 0 ? (
          <p className="text-sm text-gray-500">No recent filings found for {ticker}.</p>
        ) : (
          <div className="space-y-2">
            {filings.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors group">
                <Badge variant="outline" className={cn('text-[10px] font-mono shrink-0 w-12 text-center', formColor(f.formType))}>
                  {f.formType}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 group-hover:text-blue-400 transition-colors truncate">{f.entityName}</p>
                  {f.description && <p className="text-[10px] text-gray-600">{f.description}</p>}
                </div>
                <span className="text-xs text-gray-600 shrink-0">{f.filedDate}</span>
                <ExternalLink className="h-3 w-3 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
