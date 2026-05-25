export default function Loading() {
  function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title */}
        <Skeleton className="h-8 w-40" />

        {/* Search bar */}
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>

        {/* Analysis cards — 3 across on md+, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-10 rounded" />
              <Skeleton className="h-7 w-10 rounded" />
              <Skeleton className="h-7 w-10 rounded" />
            </div>
          </div>
          <Skeleton className="h-56 w-full" />
        </div>

      </div>
    </div>
  )
}
