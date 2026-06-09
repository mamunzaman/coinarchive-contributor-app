export function AdminQueueTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[var(--shadow-card)]">
      <div className="border-b border-border/60 bg-muted/40 px-5 py-3">
        <div className="h-3 w-48 animate-pulse rounded bg-panel" />
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <div className="h-4 w-4 animate-pulse rounded bg-panel" />
            <div className="h-12 w-12 animate-pulse rounded-lg bg-panel" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded bg-panel" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-panel" />
            </div>
            <div className="hidden h-4 w-24 animate-pulse rounded bg-panel sm:block" />
            <div className="hidden h-6 w-20 animate-pulse rounded-full bg-panel md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
