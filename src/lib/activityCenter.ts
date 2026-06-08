import type { CoinSubmission } from './api'
import { formatSubmittedDate } from './format'

export type ActivitySummary = {
  pendingReview: number
  needsRevision: number
  approvedThisMonth: number
}

export type ActivityFeedItem = {
  id: string
  submissionId: number
  title: string
  message: string
  date: string
  formattedDate: string
  status: string
}

const REVISION_STATUSES = new Set([
  'needs_revision',
  'needs-revision',
  'needs_changes',
  'needs-changes',
  'rejected',
  'declined',
])

function parseDate(date: string): Date | null {
  const parsed = new Date(date.includes('T') ? date : date.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isThisMonth(date: string): boolean {
  const parsed = parseDate(date)
  if (!parsed) {
    return false
  }

  const now = new Date()
  return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear()
}

function getActivityMessage(status: string): string {
  const normalized = status.toLowerCase()

  if (normalized === 'publish' || normalized === 'published') {
    return 'Coin approved'
  }

  if (REVISION_STATUSES.has(normalized)) {
    return 'Revision requested'
  }

  if (normalized === 'pending') {
    return 'Coin submitted'
  }

  if (normalized === 'draft') {
    return 'Draft saved'
  }

  return 'Submission updated'
}

export function computeActivitySummary(submissions: CoinSubmission[]): ActivitySummary {
  return submissions.reduce<ActivitySummary>(
    (summary, submission) => {
      const status = submission.status.toLowerCase()

      if (status === 'pending') {
        summary.pendingReview += 1
      }

      if (REVISION_STATUSES.has(status)) {
        summary.needsRevision += 1
      }

      if ((status === 'publish' || status === 'published') && isThisMonth(submission.date)) {
        summary.approvedThisMonth += 1
      }

      return summary
    },
    { pendingReview: 0, needsRevision: 0, approvedThisMonth: 0 },
  )
}

export function buildActivityFeed(
  submissions: CoinSubmission[],
  limit = 6,
): ActivityFeedItem[] {
  return [...submissions]
    .sort((left, right) => {
      const leftTime = parseDate(left.date)?.getTime() ?? 0
      const rightTime = parseDate(right.date)?.getTime() ?? 0
      return rightTime - leftTime
    })
    .slice(0, limit)
    .map((submission) => ({
      id: `${submission.id}-${submission.date}`,
      submissionId: submission.id,
      title: submission.title,
      message: getActivityMessage(submission.status),
      date: submission.date,
      formattedDate: formatSubmittedDate(submission.date),
      status: submission.status,
    }))
}
