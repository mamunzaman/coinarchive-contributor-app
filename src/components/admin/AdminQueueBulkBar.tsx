import { Button } from '../ui/Button'

type AdminQueueBulkBarProps = {
  selectedCount: number
  pendingSelectedCount: number
  isProcessing: boolean
  onApprove: () => void
  onReject: () => void
  onClear: () => void
}

export function AdminQueueBulkBar({
  selectedCount,
  pendingSelectedCount,
  isProcessing,
  onApprove,
  onReject,
  onClear,
}: AdminQueueBulkBarProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="sticky top-16 z-20 overflow-hidden rounded-2xl border border-primary/20 bg-white/96 shadow-[0_4px_20px_rgba(28,28,30,0.1)] backdrop-blur-md">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold text-navy">
            {selectedCount} {selectedCount === 1 ? 'submission' : 'submissions'} selected
            {pendingSelectedCount !== selectedCount ? (
              <span className="font-normal text-navy-muted">
                {' '}· {pendingSelectedCount} pending
              </span>
            ) : null}
          </p>
          {pendingSelectedCount === 0 ? (
            <p className="mt-0.5 text-xs text-navy-muted">
              Bulk actions apply to pending items only.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={isProcessing || pendingSelectedCount === 0}
            onClick={onApprove}
            className="!min-h-9 !rounded-lg !px-4 !py-2 text-xs sm:text-sm"
          >
            {isProcessing ? 'Processing…' : `Approve ${pendingSelectedCount > 0 ? pendingSelectedCount : ''}`}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isProcessing || pendingSelectedCount === 0}
            onClick={onReject}
            className="!min-h-9 !rounded-lg !border-red-200 !px-4 !py-2 text-xs text-red-700 hover:!bg-red-50 sm:text-sm"
          >
            Reject
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isProcessing}
            onClick={onClear}
            className="!min-h-9 !rounded-lg !px-3 !py-2 text-xs text-navy-muted sm:text-sm"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}
