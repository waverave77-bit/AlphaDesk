import { TrendingUp } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start sm:justify-center overflow-y-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">Mr. Guy Invests</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
