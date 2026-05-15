'use client'
import { useState, useEffect } from 'react'
import { MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface RedditData {
  mentions: number
  bullishCount: number
  bearishCount: number
  neutralCount: number
  sentiment: 'Positive' | 'Negative' | 'Neutral'
  posts: { title: string; url: string; subreddit: string; score: number; sentiment: 'bullish' | 'bearish' | 'neutral' }[]
}

export default function RedditSentiment({ ticker }: { ticker: string }) {
  const [data, setData] = useState<RedditData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/reddit/${ticker}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return (
    <Card><CardContent className="p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
    </CardContent></Card>
  )

  if (!data || data.mentions === 0) return (
    <Card><CardContent className="p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Reddit Sentiment</p>
      <p className="text-sm text-gray-500">No recent Reddit mentions found for {ticker}.</p>
    </CardContent></Card>
  )

  const total = data.bullishCount + data.bearishCount + data.neutralCount || 1
  const bullPct = (data.bullishCount / total) * 100
  const bearPct = (data.bearishCount / total) * 100
  const neutPct = (data.neutralCount / total) * 100

  const sentimentColor = data.sentiment === 'Positive' ? 'text-green-400' : data.sentiment === 'Negative' ? 'text-red-400' : 'text-yellow-400'
  const SentimentIcon = data.sentiment === 'Positive' ? TrendingUp : data.sentiment === 'Negative' ? TrendingDown : Minus

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Reddit Sentiment</p>

        <div className="flex items-center gap-4 mb-4">
          <SentimentIcon className={cn('h-7 w-7', sentimentColor)} />
          <div>
            <p className={cn('text-2xl font-bold', sentimentColor)}>{data.sentiment}</p>
            <p className="text-xs text-gray-500">{data.mentions} mentions found</p>
          </div>
          <div className="ml-auto flex gap-3 text-xs">
            <span className="text-green-400 font-medium">{data.bullishCount} Bullish</span>
            <span className="text-yellow-400 font-medium">{data.neutralCount} Neutral</span>
            <span className="text-red-400 font-medium">{data.bearishCount} Bearish</span>
          </div>
        </div>

        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
          {bullPct > 0 && <div className="bg-green-500 rounded-l-full" style={{ width: `${bullPct}%` }} />}
          {neutPct > 0 && <div className="bg-yellow-500" style={{ width: `${neutPct}%` }} />}
          {bearPct > 0 && <div className="bg-red-500 rounded-r-full" style={{ width: `${bearPct}%` }} />}
        </div>

        <div className="space-y-2">
          {data.posts.map((post, i) => (
            <a key={i} href={post.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 group p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
              <MessageSquare className="h-3.5 w-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">r/{post.subreddit}</span>
                  <span className="text-xs text-gray-600">↑{post.score}</span>
                  <Badge variant="outline" className={cn('text-[10px] py-0 h-4', post.sentiment === 'bullish' ? 'border-green-600/40 text-green-400' : post.sentiment === 'bearish' ? 'border-red-600/40 text-red-400' : 'border-yellow-600/40 text-yellow-400')}>
                    {post.sentiment}
                  </Badge>
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
