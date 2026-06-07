import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border/80 bg-surface px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <Link to="/login" className="inline-flex flex-col">
            <span className="font-serif text-xl font-semibold tracking-tight text-navy">
              CoinArchive
            </span>
            <span className="section-label">
              Contributor
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
