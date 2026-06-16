import { AlertTriangle, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { CoinSubmission, CoinSubmissionDetail } from '../../lib/api'
import { getSubmissionRevisionInfo } from '../../lib/submissionRevisionNotes'
import { isNeedsRevisionSubmissionStatus } from '../../lib/submissionStatus'

type SubmissionNeedsRevisionCalloutProps = {
  submission: CoinSubmission | CoinSubmissionDetail
  variant?: 'card' | 'table' | 'detail'
}

export function SubmissionNeedsRevisionCallout({
  submission,
  variant = 'card',
}: SubmissionNeedsRevisionCalloutProps) {
  const { t } = useTranslation()

  if (!isNeedsRevisionSubmissionStatus(submission.status)) {
    return null
  }

  const revisionInfo = getSubmissionRevisionInfo(submission)
  const feedback = revisionInfo.notes[0] ?? ''
  const editPath = `/my-submissions/${submission.id}/edit`
  const detailPath = `/my-submissions/${submission.id}`

  if (variant === 'detail') {
    return (
      <section
        role="status"
        aria-live="polite"
        className="submission-status-banner submission-status-banner--revision"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
              <h2 className="text-base font-semibold text-amber-950">
                {t('detail.revisionBannerTitle')}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              {t('detail.revisionBannerBody')}
            </p>
            {feedback ? (
              <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                  {t('detail.adminFeedback')}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                  {feedback}
                </p>
              </div>
            ) : null}
          </div>
          <Link
            to={editPath}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t('detail.editAndResubmit')}
          </Link>
        </div>
      </section>
    )
  }

  const compact = variant === 'table'

  if (compact) {
    return null
  }

  return (
    <div
      role="status"
      className={[
        'rounded-lg border border-amber-200 bg-amber-50/90 text-amber-950',
        compact ? 'px-2.5 py-2' : 'px-3 py-3',
      ].join(' ')}
    >
      <p className={['font-semibold', compact ? 'text-xs' : 'text-sm'].join(' ')}>
        {t('submissions.needsRevisionBadge')}
      </p>
      <p className={['mt-1 text-amber-900', compact ? 'text-[11px] leading-snug' : 'text-xs leading-relaxed'].join(' ')}>
        {t('submissions.needsRevisionHelper')}
      </p>
      <Link
        to={variant === 'card' ? editPath : detailPath}
        className={[
          'mt-2 inline-flex items-center gap-1.5 font-semibold text-amber-800 underline-offset-2 hover:underline',
          compact ? 'text-[11px]' : 'text-xs',
        ].join(' ')}
      >
        {t('submissions.reviewRequestedChanges')}
      </Link>
    </div>
  )
}
