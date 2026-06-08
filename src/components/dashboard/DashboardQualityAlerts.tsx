import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import type { QualityAlert } from '../../lib/qualityAlerts'

type DashboardQualityAlertsProps = {
  alerts: QualityAlert[]
  isLoading?: boolean
}

export function DashboardQualityAlerts({ alerts, isLoading = false }: DashboardQualityAlertsProps) {
  if (!isLoading && alerts.length === 0) {
    return null
  }

  return (
    <Card className="!p-4 sm:!p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
        <h2 className="font-serif text-base font-semibold text-navy sm:text-lg">Quality alerts</h2>
      </div>
      <p className="mt-1 text-sm text-navy-muted">
        Improve submission quality before review.
      </p>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[1, 2].map((row) => (
            <div key={row} className="h-14 animate-pulse rounded-lg bg-panel" />
          ))}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                to={alert.href}
                className={[
                  'block rounded-xl border px-3 py-3 transition-colors hover:bg-white',
                  alert.severity === 'critical'
                    ? 'border-red-200 bg-red-50/70 hover:border-red-300'
                    : 'border-amber-200 bg-amber-50/70 hover:border-amber-300',
                ].join(' ')}
              >
                <p className="text-sm font-medium text-navy">{alert.title}</p>
                <p className="mt-0.5 text-xs text-navy-muted">{alert.message}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
