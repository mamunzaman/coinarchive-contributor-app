import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'
import { formatSubmittedDate } from '../../lib/format'
import { canDeleteSubmission, canEditSubmission } from '../../lib/submissionListUtils'
import { CompactActionButton, CompactActionLink } from '../ui/ActionControls'
import { StatusBadge } from '../ui/StatusBadge'

type SubmissionTableViewProps = {
  submissions: CoinSubmission[]
  onDelete?: (submission: CoinSubmission) => void
}

export function SubmissionTableView({ submissions, onDelete }: SubmissionTableViewProps) {
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
              const deletable = canDeleteSubmission(submission)
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
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <CompactActionLink to={detailPath} label="View submission" icon={Eye} />
                      {editable ? (
                        <CompactActionLink
                          to={editPath}
                          label="Edit submission"
                          icon={Pencil}
                          variant="neutral"
                        />
                      ) : null}
                      {deletable && onDelete ? (
                        <CompactActionButton
                          label="Delete submission"
                          icon={Trash2}
                          onClick={() => onDelete(submission)}
                        />
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
