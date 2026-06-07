import { Link, Outlet } from 'react-router-dom'

export function CoinEntryWizardLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-page">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="group flex flex-col">
            <span className="font-serif text-lg font-semibold tracking-tight text-navy">
              CoinArchive
            </span>
            <span className="section-label">
              Archival Entry
            </span>
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-navy/15 hover:bg-muted"
          >
            Exit to dashboard
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  )
}
