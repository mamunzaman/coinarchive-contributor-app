import { useState } from 'react'
import { ActivityLogList } from './ActivityLogList'
import { SubmissionActivityModal } from './SubmissionActivityModal'
import { Button } from '../ui/Button'
import type { SubmissionActivityLogsPayload } from '../../lib/api'

type SubmissionActivityTimelineProps = {
  activityLogs: SubmissionActivityLogsPayload
  submissionId: number
}

export function SubmissionActivityTimeline({
  activityLogs,
  submissionId,
}: SubmissionActivityTimelineProps) {
  const [showAllActivity, setShowAllActivity] = useState(false)
  const recent = activityLogs.recent ?? []
  const total = activityLogs.total ?? recent.length

  return (
    <>
      <section className="rounded-2xl border border-border/40 bg-white/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-navy">Activity</h2>
            {total > 0 ? (
              <p className="mt-0.5 text-sm text-navy-muted">
                {total} event{total === 1 ? '' : 's'} recorded
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <ActivityLogList logs={recent} />
        </div>

        {total > 5 ? (
          <div className="mt-5 border-t border-border/60 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAllActivity(true)}>
              View all activity
            </Button>
          </div>
        ) : null}
      </section>

      <SubmissionActivityModal
        open={showAllActivity}
        submissionId={submissionId}
        onClose={() => setShowAllActivity(false)}
      />
    </>
  )
}
