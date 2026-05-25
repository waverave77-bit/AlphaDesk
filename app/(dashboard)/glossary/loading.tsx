export default function Loading() {
  function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title */}
        <Skeleton className="h-8 w-36" />

        {/* Search bar */}
        <Skeleton className="h-11 w-full rounded-lg" />

        {/* Alphabet filter row */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>

        {/* Term cards grid — 2 cols on mobile, 4 on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
