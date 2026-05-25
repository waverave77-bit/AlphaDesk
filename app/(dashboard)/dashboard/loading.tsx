export default function Loading() {
  function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title */}
        <Skeleton className="h-8 w-48" />

        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>

        {/* Holdings list */}
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-14" />
                  <Skeleton className="h-3.5 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
