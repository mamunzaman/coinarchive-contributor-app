import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'

type DashboardQuickActionsProps = {
  latestPending: CoinSubmission | null
}

export function DashboardQuickActions({ latestPending }: DashboardQuickActionsProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap">
      <Link
        to="/new-coin"
        className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:flex-none sm:px-5"
      >
        New Coin
      </Link>
      <Link
        to="/my-submissions"
        className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-all duration-200 hover:border-navy/20 hover:bg-muted sm:flex-none sm:px-5"
      >
        View My Submissions
      </Link>
      {latestPending ? (
        <Link
          to={`/my-submissions/${latestPending.id}/edit`}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 sm:flex-none sm:px-5"
        >
          Continue pending edit
        </Link>
      ) : null}
      <Link
        to="/profile"
        className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-all duration-200 hover:border-navy/20 hover:bg-muted sm:flex-none sm:px-5"
      >
        Profile
      </Link>
    </div>
  )
}
