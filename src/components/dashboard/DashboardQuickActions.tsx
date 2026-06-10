import { LayoutList, Pencil, Plus, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'
import { ICON_ACTION } from '../ui/ActionControls'

type DashboardQuickActionsProps = {
  latestPending: CoinSubmission | null
  latestNeedsRevision?: CoinSubmission | null
}

const actionClass =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors sm:flex-none'

export function DashboardQuickActions({
  latestPending,
  latestNeedsRevision = null,
}: DashboardQuickActionsProps) {
  return (
    <div className="grid gap-2 border-t border-border/60 pt-4 sm:grid-cols-2 lg:flex lg:flex-wrap">
      <Link to="/new-coin" className={`${actionClass} bg-primary text-white hover:bg-primary-hover`}>
        <Plus className={ICON_ACTION} aria-hidden />
        <span>New Coin</span>
      </Link>
      <Link
        to="/my-submissions"
        className={`${actionClass} border border-border bg-white text-navy hover:border-navy/20 hover:bg-page`}
      >
        <LayoutList className={ICON_ACTION} aria-hidden />
        <span>View My Submissions</span>
      </Link>
      {latestNeedsRevision ? (
        <Link
          to={`/my-submissions/${latestNeedsRevision.id}/edit`}
          className={`${actionClass} border border-red-200 bg-red-50 text-red-800 hover:border-red-300 hover:bg-red-100 sm:col-span-2 lg:col-span-1`}
        >
          <Pencil className={ICON_ACTION} aria-hidden />
          <span>Update submission</span>
        </Link>
      ) : null}
      {latestPending ? (
        <Link
          to={`/my-submissions/${latestPending.id}/edit`}
          className={`${actionClass} border border-primary/30 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10 sm:col-span-2 lg:col-span-1`}
        >
          <Pencil className={ICON_ACTION} aria-hidden />
          <span>Continue pending edit</span>
        </Link>
      ) : null}
      <Link
        to="/profile"
        className={`${actionClass} border border-border bg-white text-navy hover:border-navy/20 hover:bg-page`}
      >
        <User className={ICON_ACTION} aria-hidden />
        <span>Profile</span>
      </Link>
    </div>
  )
}
