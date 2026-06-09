export function AdminQueueTableSkeleton() {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[var(--shadow-card)] md:block">
      <div className="border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <div className="h-3 w-40 animate-pulse rounded bg-panel" />
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <div className="h-4 w-4 animate-pulse rounded bg-panel" />
            <div className="h-10 w-10 animate-pulse rounded-lg bg-panel" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-2/5 animate-pulse rounded bg-panel" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-panel" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-panel" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-panel" />
            <div className="hidden h-3 w-20 animate-pulse rounded bg-panel sm:block" />
            <div className="hidden h-8 w-28 animate-pulse rounded-lg bg-panel md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
