export default function Loading() {
  function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title */}
        <Skeleton className="h-8 w-36" />

        {/* Search input */}
        <Skeleton className="h-11 w-full max-w-sm rounded-lg" />

        {/* Stock rows */}
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/40 divide-y divide-gray-800/40">
          {/* Column header */}
          <div className="grid grid-cols-3 gap-4 px-5 py-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14 justify-self-center" />
            <Skeleton className="h-3 w-16 justify-self-end" />
          </div>

          {/* Stock rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 items-center px-5 py-4">
              {/* Ticker + name */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              {/* Price */}
              <Skeleton className="h-4 w-16 justify-self-center" />
              {/* Change */}
              <Skeleton className="h-4 w-14 justify-self-end" />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
