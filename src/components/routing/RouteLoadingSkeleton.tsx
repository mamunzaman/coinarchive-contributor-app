export function RouteLoadingSkeleton() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-white px-5 py-5 shadow-[var(--shadow-card)]">
        <div className="h-3 w-28 rounded-full bg-muted" />
        <div className="mt-4 h-5 w-3/4 rounded-full bg-muted" />
        <div className="mt-3 h-3 w-full rounded-full bg-muted/80" />
        <div className="mt-2 h-3 w-5/6 rounded-full bg-muted/80" />
        <p className="sr-only" role="status" aria-live="polite">
          Loading page…
        </p>
      </div>
    </div>
  )
}
