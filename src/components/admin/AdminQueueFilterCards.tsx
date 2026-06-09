import type { AdminQueueCounts, AdminQueueStatusFilter } from '../../lib/adminQueueFilters'

type AdminQueueFilterCardsProps = {
  counts: AdminQueueCounts
  activeFilter: AdminQueueStatusFilter
  onFilterChange: (filter: AdminQueueStatusFilter) => void
}

const FILTER_ITEMS: Array<{ key: AdminQueueStatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'needs_revision', label: 'Needs revision' },
  { key: 'draft', label: 'Draft' },
]

export function AdminQueueFilterCards({
  counts,
  activeFilter,
  onFilterChange,
}: AdminQueueFilterCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {FILTER_ITEMS.map((item) => {
        const isActive = activeFilter === item.key

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onFilterChange(item.key)}
            className={[
              'rounded-2xl border px-3 py-3 text-left transition-colors sm:px-4 sm:py-3.5',
              isActive
                ? 'border-primary/40 bg-primary/5 shadow-[var(--shadow-card)] ring-1 ring-primary/15'
                : 'border-border/70 bg-surface hover:border-primary/25 hover:bg-page/60',
            ].join(' ')}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted sm:text-[11px]">
              {item.label}
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-navy sm:text-2xl">{counts[item.key]}</p>
          </button>
        )
      })}
    </div>
  )
}
