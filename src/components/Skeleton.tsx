function Pulse({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-8 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pulse className="w-8 h-8 rounded-full" />
          <div className="space-y-1.5">
            <Pulse className="w-10 h-6" />
            <Pulse className="w-16 h-3" />
          </div>
        </div>
        <Pulse className="w-20 h-5" />
      </div>

      <div className="flex justify-center py-2">
        <Pulse className="w-40 h-40 rounded-full" />
      </div>

      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <Pulse className="w-28 h-5" />
          <Pulse className="w-24 h-9 rounded-xl" />
        </div>
        <div className="p-4 space-y-3">
          <Pulse className="w-full h-4" />
          <Pulse className="w-3/4 h-4" />
        </div>
      </div>

      <Pulse className="w-full h-16 rounded-2xl" />
      <Pulse className="w-full h-12 rounded-2xl" />
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <Pulse className="w-24 h-6" />
      <Pulse className="w-48 h-3" />
      <div className="flex gap-1.5 bg-bg-card rounded-xl p-1 border border-white/5">
        {[1, 2, 3, 4].map(i => <Pulse key={i} className="flex-1 h-7 rounded-lg" />)}
      </div>
      <div className="bg-bg-card rounded-2xl border border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Pulse className="w-32 h-5" />
          <div className="flex gap-2"><Pulse className="w-8 h-8 rounded-xl" /><Pulse className="w-8 h-8 rounded-xl" /></div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Pulse key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReadingDaySkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <Pulse className="w-16 h-4" />
      <div className="flex items-center justify-between">
        <Pulse className="w-24 h-6" />
        <Pulse className="w-28 h-9 rounded-xl" />
      </div>
      <Pulse className="w-full h-16 rounded-2xl" />
      <div className="bg-bg-card rounded-2xl border border-white/5 p-4 space-y-3">
        <Pulse className="w-20 h-3" />
        <Pulse className="w-full h-10 rounded-xl" />
        <Pulse className="w-full h-10 rounded-xl" />
        <Pulse className="w-3/4 h-10 rounded-xl" />
      </div>
    </div>
  )
}
