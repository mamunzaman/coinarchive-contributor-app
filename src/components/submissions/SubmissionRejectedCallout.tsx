import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { CoinSubmission, CoinSubmissionDetail } from '../../lib/api'
import { getSubmissionRejectionInfo } from '../../lib/submissionRevisionNotes'
import { isRejectedSubmissionStatus } from '../../lib/submissionStatus'

type SubmissionRejectedCalloutProps = {
  submission: CoinSubmission | CoinSubmissionDetail
  variant?: 'card' | 'table' | 'detail'
}

export function SubmissionRejectedCallout({
  submission,
  variant = 'card',
}: SubmissionRejectedCalloutProps) {
  const { t } = useTranslation()

  if (!isRejectedSubmissionStatus(submission.status)) {
    return null
  }

  const rejectionInfo = getSubmissionRejectionInfo(submission)
  const feedback = rejectionInfo.notes.join('\n\n')
  const detailPath = `/my-submissions/${submission.id}`

  if (variant === 'detail') {
    return (
      <section
        role="status"
        aria-live="polite"
        className="submission-status-banner submission-status-banner--rejected"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-700" aria-hidden />
            <h2 className="text-base font-semibold text-red-950">
              {t('detail.rejectedBannerTitle')}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-red-900">
            {t('detail.rejectedBannerBody')}
          </p>
          {feedback ? (
            <div className="mt-3 rounded-lg border border-red-200/80 bg-white/70 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-800">
                {t('detail.rejectionFeedback')}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-red-950">
                {feedback}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    )
  }

  const compact = variant === 'table'

  return (
    <div
      role="status"
      className={[
        'rounded-lg border border-red-200 bg-red-50/90 text-red-950',
        compact ? 'px-2.5 py-2' : 'px-3 py-3',
      ].join(' ')}
    >
      <p className={['font-semibold', compact ? 'text-xs' : 'text-sm'].join(' ')}>
        {t('submissions.rejectedHelper')}
      </p>
      {feedback ? (
        <p
          className={[
            'mt-1 text-red-900',
            compact ? 'line-clamp-2 text-[11px] leading-snug' : 'text-xs leading-relaxed',
          ].join(' ')}
        >
          {feedback}
        </p>
      ) : null}
      {variant === 'card' ? (
        <Link
          to={detailPath}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 underline-offset-2 hover:underline"
        >
          {t('submissions.viewRejectionDetails')}
        </Link>
      ) : null}
    </div>
  )
}
