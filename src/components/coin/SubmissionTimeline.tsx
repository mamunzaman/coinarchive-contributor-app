import { CheckCircle2, Circle } from 'lucide-react'
import type { TimelineEvent } from '../../lib/submissionTimeline'

type SubmissionTimelineProps = {
  events: TimelineEvent[]
}

export function SubmissionTimeline({ events }: SubmissionTimelineProps) {
  if (events.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-border/40 bg-white/80 p-5 sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-navy">Submission timeline</h2>
      <ol className="mt-5 space-y-0">
        {events.map((event, index) => (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < events.length - 1 ? (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 mt-0.5 shrink-0">
              {event.completed ? (
                <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
              ) : (
                <Circle className="h-6 w-6 text-navy-muted/40" aria-hidden />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-navy">{event.label}</p>
              <p className="mt-0.5 text-sm text-navy-muted">{event.formattedDate}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
