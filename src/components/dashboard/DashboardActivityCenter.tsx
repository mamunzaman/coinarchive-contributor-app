import { Activity, CheckCircle2, Clock3, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import type { ActivityFeedItem, ActivitySummary } from '../../lib/activityCenter'

type DashboardActivityCenterProps = {
  summary: ActivitySummary
  feed: ActivityFeedItem[]
  isLoading?: boolean
}

export function DashboardActivityCenter({
  summary,
  feed,
  isLoading = false,
}: DashboardActivityCenterProps) {
  return (
    <Card className="!p-4 sm:!p-5">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="font-serif text-base font-semibold text-navy sm:text-lg">Activity center</h2>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryPill
          icon={Clock3}
          label="Pending review"
          value={summary.pendingReview}
          isLoading={isLoading}
        />
        <SummaryPill
          icon={AlertCircle}
          label="Needs revision"
          value={summary.needsRevision}
          isLoading={isLoading}
        />
        <SummaryPill
          icon={CheckCircle2}
          label="Approved this month"
          value={summary.approvedThisMonth}
          isLoading={isLoading}
        />
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
          Recent activity
        </p>
        {isLoading ? (
          <div className="mt-3 space-y-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-12 animate-pulse rounded-lg bg-panel" />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <p className="mt-3 text-sm text-navy-muted">No recent activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {feed.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/my-submissions/${item.submissionId}`}
                    className="truncate text-sm font-medium text-navy hover:text-primary"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-navy-muted">
                    {item.message} · {item.formattedDate}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

function SummaryPill({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: typeof Clock3
  label: string
  value: number
  isLoading: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
      <div className="flex items-center gap-2 text-navy-muted">
        <Icon className="h-4 w-4" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      {isLoading ? (
        <div className="mt-2 h-7 w-10 animate-pulse rounded bg-panel" />
      ) : (
        <p className="mt-1 font-serif text-2xl font-semibold text-navy">{value}</p>
      )}
    </div>
  )
}
