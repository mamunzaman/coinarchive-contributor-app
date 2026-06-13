import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getAdminQueueStatusCategory,
  isPendingAdminSubmission,
} from '../../lib/adminQueueFilters'
import { getSubmissionDuplicateRisk } from '../../lib/duplicateProtection'
import { AdminQueueCardMetaRow, AdminQueueCoinCell } from './AdminQueueCoinCell'
import { AdminQueueCardActionBar } from '../ui/ActionControls'
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

function getCardAccentClass(status: string): string {
  const cat = getAdminQueueStatusCategory(status)
  switch (cat) {
    case 'pending':
      return 'shadow-[inset_3px_0_0_0_#f59e0b]'
    case 'approved':
      return 'shadow-[inset_3px_0_0_0_#14b8a6]'
    case 'rejected':
      return 'shadow-[inset_3px_0_0_0_#f87171]'
    case 'needs_revision':
      return 'shadow-[inset_3px_0_0_0_#fb923c]'
    case 'draft':
      return 'shadow-[inset_3px_0_0_0_#cbd5e1]'
    default:
      return ''
  }
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
      <div className="admin-queue-cards-empty rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white px-5 py-10 text-center shadow-[0_4px_24px_rgba(15,23,42,0.1)] lg:hidden">
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="admin-queue-cards space-y-2 lg:hidden">
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
              'admin-queue-card overflow-hidden rounded-2xl border bg-white shadow-[0_2px_8px_rgba(15,23,42,0.07)] transition-shadow hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)]',
              getCardAccentClass(submission.status),
              isSelected
                ? 'border-teal-300/50 ring-1 ring-teal-400/20'
                : 'border-[rgba(15,23,42,0.08)]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[rgba(15,23,42,0.06)] bg-[#F9FAFB] px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRow(submission.id)}
                  aria-label={`Select ${submission.title}`}
                  className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                />
                <StatusBadge status={submission.status} />
              </div>
              <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-500">
                #{submission.id}
              </span>
            </div>

            <div className="px-3 py-2.5">
              <AdminQueueCoinCell submission={submission} detailPath={detailPath} layout="card" />
            </div>

            <AdminQueueCardMetaRow submission={submission} />

            <AdminQueueCardActionBar
              detailPath={detailPath}
              state={{ duplicateRisk }}
              isPending={isPending}
              isRowBusy={isRowBusy}
              onApprove={() => onQuickApprove(submission)}
              onReject={() => onQuickReject(submission)}
            />
          </article>
        )
      })}
    </div>
  )
}
