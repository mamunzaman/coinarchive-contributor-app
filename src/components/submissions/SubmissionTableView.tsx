import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'
import { formatSubmittedDate } from '../../lib/format'
import { canEditSubmission } from '../../lib/submissionListUtils'
import { StatusBadge } from '../ui/StatusBadge'

type SubmissionTableViewProps = {
  submissions: CoinSubmission[]
}

export function SubmissionTableView({ submissions }: SubmissionTableViewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Title
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Submitted
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Post ID
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const editable = canEditSubmission(submission)
              const detailPath = `/my-submissions/${submission.id}`
              const editPath = `/my-submissions/${submission.id}/edit`

              return (
                <tr
                  key={submission.id}
                  className="border-b border-border/40 last:border-b-0 hover:bg-muted/30 [&_td]:py-4"
                >
                  <td className="px-5 py-4">
                    <Link
                      to={detailPath}
                      className="font-medium text-navy transition-colors hover:text-primary"
                    >
                      {submission.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-5 py-4 text-navy-muted">
                    {formatSubmittedDate(submission.date)}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-navy-muted">{submission.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={detailPath} className="action-btn-primary min-w-[4.5rem]">
                        View
                      </Link>
                      {editable ? (
                        <Link to={editPath} className="action-btn-neutral min-w-[4.5rem]">
                          Edit
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
