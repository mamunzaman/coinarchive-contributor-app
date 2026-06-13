import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button } from '../ui/Button'

export function RouteErrorFallback() {
  const error = useRouteError()
  const isChunkError =
    error instanceof Error &&
    (error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed'))

  const message = isRouteErrorResponse(error)
    ? error.statusText || 'Page failed to load.'
    : isChunkError
      ? 'This page failed to load after an update. Reload to continue.'
      : error instanceof Error
        ? error.message
        : 'Something went wrong while loading this page.'

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-white px-5 py-6 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold text-navy">Unable to open this page</p>
        <p className="mt-2 text-sm text-navy-muted" role="alert">
          {message}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
