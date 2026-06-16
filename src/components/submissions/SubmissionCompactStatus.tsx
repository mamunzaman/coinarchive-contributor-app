import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { CoinSubmission, CoinSubmissionDetail } from '../../lib/api'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  formatSubmissionFeedbackNotes,
  getSubmissionStatusFeedback,
} from '../../lib/submissionRevisionNotes'
import { StatusBadge } from '../ui/StatusBadge'
import { SubmissionFeedbackPopover } from './SubmissionFeedbackPopover'

type SubmissionListRecord = CoinSubmission | CoinSubmissionDetail | AdminSubmissionListItem

type SubmissionCompactStatusProps = {
  submission: SubmissionListRecord
  layout?: 'table' | 'card'
  showBadge?: boolean
}

function buildFeedbackPopoverProps(
  submission: SubmissionListRecord,
  feedback: NonNullable<ReturnType<typeof getSubmissionStatusFeedback>>,
  message: string,
  options: {
    titleRevision: string
    titleRejected: string
    introRevision: string
    introRejected: string
    actionLabel?: string
    actionHref?: string
    triggerRevision: string
    triggerRejected: string
  },
) {
  const isRevision = feedback.type === 'needs_revision'

  return {
    status: submission.status,
    type: feedback.type,
    title: isRevision ? options.titleRevision : options.titleRejected,
    intro: isRevision ? options.introRevision : options.introRejected,
    message: message || undefined,
    actionLabel: options.actionLabel,
    actionHref: options.actionHref,
    triggerLabel: isRevision ? options.triggerRevision : options.triggerRejected,
  }
}

export function SubmissionCompactStatus({
  submission,
  layout = 'table',
  showBadge = layout === 'table',
}: SubmissionCompactStatusProps) {
  const { t } = useTranslation()
  const feedback = getSubmissionStatusFeedback(submission)
  const message = feedback ? formatSubmissionFeedbackNotes(feedback.notes) : ''

  if (!feedback) {
    return showBadge ? (
      <div className="submission-compact-status flex max-w-full flex-wrap items-center gap-1.5">
        <StatusBadge status={submission.status} />
      </div>
    ) : null
  }

  const isRevision = feedback.type === 'needs_revision'
  const popoverProps = buildFeedbackPopoverProps(submission, feedback, message, {
    titleRevision: t('submissions.feedbackRevisionTitle'),
    titleRejected: t('submissions.feedbackRejectedTitle'),
    introRevision: t('submissions.needsRevisionHelper'),
    introRejected: t('submissions.rejectedHelper'),
    actionLabel: isRevision ? t('submissions.reviewRequestedChanges') : undefined,
    actionHref: isRevision ? `/my-submissions/${submission.id}/edit` : undefined,
    triggerRevision: t('submissions.viewRevisionFeedbackAria'),
    triggerRejected: t('submissions.viewRejectionFeedbackAria'),
  })

  if (layout === 'card') {
    return (
      <div
        className={[
          'submission-card-status-hint flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border px-3 py-2',
          isRevision
            ? 'border-amber-200/70 bg-amber-50/40'
            : 'border-red-200/70 bg-red-50/40',
        ].join(' ')}
      >
        <SubmissionFeedbackPopover {...popoverProps} />
        <Link
          to={isRevision ? `/my-submissions/${submission.id}/edit` : `/my-submissions/${submission.id}`}
          className={[
            'text-xs font-semibold underline-offset-2 hover:underline',
            isRevision ? 'text-amber-800' : 'text-red-800',
          ].join(' ')}
        >
          {isRevision ? t('submissions.reviewRequestedChanges') : t('submissions.viewRejectionDetails')}
        </Link>
      </div>
    )
  }

  if (!showBadge) {
    return null
  }

  return (
    <div className="submission-compact-status flex max-w-full flex-wrap items-center gap-1.5">
      <SubmissionFeedbackPopover {...popoverProps} />
    </div>
  )
}

export function AdminCompactStatus({ submission }: { submission: AdminSubmissionListItem }) {
  const { t } = useTranslation()
  const feedback = getSubmissionStatusFeedback(submission)
  const message = feedback ? formatSubmissionFeedbackNotes(feedback.notes) : ''

  if (!feedback) {
    return (
      <div className="submission-compact-status flex max-w-full flex-wrap items-center justify-center gap-1.5 lg:justify-start">
        <StatusBadge status={submission.status} />
      </div>
    )
  }

  return (
    <div className="submission-compact-status flex max-w-full flex-wrap items-center justify-center gap-1.5 lg:justify-start">
      <SubmissionFeedbackPopover
        {...buildFeedbackPopoverProps(submission, feedback, message, {
          titleRevision: t('admin.feedbackRevisionTitle'),
          titleRejected: t('admin.feedbackRejectedTitle'),
          introRevision: t('admin.feedbackRevisionIntro'),
          introRejected: t('admin.feedbackRejectedIntro'),
          actionLabel: t('admin.feedbackViewSubmission'),
          actionHref: `/admin/submissions/${submission.id}`,
          triggerRevision: t('admin.viewRevisionFeedbackAria'),
          triggerRejected: t('admin.viewRejectionFeedbackAria'),
        })}
      />
    </div>
  )
}
