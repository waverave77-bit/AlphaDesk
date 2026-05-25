export default function Loading() {
  function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title + action button */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        {/* Alert cards */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
