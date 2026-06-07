import { Card } from '../ui/Card'
import type { SubmissionStats } from '../../lib/submissionStats'

type DashboardStatCardsProps = {
  stats: SubmissionStats
  isLoading?: boolean
}

const statItems = [
  { key: 'total', label: 'Total submissions' },
  { key: 'pending', label: 'Pending review' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Needs changes' },
] as const

export function DashboardStatCards({ stats, isLoading = false }: DashboardStatCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.key} className="!p-4 sm:!p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-muted">{item.label}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-14 animate-pulse rounded-lg bg-panel" aria-hidden="true" />
          ) : (
            <p className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-[1.75rem]">
              {stats[item.key]}
            </p>
          )}
        </Card>
      ))}
    </div>
  )
}
