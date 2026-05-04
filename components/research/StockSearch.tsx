'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchResult {
  ticker: string
  name: string
  exchange: string
  type: string
}

export default function StockSearch({ placeholder = 'Search ticker or company...' }: { placeholder?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length < 1) { setResults([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results || [])
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navigate = (ticker: string) => {
    setQuery('')
    setOpen(false)
    router.push(`/research/${ticker}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9 bg-gray-800 border-gray-700 text-gray-100"
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              navigate(query.trim().toUpperCase())
            }
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-700 bg-gray-900 shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.ticker}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-800 transition-colors text-left"
              onClick={() => navigate(r.ticker)}
            >
              <div>
                <span className="font-semibold text-white text-sm">{r.ticker}</span>
                <span className="ml-2 text-gray-400 text-xs truncate max-w-xs">{r.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{r.exchange}</span>
                <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{r.type}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
