import { FilePenLine, LayoutList, Plus, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ICON_ACTION } from '../ui/ActionControls'

type DashboardQuickActionsProps = {
  latestDraftHref?: string | null
}

const actionClass =
  'flex min-h-[5.5rem] flex-col justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors'

export function DashboardQuickActions({ latestDraftHref = null }: DashboardQuickActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <Link to="/new-coin" className={`${actionClass} border-primary bg-primary text-white hover:bg-primary-hover`}>
        <Plus className={ICON_ACTION} aria-hidden />
        <span className="mt-3 text-sm font-semibold">Submit New Coin</span>
        <span className="text-xs text-white/75">Start a new catalogue entry</span>
      </Link>
      <Link
        to="/my-submissions"
        className={`${actionClass} border-border bg-white text-navy hover:border-primary/30 hover:bg-primary/5`}
      >
        <LayoutList className={ICON_ACTION} aria-hidden />
        <span className="mt-3 text-sm font-semibold">My Submissions</span>
        <span className="text-xs text-navy-muted">Review your full archive</span>
      </Link>
      {latestDraftHref ? (
        <Link
          to={latestDraftHref}
          className={`${actionClass} border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100`}
        >
          <FilePenLine className={ICON_ACTION} aria-hidden />
          <span className="mt-3 text-sm font-semibold">Continue Draft</span>
          <span className="text-xs text-amber-800/80">Finish an unfinished submission</span>
        </Link>
      ) : null}
      <Link
        to="/profile"
        className={`${actionClass} border-border bg-white text-navy hover:border-primary/30 hover:bg-primary/5`}
      >
        <User className={ICON_ACTION} aria-hidden />
        <span className="mt-3 text-sm font-semibold">Profile</span>
        <span className="text-xs text-navy-muted">Account and permissions</span>
      </Link>
    </div>
  )
}
