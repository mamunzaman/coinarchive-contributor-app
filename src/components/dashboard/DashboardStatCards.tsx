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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.key} className="text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{item.label}</p>
          {isLoading ? (
            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-panel" aria-hidden="true" />
          ) : (
            <p className="mt-2 font-serif text-3xl font-semibold text-navy">{stats[item.key]}</p>
          )}
        </Card>
      ))}
    </div>
  )
}
