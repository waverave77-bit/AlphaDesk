export default function Loading() {
  function Sk({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-gray-800/60 ${className ?? ''}`} />
  }
  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Sk className="h-8 w-48" />
          <Sk className="h-32 w-full max-w-2xl" />
          <Sk className="h-12 w-full max-w-2xl" />
        </div>
      </div>
    </div>
  )
}
