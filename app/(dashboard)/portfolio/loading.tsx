export default function Loading() {
  function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title */}
        <Skeleton className="h-8 w-36" />

        {/* Summary + donut chart row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Donut chart circle */}
          <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-6 flex flex-col items-center gap-4">
            <Skeleton className="h-48 w-48 rounded-full" />
            <div className="w-full space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-10 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Total value summary */}
          <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-6 space-y-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-4 w-24" />
            <div className="pt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Holdings rows */}
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 p-5 space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-14" />
                    <Skeleton className="h-3 w-22" />
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
