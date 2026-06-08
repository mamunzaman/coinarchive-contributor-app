import { Eye, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import { formatSubmittedDate } from '../../lib/format'
import { CompactActionLink } from '../ui/ActionControls'
import { StatusBadge } from '../ui/StatusBadge'

type AdminSubmissionQueueTableProps = {
  submissions: AdminSubmissionListItem[]
  emptyMessage?: string
}

function formatContributor(submission: AdminSubmissionListItem): string {
  if (submission.contributor_name?.trim()) {
    return submission.contributor_name.trim()
  }

  if (submission.contributor_email?.trim()) {
    return submission.contributor_email.trim()
  }

  return '—'
}

export function AdminSubmissionQueueTable({
  submissions,
  emptyMessage = 'No submissions in the queue.',
}: AdminSubmissionQueueTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm text-navy-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Coin title
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Contributor
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Country
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Year
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Last updated
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const detailPath = `/admin/submissions/${submission.id}`
              const editPath = `/my-submissions/${submission.id}/edit`
              const updatedAt = submission.modified_date ?? submission.date

              return (
                <tr
                  key={submission.id}
                  className="border-b border-border/40 last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <Link
                      to={detailPath}
                      className="font-medium text-navy transition-colors hover:text-primary"
                    >
                      {submission.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-navy-muted">{formatContributor(submission)}</td>
                  <td className="px-5 py-4 text-navy-muted">{submission.country?.trim() || '—'}</td>
                  <td className="px-5 py-4 text-navy-muted">{submission.year ?? '—'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-5 py-4 text-navy-muted">{formatSubmittedDate(updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <CompactActionLink to={detailPath} label="Review submission" icon={Eye} />
                      <CompactActionLink
                        to={editPath}
                        label="Edit submission"
                        icon={Pencil}
                        variant="neutral"
                      />
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
