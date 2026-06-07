import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'
import { formatSubmittedDate } from '../../lib/format'
import { canEditSubmission, getSubmissionPreviewUrl } from '../../lib/submissionListUtils'
import { StatusBadge } from '../ui/StatusBadge'

type DashboardRecentSubmissionsProps = {
  submissions: CoinSubmission[]
}

export function DashboardRecentSubmissions({ submissions }: DashboardRecentSubmissionsProps) {
  if (submissions.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-surface shadow-[var(--shadow-card)]">
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-navy">Recent submissions</h2>
        <p className="mt-1 text-sm text-navy-muted">Your latest coin entries awaiting review or published.</p>
      </div>
      <ul className="divide-y divide-border/60">
        {submissions.map((submission) => {
          const previewUrl = getSubmissionPreviewUrl(submission)
          const editable = canEditSubmission(submission)
          const detailPath = `/my-submissions/${submission.id}`
          const editPath = `/my-submissions/${submission.id}/edit`

          return (
            <li key={submission.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-panel">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-xl text-primary">
                      ◎
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{submission.title}</p>
                  <p className="mt-1 text-sm text-navy-muted">
                    Submitted {formatSubmittedDate(submission.date)}
                  </p>
                  <p className="mt-1 text-xs text-navy-muted">Post ID · {submission.id}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <StatusBadge status={submission.status} />
                <div className="flex items-center gap-3">
                  <Link
                    to={detailPath}
                    className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    View
                  </Link>
                  {editable ? (
                    <Link
                      to={editPath}
                      className="text-sm font-semibold text-navy-muted transition-colors hover:text-navy"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
