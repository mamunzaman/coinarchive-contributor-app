import { Link } from 'react-router-dom'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getContributorLabel,
  getSubmissionCoinCode,
  getSubmissionUpdatedAt,
  isPendingAdminSubmission,
} from '../../lib/adminQueueFilters'
import { formatSubmittedDate } from '../../lib/format'
import { getSubmissionPreviewUrl } from '../../lib/submissionListUtils'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'

type AdminSubmissionQueueMobileCardsProps = {
  submissions: AdminSubmissionListItem[]
  selectedIds: Set<number>
  onToggleRow: (id: number) => void
  onQuickApprove: (submission: AdminSubmissionListItem) => void
  onQuickReject: (submission: AdminSubmissionListItem) => void
  actionSubmissionId?: number | null
  emptyMessage?: string
}

export function AdminSubmissionQueueMobileCards({
  submissions,
  selectedIds,
  onToggleRow,
  onQuickApprove,
  onQuickReject,
  actionSubmissionId = null,
  emptyMessage = 'No submissions match this filter.',
}: AdminSubmissionQueueMobileCardsProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-surface px-5 py-10 text-center shadow-[var(--shadow-card)] md:hidden">
        <p className="text-sm text-navy-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:hidden">
      {submissions.map((submission) => {
        const detailPath = `/admin/submissions/${submission.id}`
        const previewUrl = getSubmissionPreviewUrl(submission)
        const coinCode = getSubmissionCoinCode(submission)
        const isPending = isPendingAdminSubmission(submission)
        const isSelected = selectedIds.has(submission.id)
        const isRowBusy = actionSubmissionId === submission.id

        return (
          <article
            key={submission.id}
            className={[
              'rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]',
              isSelected ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/70',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleRow(submission.id)}
                aria-label={`Select ${submission.title}`}
                className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
              />
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg border border-border/60 bg-white object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 font-serif text-navy-muted">
                  ◎
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={detailPath} className="font-medium text-navy hover:text-primary">
                      {submission.title}
                    </Link>
                    {coinCode ? (
                      <p className="mt-0.5 font-mono text-[11px] text-navy-muted">{coinCode}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={submission.status} />
                </div>
                <p className="mt-2 text-sm text-navy-muted">{getContributorLabel(submission)}</p>
                <p className="mt-1 text-xs text-navy-muted">
                  {[submission.country?.trim(), submission.year != null ? String(submission.year) : null]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
                <p className="mt-1 text-xs text-navy-muted">
                  Updated {formatSubmittedDate(getSubmissionUpdatedAt(submission))}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={detailPath} className="flex-1 sm:flex-none">
                <Button type="button" fullWidth className="!min-h-10 !py-2 text-sm">
                  Review
                </Button>
              </Link>
              {isPending ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isRowBusy}
                    onClick={() => onQuickApprove(submission)}
                    className="flex-1 !min-h-10 !py-2 text-sm sm:flex-none"
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isRowBusy}
                    onClick={() => onQuickReject(submission)}
                    className="flex-1 !min-h-10 !py-2 text-sm text-red-700 sm:flex-none"
                  >
                    Reject
                  </Button>
                </>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
