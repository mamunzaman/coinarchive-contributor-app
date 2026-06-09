import { Check, Eye, X } from 'lucide-react'
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
import { CompactActionButton, CompactActionLink } from '../ui/ActionControls'
import { StatusBadge } from '../ui/StatusBadge'

type AdminSubmissionQueueTableProps = {
  submissions: AdminSubmissionListItem[]
  selectedIds?: Set<number>
  onToggleRow?: (id: number) => void
  onToggleAll?: (ids: number[]) => void
  onQuickApprove?: (submission: AdminSubmissionListItem) => void
  onQuickReject?: (submission: AdminSubmissionListItem) => void
  actionSubmissionId?: number | null
  emptyMessage?: string
  readOnly?: boolean
  variant?: 'full' | 'preview'
}

function CoinThumbnail({ submission }: { submission: AdminSubmissionListItem }) {
  const previewUrl = getSubmissionPreviewUrl(submission)

  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg border border-border/60 bg-white object-cover"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 font-serif text-sm text-navy-muted">
      ◎
    </div>
  )
}

export function AdminSubmissionQueueTable({
  submissions,
  selectedIds = new Set(),
  onToggleRow,
  onToggleAll,
  onQuickApprove,
  onQuickReject,
  actionSubmissionId = null,
  emptyMessage = 'No submissions match this filter.',
  readOnly = false,
  variant = 'full',
}: AdminSubmissionQueueTableProps) {
  const containerClass =
    variant === 'preview' ? 'overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[var(--shadow-card)]' : 'hidden overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[var(--shadow-card)] md:block'

  if (submissions.length === 0) {
    return (
      <div
        className={[
          variant === 'preview'
            ? 'rounded-2xl border border-border/70 bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]'
            : 'hidden rounded-2xl border border-border/70 bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)] md:block',
        ].join(' ')}
      >
        <p className="text-sm text-navy-muted">{emptyMessage}</p>
      </div>
    )
  }

  const allIds = submissions.map((submission) => submission.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))
  const someSelected = allIds.some((id) => selectedIds.has(id))

  const showSelection = !readOnly && Boolean(onToggleRow && onToggleAll)
  const showQuickActions = !readOnly && Boolean(onQuickApprove && onQuickReject)

  return (
    <div className={containerClass}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              {showSelection ? (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = !allSelected && someSelected
                      }
                    }}
                    onChange={() => onToggleAll?.(allIds)}
                    aria-label="Select all submissions"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                </th>
              ) : null}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Coin
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Contributor
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Country / Year
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Updated
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-navy-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const detailPath = `/admin/submissions/${submission.id}`
              const coinCode = getSubmissionCoinCode(submission)
              const isPending = isPendingAdminSubmission(submission)
              const isSelected = selectedIds.has(submission.id)
              const isRowBusy = actionSubmissionId === submission.id

              return (
                <tr
                  key={submission.id}
                  className={[
                    'border-b border-border/40 last:border-b-0',
                    isSelected ? 'bg-primary/[0.03]' : 'hover:bg-muted/30',
                  ].join(' ')}
                >
                  {showSelection ? (
                    <td className="px-4 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleRow?.(submission.id)}
                        aria-label={`Select ${submission.title}`}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-4">
                    <div className="flex min-w-[220px] items-start gap-3">
                      <CoinThumbnail submission={submission} />
                      <div className="min-w-0">
                        <Link
                          to={detailPath}
                          className="block font-medium text-navy transition-colors hover:text-primary"
                        >
                          {submission.title}
                        </Link>
                        {coinCode ? (
                          <p className="mt-0.5 font-mono text-[11px] text-navy-muted">{coinCode}</p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-navy-muted">#{submission.id}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-navy">{getContributorLabel(submission)}</p>
                    {submission.contributor_email ? (
                      <p className="mt-0.5 text-xs text-navy-muted">{submission.contributor_email}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top text-navy-muted">
                    <p>{submission.country?.trim() || '—'}</p>
                    <p className="mt-0.5 text-xs">{submission.year ?? '—'}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-4 py-4 align-top text-navy-muted">
                    {formatSubmittedDate(getSubmissionUpdatedAt(submission))}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <CompactActionLink to={detailPath} label="Review submission" icon={Eye} />
                      {isPending && showQuickActions ? (
                        <>
                          <CompactActionButton
                            label="Quick approve"
                            icon={Check}
                            disabled={isRowBusy}
                            onClick={() => onQuickApprove?.(submission)}
                          />
                          <CompactActionButton
                            label="Quick reject"
                            icon={X}
                            disabled={isRowBusy}
                            onClick={() => onQuickReject?.(submission)}
                          />
                        </>
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
