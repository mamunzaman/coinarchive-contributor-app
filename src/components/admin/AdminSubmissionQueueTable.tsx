import { Check, Eye, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getAdminQueueStatusCategory,
  getSubmissionUpdatedAt,
  isPendingAdminSubmission,
} from '../../lib/adminQueueFilters'
import { formatSubmittedDate } from '../../lib/format'
import { AdminQueueCoinCell } from './AdminQueueCoinCell'
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

// 2px inset left border via box-shadow — works on <tr> across all browsers
function getRowAccentClass(status: string): string {
  const cat = getAdminQueueStatusCategory(status)
  switch (cat) {
    case 'pending':       return 'shadow-[inset_2px_0_0_0_#f59e0b]'
    case 'approved':      return 'shadow-[inset_2px_0_0_0_#14b8a6]'
    case 'rejected':      return 'shadow-[inset_2px_0_0_0_#f87171]'
    case 'needs_revision':return 'shadow-[inset_2px_0_0_0_#fb923c]'
    case 'draft':         return 'shadow-[inset_2px_0_0_0_#cbd5e1]'
    default:              return ''
  }
}

// Shared icon button base — all three buttons use this
const iconBtnBase =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40'

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
  const cardClass =
    'overflow-hidden rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)]'

  const containerClass =
    variant === 'preview' ? cardClass : `hidden md:block ${cardClass}`

  if (submissions.length === 0) {
    return (
      <div
        className={
          variant === 'preview'
            ? `${cardClass} px-6 py-14 text-center`
            : `hidden md:block ${cardClass} px-6 py-14 text-center`
        }
      >
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  const allIds = submissions.map((s) => s.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))
  const someSelected = allIds.some((id) => selectedIds.has(id))

  const showSelection = !readOnly && Boolean(onToggleRow && onToggleAll)
  const showQuickActions = !readOnly && Boolean(onQuickApprove && onQuickReject)

  return (
    <div className={containerClass}>
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          {showSelection ? <col className="w-10" /> : null}
          {/* Coin — takes remaining space */}
          <col />
          {/* Review status */}
          <col className="w-[128px] xl:w-[144px]" />
          {/* Updated */}
          <col className="w-[96px] xl:w-[112px]" />
          {/* Actions — fixed to fit 3 × h-8/w-8 buttons + gaps */}
          <col className="w-[100px] xl:w-[108px]" />
        </colgroup>

        {/* ── Header ── */}
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-[rgba(15,23,42,0.06)] bg-[#F9FAFB]">
            {showSelection ? (
              <th className="py-2.5 pl-4 pr-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected }}
                  onChange={() => onToggleAll?.(allIds)}
                  aria-label="Select all submissions"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
              </th>
            ) : null}
            <th className="py-2.5 pl-4 pr-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:pl-5">
              Coin
            </th>
            <th className="py-2.5 pr-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Review status
            </th>
            <th className="py-2.5 pr-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Updated
            </th>
            <th className="py-2.5 pr-4 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:pr-5">
              Actions
            </th>
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody className="divide-y divide-[rgba(15,23,42,0.05)]">
          {submissions.map((submission) => {
            const detailPath = `/admin/submissions/${submission.id}`
            const isPending = isPendingAdminSubmission(submission)
            const isSelected = selectedIds.has(submission.id)
            const isRowBusy = actionSubmissionId === submission.id

            return (
              <tr
                key={submission.id}
                className={[
                  'transition-colors',
                  getRowAccentClass(submission.status),
                  isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50/70',
                ].join(' ')}
              >
                {showSelection ? (
                  <td className="py-3 pl-4 pr-2 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleRow?.(submission.id)}
                      aria-label={`Select ${submission.title}`}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                  </td>
                ) : null}

                {/* Coin cell */}
                <td className="py-3 pl-4 pr-3 align-middle xl:pl-5">
                  <AdminQueueCoinCell submission={submission} detailPath={detailPath} compact />
                </td>

                {/* Status */}
                <td className="py-3 pr-3 align-middle">
                  <StatusBadge status={submission.status} />
                </td>

                {/* Updated */}
                <td className="py-3 pr-3 align-middle text-[11px] leading-snug text-slate-400">
                  {formatSubmittedDate(getSubmissionUpdatedAt(submission))}
                </td>

                {/* Actions — fixed right edge; pending gets 3 buttons, others get 1 */}
                <td className="py-3 pr-4 align-middle xl:pr-5">
                  <div className="flex items-center justify-end gap-1">
                    {/* Approve + Reject only for pending — placed LEFT of Review so Review is always rightmost */}
                    {isPending && showQuickActions ? (
                      <>
                        <button
                          type="button"
                          title="Approve submission"
                          aria-label="Approve submission"
                          disabled={isRowBusy}
                          onClick={() => onQuickApprove?.(submission)}
                          className={`${iconBtnBase} bg-teal-500 text-white shadow-sm hover:bg-teal-600`}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          title="Reject submission"
                          aria-label="Reject submission"
                          disabled={isRowBusy}
                          onClick={() => onQuickReject?.(submission)}
                          className={`${iconBtnBase} border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600`}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </>
                    ) : null}
                    {/* Review is always the rightmost button */}
                    <Link
                      to={detailPath}
                      title="Review submission"
                      aria-label="Review submission"
                      className={`${iconBtnBase} border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700`}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
