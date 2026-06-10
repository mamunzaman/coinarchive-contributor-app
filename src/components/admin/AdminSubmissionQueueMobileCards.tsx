import { Link } from 'react-router-dom'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getSubmissionUpdatedAt,
  isPendingAdminSubmission,
} from '../../lib/adminQueueFilters'
import { getSubmissionDuplicateRisk } from '../../lib/duplicateProtection'
import { formatSubmittedDate } from '../../lib/format'
import { AdminQueueCoinCell } from './AdminQueueCoinCell'
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
      <div className="rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white px-5 py-10 text-center shadow-[0_4px_24px_rgba(15,23,42,0.1)] lg:hidden">
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 lg:hidden">
      {submissions.map((submission) => {
        const detailPath = `/admin/submissions/${submission.id}`
        const isPending = isPendingAdminSubmission(submission)
        const isSelected = selectedIds.has(submission.id)
        const isRowBusy = actionSubmissionId === submission.id
        const duplicateRisk = getSubmissionDuplicateRisk(submission)

        return (
          <article
            key={submission.id}
            className={[
              'overflow-hidden rounded-2xl border bg-white shadow-[0_2px_8px_rgba(15,23,42,0.07)] transition-shadow',
              isSelected
                ? 'border-teal-300/50 ring-1 ring-teal-400/20'
                : 'border-[rgba(15,23,42,0.08)]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[rgba(15,23,42,0.06)] bg-[#F9FAFB] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRow(submission.id)}
                  aria-label={`Select ${submission.title}`}
                  className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                />
                <StatusBadge status={submission.status} />
              </div>
              <p className="text-right text-[11px] text-slate-400">
                Updated {formatSubmittedDate(getSubmissionUpdatedAt(submission))}
              </p>
            </div>

            <div className="p-3.5">
              <AdminQueueCoinCell submission={submission} detailPath={detailPath} />

              <p className="mt-3 text-[11px] text-slate-400">
                Submitted {formatSubmittedDate(submission.date)}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link to={detailPath} state={{ duplicateRisk }} className="min-w-[5rem] flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    className="!min-h-9 !rounded-lg !border-slate-200 !bg-white !py-2 !text-[12px] !font-semibold !text-slate-700 hover:!border-slate-300 hover:!bg-slate-50"
                  >
                    Review
                  </Button>
                </Link>
                {isPending ? (
                  <>
                    <Button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() => onQuickApprove(submission)}
                      className="min-w-[5rem] flex-1 !min-h-9 !rounded-lg !bg-teal-500 !py-2 !text-[12px] !font-semibold !text-white hover:!bg-teal-600"
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isRowBusy}
                      onClick={() => onQuickReject(submission)}
                      className="min-w-[5rem] flex-1 !min-h-9 !rounded-lg !py-2 !text-[11px] !font-medium !text-red-500 hover:!bg-red-50 hover:!text-red-600"
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
