import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start sm:justify-center overflow-y-auto px-4 py-10">
      <div className="flex items-center gap-2.5 mb-8">
        <span className="bg-white border-2 border-[#16130a] p-1 shadow-[3px_3px_0_#16130a] flex"><MrGuyLogoSvg px={3} /></span>
        <span className="font-display text-2xl uppercase tracking-tight text-white">Mr. Guy Invests</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
