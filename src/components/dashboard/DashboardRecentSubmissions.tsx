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
    <div className="overflow-hidden rounded-xl border border-border/70 bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-serif text-base font-semibold text-navy sm:text-lg">Recent submissions</h2>
          <p className="mt-0.5 text-sm text-navy-muted">Latest entries in your archive.</p>
        </div>
        <Link to="/my-submissions" className="action-btn-primary shrink-0">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-border/60">
        {submissions.map((submission) => {
          const previewUrl = getSubmissionPreviewUrl(submission)
          const editable = canEditSubmission(submission)
          const detailPath = `/my-submissions/${submission.id}`
          const editPath = `/my-submissions/${submission.id}/edit`

          return (
            <li
              key={submission.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5 sm:py-3.5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-panel sm:h-20 sm:w-20">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-xl text-primary">
                      ◎
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{submission.title}</p>
                  <p className="mt-0.5 text-sm text-navy-muted">
                    {formatSubmittedDate(submission.date)} · ID {submission.id}
                  </p>
                  <div className="mt-2 sm:hidden">
                    <StatusBadge status={submission.status} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-flex">
                  <StatusBadge status={submission.status} />
                </span>
                <Link to={detailPath} className="action-btn-primary min-w-[4.5rem]">
                  View
                </Link>
                {editable ? (
                  <Link to={editPath} className="action-btn-neutral min-w-[4.5rem]">
                    Edit
                  </Link>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
