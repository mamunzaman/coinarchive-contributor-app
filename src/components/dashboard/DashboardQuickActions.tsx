import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'

type DashboardQuickActionsProps = {
  latestPending: CoinSubmission | null
}

const actionClass =
  'inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors sm:flex-none'

export function DashboardQuickActions({ latestPending }: DashboardQuickActionsProps) {
  return (
    <div className="grid gap-2 border-t border-border/60 pt-4 sm:grid-cols-2 lg:flex lg:flex-wrap">
      <Link to="/new-coin" className={`${actionClass} bg-primary text-white hover:bg-primary-hover`}>
        New Coin
      </Link>
      <Link
        to="/my-submissions"
        className={`${actionClass} border border-border bg-white text-navy hover:border-navy/20 hover:bg-page`}
      >
        View My Submissions
      </Link>
      {latestPending ? (
        <Link
          to={`/my-submissions/${latestPending.id}/edit`}
          className={`${actionClass} border border-primary/30 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10 sm:col-span-2 lg:col-span-1`}
        >
          Continue pending edit
        </Link>
      ) : null}
      <Link
        to="/profile"
        className={`${actionClass} border border-border bg-white text-navy hover:border-navy/20 hover:bg-page`}
      >
        Profile
      </Link>
    </div>
  )
}
