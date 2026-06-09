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
    <div className="sticky top-16 z-20 rounded-2xl border border-primary/20 bg-white/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur-sm sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">
            {selectedCount} selected
            {pendingSelectedCount !== selectedCount ? (
              <span className="font-normal text-navy-muted">
                {' '}
                · {pendingSelectedCount} pending
              </span>
            ) : null}
          </p>
          {pendingSelectedCount === 0 ? (
            <p className="mt-0.5 text-xs text-navy-muted">Bulk approve/reject applies to pending items only.</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={isProcessing || pendingSelectedCount === 0}
            onClick={onApprove}
            className="!min-h-9 !px-3 !py-2 text-xs sm:text-sm"
          >
            {isProcessing ? 'Processing…' : 'Bulk approve'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isProcessing || pendingSelectedCount === 0}
            onClick={onReject}
            className="!min-h-9 !px-3 !py-2 text-xs text-red-700 sm:text-sm"
          >
            Bulk reject
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isProcessing}
            onClick={onClear}
            className="!min-h-9 !px-3 !py-2 text-xs sm:text-sm"
          >
            Clear selection
          </Button>
        </div>
      </div>
    </div>
  )
}
