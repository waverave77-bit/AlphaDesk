export default function Loading() {
  function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title */}
        <Skeleton className="h-8 w-36" />

        {/* Metric cards — 4 across on md+, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Primary chart area */}
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-10 rounded" />
              <Skeleton className="h-7 w-10 rounded" />
              <Skeleton className="h-7 w-10 rounded" />
              <Skeleton className="h-7 w-10 rounded" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Secondary chart row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
