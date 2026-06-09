import { useState } from 'react'
import { ActivityLogList } from './ActivityLogList'
import { SubmissionActivityModal } from './SubmissionActivityModal'
import { Button } from '../ui/Button'
import { DetailSectionCard } from './SubmissionDetailCard'
import type { SubmissionActivityLogsPayload } from '../../lib/api'

const COMPACT_ACTIVITY_LIMIT = 5

type SubmissionActivityTimelineProps = {
  activityLogs: SubmissionActivityLogsPayload
  submissionId: number
  compact?: boolean
  bare?: boolean
}

export function SubmissionActivityTimeline({
  activityLogs,
  submissionId,
  compact = false,
  bare = false,
}: SubmissionActivityTimelineProps) {
  const [showAllActivity, setShowAllActivity] = useState(false)
  const recent = activityLogs.recent ?? []
  const total = activityLogs.total ?? recent.length
  const visibleLogs = compact ? recent.slice(0, COMPACT_ACTIVITY_LIMIT) : recent

  const body = (
    <>
      <ActivityLogList logs={visibleLogs} compact={compact} />

      {total > COMPACT_ACTIVITY_LIMIT ? (
        <div className="mt-4 border-t border-border/50 pt-3">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => setShowAllActivity(true)}
          >
            View full activity
          </Button>
        </div>
      ) : null}
    </>
  )

  return (
    <>
      {bare ? (
        body
      ) : (
        <DetailSectionCard
          title="Activity"
          subtitle={
            total > 0 ? `${total} event${total === 1 ? '' : 's'} recorded` : 'Submission history'
          }
        >
          {body}
        </DetailSectionCard>
      )}

      <SubmissionActivityModal
        open={showAllActivity}
        submissionId={submissionId}
        onClose={() => setShowAllActivity(false)}
      />
    </>
  )
}
