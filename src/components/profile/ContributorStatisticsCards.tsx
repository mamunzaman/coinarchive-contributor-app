import type { ContributorStatistics } from '../../lib/contributorStats'

type ContributorStatisticsCardsProps = {
  stats: ContributorStatistics
  isLoading?: boolean
}

const items = [
  { key: 'submitted', label: 'Coins submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'needsRevision', label: 'Needs revision' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'approvalRate', label: 'Approval rate', suffix: '%' },
] as const

export function ContributorStatisticsCards({
  stats,
  isLoading = false,
}: ContributorStatisticsCardsProps) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-navy">Contributor statistics</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-border/70 bg-white px-4 py-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-muted">
              {item.label}
            </p>
            {isLoading ? (
              <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-panel" aria-hidden />
            ) : (
              <p className="mt-1 font-serif text-2xl font-semibold text-navy">
                {stats[item.key]}
                {'suffix' in item ? item.suffix : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
