export function CardSkeleton() {
  return (
    <div className="glass rounded-3xl border border-white/5 p-6 animate-pulse">
      <div className="w-12 h-12 rounded-2xl shimmer-bg mb-4" />
      <div className="h-3 shimmer-bg rounded-full w-1/3 mb-2" />
      <div className="h-5 shimmer-bg rounded-full w-2/3 mb-4" />
      <div className="h-3 shimmer-bg rounded-full w-1/2 mb-6" />
      <div className="h-10 shimmer-bg rounded-xl w-full" />
    </div>
  )
}

export function BookingRowSkeleton() {
  return (
    <div className="glass rounded-3xl border border-white/5 p-6 animate-pulse flex items-center gap-5">
      <div className="w-14 h-14 rounded-2xl shimmer-bg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 shimmer-bg rounded-full w-1/4" />
        <div className="h-5 shimmer-bg rounded-full w-1/2" />
        <div className="h-3 shimmer-bg rounded-full w-1/3" />
      </div>
      <div className="h-10 w-28 shimmer-bg rounded-xl flex-shrink-0" />
    </div>
  )
}

export function TicketSkeleton() {
  return (
    <div className="glass rounded-3xl border border-white/5 overflow-hidden animate-pulse">
      <div className="h-20 shimmer-bg" />
      <div className="p-6 space-y-4">
        <div className="h-6 shimmer-bg rounded-full w-2/3" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 shimmer-bg rounded-2xl" />
          ))}
        </div>
        <div className="h-40 shimmer-bg rounded-2xl" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="glass rounded-2xl border border-white/5 p-5 animate-pulse">
      <div className="w-10 h-10 shimmer-bg rounded-xl mb-4" />
      <div className="h-8 shimmer-bg rounded-full w-1/2 mb-2" />
      <div className="h-3 shimmer-bg rounded-full w-2/3" />
    </div>
  )
}