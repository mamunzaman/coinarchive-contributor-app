import type { SubmissionActivityLog } from '../../lib/api'
import {
  formatActivityDate,
  getActivityActor,
  getActivityEventIcon,
} from '../../lib/submissionActivityUtils'

type ActivityLogListProps = {
  logs: SubmissionActivityLog[]
  compact?: boolean
}

export function ActivityLogList({ logs, compact = false }: ActivityLogListProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-navy-muted">No activity recorded yet.</p>
  }

  return (
    <ol className="space-y-0">
      {logs.map((log, index) => {
        const Icon = getActivityEventIcon(log.event_type)
        const actor = getActivityActor(log)
        const message = log.event_message?.trim()

        return (
          <li key={log.id} className="relative flex gap-4 pb-5 last:pb-0">
            {index < logs.length - 1 ? (
              <span
                className="absolute left-[13px] top-7 h-[calc(100%-0.75rem)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-navy">{log.event_label}</p>
              {message ? (
                <p className={['mt-0.5 text-navy-muted', compact ? 'text-xs' : 'text-sm'].join(' ')}>
                  {message}
                </p>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-navy-muted">
                <time dateTime={log.created_at}>{formatActivityDate(log.created_at)}</time>
                {actor ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{actor}</span>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
