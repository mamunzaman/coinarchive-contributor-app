import { Card } from '../ui/Card'

export function ProfilePageSkeleton() {
  return (
    <div className="profile-page mx-auto w-full max-w-6xl" aria-busy="true" aria-live="polite">
      <div className="h-4 w-24 animate-pulse rounded bg-panel" />
      <Card className="profile-page__identity mt-3 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-panel" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-8 w-48 max-w-full animate-pulse rounded bg-panel" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded bg-panel" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-panel" />
          </div>
        </div>
      </Card>

      <div className="profile-page__layout mt-6">
        <div className="profile-page__primary space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="h-6 w-40 animate-pulse rounded bg-panel" />
            <div className="mt-4 space-y-4">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-10 animate-pulse rounded-lg bg-panel" />
              ))}
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="h-6 w-52 animate-pulse rounded bg-panel" />
            <div className="mt-4 h-24 animate-pulse rounded-xl bg-panel" />
          </Card>
        </div>
      </div>
    </div>
  )
}
