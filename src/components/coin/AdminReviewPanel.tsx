import { AlertTriangle, Check, CheckCircle2, ClipboardCheck, ExternalLink, Image, Lock, MessageSquare, RefreshCw, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CoinSubmissionDetail } from '../../lib/api'
import { computeCompletenessScore } from '../../lib/completenessScore'
import { getCoinStepCompletion, type StepCompletionResult } from '../../lib/stepCompletion'
import { coinFormValuesFromSubmission } from '../../types/coinForm'
import { formatSubmittedDate } from '../../lib/format'
import { getSubmissionRejectionInfo, getSubmissionRevisionInfo } from '../../lib/submissionRevisionNotes'
import {
  getAdminReviewActionAvailability,
  getPublishedCoinUrl,
  getSubmissionAllowedActions,
  isApprovedSubmissionStatus,
  isNeedsRevisionSubmissionStatus,
  isRejectedSubmissionStatus,
} from '../../lib/submissionStatus'
import { StatusBadge } from '../ui/StatusBadge'
import { SubmissionImageZoomModal } from './SubmissionImageZoomModal'
import type { AdminReviewGuidance } from '../admin/AdminReviewChecklist'

type AdminReviewPanelProps = {
  submission: CoinSubmissionDetail
  hasRevisionNotes: boolean
  hasActivityLogs: boolean
  onApprove?: () => void
  onReject?: () => void
  onRequestRevision?: () => void
  onReopenForReview?: () => void
  onUpdateRejectionFeedback?: () => void
  isDeciding?: boolean
  decidingAction?: string | null
  decisionError?: string | null
  decisionMessage?: string | null
  onReload?: () => void
  showDecisionControls?: boolean
  reviewGuidance?: AdminReviewGuidance
}

function CheckRow({
  label,
  ready,
  detail,
}: {
  label: string
  ready: boolean
  detail?: string
}) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span
        className={[
          'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
          ready
            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
            : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
        ].join(' ')}
      >
        {ready ? (
          <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
        ) : (
          <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-slate-700">{label}</span>
        {detail ? (
          <span className="mt-0.5 block text-[11px] text-slate-400">{detail}</span>
        ) : null}
      </span>
    </li>
  )
}

function StepReviewRow({ step }: { step: StepCompletionResult }) {
  const ready = step.status === 'complete'
  const detail =
    step.status === 'complete'
      ? `${step.completedCount}/${step.totalCount} complete`
      : step.issues?.[0]?.message ?? `${step.completedCount}/${step.totalCount} complete`
  return <CheckRow label={step.label} ready={ready} detail={detail} />
}

function AdminWorkflowStatusCard({
  submission,
}: {
  submission: CoinSubmissionDetail
}) {
  const { t } = useTranslation()
  const publishedUrl = getPublishedCoinUrl(submission)

  if (isApprovedSubmissionStatus(submission.status)) {
    return (
      <div
        role="status"
        className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-900"
      >
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">{t('admin.reviewDesk.alreadyApprovedTitle')}</p>
            <p className="mt-0.5 leading-relaxed">{t('admin.reviewDesk.alreadyApprovedBody')}</p>
            {publishedUrl ? (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-9 items-center gap-1.5 font-semibold text-emerald-800 underline-offset-2 hover:underline"
              >
                {t('admin.reviewDesk.viewPublishedCoin')}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (isRejectedSubmissionStatus(submission.status)) {
    const rejectionInfo = getSubmissionRejectionInfo(submission)
    const feedback = rejectionInfo.notes.join('\n\n')

    return (
      <div
        role="status"
        className="admin-review-desk__rejected-card mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-800"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">{t('admin.reviewDesk.rejectedTitle')}</p>
            <p className="mt-0.5 leading-relaxed">{t('admin.reviewDesk.rejectedBody')}</p>
            {feedback ? (
              <div className="mt-3 rounded-lg border border-red-200/80 bg-white/75 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-800">
                  {t('admin.reviewDesk.rejectionFeedbackLabel')}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-red-950">
                  {feedback}
                </p>
              </div>
            ) : null}
            <p className="mt-2 text-[11px] leading-relaxed text-red-800/90">
              {t('admin.reviewDesk.rejectedNextActionsHint')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isNeedsRevisionSubmissionStatus(submission.status)) {
    const revisionInfo = getSubmissionRevisionInfo(submission)
    const feedback = revisionInfo.notes.join('\n\n')

    return (
      <div
        role="status"
        className="admin-review-desk__revision-card mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-950"
      >
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">{t('admin.reviewDesk.revisionRequestedTitle')}</p>
            <p className="mt-0.5 leading-relaxed">{t('admin.reviewDesk.revisionRequestedBody')}</p>
            {feedback ? (
              <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/75 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                  {t('admin.reviewDesk.adminFeedbackLabel')}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                  {feedback}
                </p>
              </div>
            ) : null}
            <p className="mt-2 text-[11px] leading-relaxed text-amber-800/90">
              {t('admin.reviewDesk.revisionNextActionsHint')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function AdminReviewPanel({
  submission,
  hasRevisionNotes,
  hasActivityLogs,
  onApprove,
  onReject,
  onRequestRevision,
  onReopenForReview,
  onUpdateRejectionFeedback,
  isDeciding = false,
  decidingAction = null,
  decisionError = null,
  decisionMessage = null,
  onReload,
  showDecisionControls = true,
  reviewGuidance,
}: AdminReviewPanelProps) {
  const { t } = useTranslation()
  const values = coinFormValuesFromSubmission(submission)
  const galleryCount = submission.images.gallery?.length ?? 0
  const hasObverse = Boolean(submission.images.obverse?.url)
  const hasReverse = Boolean(submission.images.reverse?.url)
  const completeness = computeCompletenessScore({
    values,
    hasObverse,
    hasReverse,
    hasGallery: galleryCount > 0,
  })
  const stepCompletion = getCoinStepCompletion(
    values,
    { hasObverse, hasReverse, galleryCount },
    { isAdmin: true },
  )
  const requiredReady = completeness.requiredFilled === completeness.requiredTotal
  const reviewReady = requiredReady && completeness.score >= 80
  const actionAvailability = getAdminReviewActionAvailability(
    submission.status,
    getSubmissionAllowedActions(submission),
  )
  const waitingForRevision = isNeedsRevisionSubmissionStatus(submission.status)
  const isApproved = isApprovedSubmissionStatus(submission.status)
  const isRejected = isRejectedSubmissionStatus(submission.status)
  const showDecisionActions =
    actionAvailability.approve.enabled ||
    actionAvailability.reject.enabled ||
    actionAvailability.requestRevision.enabled ||
    actionAvailability.reopenForReview.enabled ||
    actionAvailability.updateRejectionFeedback.enabled
  const hasHandlers = Boolean(
    onApprove ||
      onReject ||
      onRequestRevision ||
      onReopenForReview ||
      onUpdateRejectionFeedback,
  )
  const isActionBusy = (action: string) => isDeciding && decidingAction === action
  const [zoomImage, setZoomImage] = useState<{
    src: string
    alt: string
    label: string
  } | null>(null)
  const contributor =
    submission.submitted_by?.email?.trim() ||
    (submission.submitted_by?.contributor_id
      ? `Contributor #${submission.submitted_by.contributor_id}`
      : 'Contributor details unavailable')
  const coinCode = submission.acf?.coin_code?.trim() || submission.acf?.unique_code?.trim() || ''

  return (
    <aside className="w-full overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] xl:max-w-[340px]">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Review desk
          </p>
          {onReload ? (
            <button
              type="button"
              disabled={isDeciding}
              onClick={onReload}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
              aria-label="Reload submission"
              title="Reload submission"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <StatusBadge status={submission.status} />
          <span className="text-xs text-slate-400">#{submission.id}</span>
        </div>
        {hasObverse || hasReverse ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {submission.images.obverse?.url ? (
              <button
                type="button"
                onClick={() =>
                  setZoomImage({
                    src: submission.images.obverse!.url,
                    alt: `${submission.title} obverse`,
                    label: 'Obverse image preview',
                  })
                }
                className="rounded-lg border border-slate-200 bg-slate-50 p-1 transition-colors hover:border-teal-200 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
                aria-label="Open obverse image preview"
              >
                <img
                  src={submission.images.obverse.url}
                  alt={`${submission.title} obverse`}
                  className="aspect-square w-full rounded-md bg-white object-contain"
                />
              </button>
            ) : null}
            {submission.images.reverse?.url ? (
              <button
                type="button"
                onClick={() =>
                  setZoomImage({
                    src: submission.images.reverse!.url,
                    alt: `${submission.title} reverse`,
                    label: 'Reverse image preview',
                  })
                }
                className="rounded-lg border border-slate-200 bg-slate-50 p-1 transition-colors hover:border-teal-200 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
                aria-label="Open reverse image preview"
              >
                <img
                  src={submission.images.reverse.url}
                  alt={`${submission.title} reverse`}
                  className="aspect-square w-full rounded-md bg-white object-contain"
                />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {showDecisionControls ? (
        <div className="border-b border-slate-100 p-4">
          {reviewGuidance ? (
            <div
              className={[
                'mb-3 rounded-xl border px-3 py-2.5 text-xs',
                reviewGuidance.tone === 'ready'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : reviewGuidance.tone === 'review'
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-red-200 bg-red-50 text-red-800',
              ].join(' ')}
            >
              <p className="font-semibold">{reviewGuidance.label}</p>
              <p className="mt-0.5">{reviewGuidance.detail}</p>
            </div>
          ) : null}
          <AdminWorkflowStatusCard submission={submission} />
          {decisionMessage ? (
            <div
              role="status"
              className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"
            >
              {decisionMessage}
            </div>
          ) : null}
          {decisionError ? (
            <div
              role="alert"
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
            >
              {decisionError}
            </div>
          ) : null}

          {hasHandlers && showDecisionActions ? (
            <div
              className={[
                'grid gap-2',
                waitingForRevision ? 'admin-review-desk__revision-actions' : '',
                isApproved ? 'admin-review-desk__approved-actions' : '',
                isRejected ? 'admin-review-desk__rejected-actions' : '',
              ].join(' ')}
              aria-busy={isDeciding}
            >
              {isRejected && actionAvailability.reopenForReview.enabled ? (
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={onReopenForReview}
                  aria-label={t('admin.reviewDesk.reopenForReviewAria')}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {isActionBusy('reopen')
                    ? t('admin.reviewDesk.processing')
                    : t('admin.reviewDesk.reopenForReview')}
                </button>
              ) : null}
              {isRejected && actionAvailability.requestRevision.enabled ? (
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={onRequestRevision}
                  aria-label={t('admin.reviewDesk.requestRevisionRejectedAria')}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  {isActionBusy('requestRevision')
                    ? t('admin.reviewDesk.processing')
                    : t('admin.reviewDesk.requestRevision')}
                </button>
              ) : null}
              {isRejected && actionAvailability.updateRejectionFeedback.enabled ? (
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={onUpdateRejectionFeedback}
                  aria-label={t('admin.reviewDesk.updateRejectionFeedbackAria')}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  {isActionBusy('updateRejection')
                    ? t('admin.reviewDesk.processing')
                    : t('admin.reviewDesk.updateRejectionFeedback')}
                </button>
              ) : null}
              {waitingForRevision && actionAvailability.requestRevision.enabled ? (
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={onRequestRevision}
                  aria-label={t('admin.reviewDesk.updateRevisionRequest')}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-200 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  {isDeciding
                    ? t('admin.reviewDesk.processing')
                    : t('admin.reviewDesk.updateRevisionRequest')}
                </button>
              ) : null}
              {actionAvailability.approve.enabled ? (
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={onApprove}
                  aria-label={
                    waitingForRevision
                      ? t('admin.reviewDesk.approveAnyway')
                      : t('actions.approveAria')
                  }
                  className={[
                    'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50',
                    waitingForRevision
                      ? 'border border-teal-200 bg-white text-teal-700 hover:bg-teal-50'
                      : 'bg-teal-500 text-white hover:bg-teal-600',
                  ].join(' ')}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {isDeciding
                    ? t('admin.reviewDesk.processing')
                    : waitingForRevision
                      ? t('admin.reviewDesk.approveAnyway')
                      : t('actions.approve')}
                </button>
              ) : null}
              {actionAvailability.reject.enabled ? (
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={onReject}
                  aria-label={t('actions.rejectAria')}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden />
                  {t('actions.reject')}
                </button>
              ) : null}
              {isApproved && actionAvailability.requestRevision.enabled ? (
                <>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {t('admin.reviewDesk.approvedRevisionHelper')}
                  </p>
                  <button
                    type="button"
                    disabled={isDeciding}
                    onClick={onRequestRevision}
                    aria-label={t('admin.reviewDesk.requestRevisionApprovedAria')}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    {isDeciding
                      ? t('admin.reviewDesk.processing')
                      : t('admin.reviewDesk.requestRevision')}
                  </button>
                </>
              ) : null}
              {!waitingForRevision && !isApproved && !isRejected && actionAvailability.requestRevision.enabled ? (
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={onRequestRevision}
                  aria-label={t('admin.reviewDesk.requestRevision')}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  {t('admin.reviewDesk.requestRevision')}
                </button>
              ) : null}
            </div>
          ) : hasHandlers ? null : (
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <p>Decision actions require WordPress review endpoints.</p>
            </div>
          )}
        </div>
      ) : null}

      <div className="border-b border-slate-100 px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Contributor
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-700" title={contributor}>
          {contributor}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Submitted {formatSubmittedDate(submission.date)}
        </p>
      </div>

      <div className="border-b border-slate-100 px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Duplicate status
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Backend duplicate guard active
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {coinCode ? `Coin code ${coinCode}` : 'Exact duplicates are checked before approval.'}
        </p>
      </div>

      <div className="border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Readiness
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold text-slate-800">
              {completeness.score}%
            </p>
          </div>
          <span
            className={[
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              reviewReady
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
            ].join(' ')}
          >
            {reviewReady ? 'Ready' : 'Needs check'}
          </span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={completeness.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Catalogue readiness"
        >
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${completeness.score}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {completeness.requiredFilled}/{completeness.requiredTotal} required ·{' '}
          {completeness.recommendedFilled}/{completeness.recommendedTotal} recommended
        </p>
      </div>

      <div className="px-4 py-3.5">
        <details>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-teal-500" aria-hidden />
              Checklist
            </span>
            <span className="text-[11px] font-medium text-slate-400">Open</span>
          </summary>
          <div className="mt-3 space-y-4">
            <div>
              <div className="mb-2.5 flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-teal-500" aria-hidden />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Field checklist
                </p>
              </div>
              <ul className="space-y-2">
                {stepCompletion
                  .filter((step) => step.stepId !== 'review-submission')
                  .map((step) => (
                    <StepReviewRow key={step.stepId} step={step} />
                  ))}
              </ul>
            </div>

            <div>
              <div className="mb-2.5 flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5 text-teal-500" aria-hidden />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Image checklist
                </p>
              </div>
              <ul className="space-y-2">
                <CheckRow
                  label="Obverse"
                  ready={hasObverse}
                  detail={hasObverse ? 'Primary face available' : 'Missing obverse image'}
                />
                <CheckRow
                  label="Reverse"
                  ready={hasReverse}
                  detail={hasReverse ? 'Reverse face available' : 'Missing reverse image'}
                />
                <CheckRow
                  label="Gallery"
                  ready={galleryCount > 0}
                  detail={
                    galleryCount > 0
                      ? `${galleryCount} gallery image${galleryCount === 1 ? '' : 's'}`
                      : 'No supporting gallery images'
                  }
                />
              </ul>
            </div>

            <div>
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Review signals
              </p>
              <ul className="space-y-2">
                <CheckRow
                  label="Revision notes"
                  ready={!hasRevisionNotes}
                  detail={
                    hasRevisionNotes
                      ? 'Read contributor revision context.'
                      : 'No revision notes flagged.'
                  }
                />
                <CheckRow
                  label="Activity log"
                  ready={hasActivityLogs}
                  detail={
                    hasActivityLogs ? 'Timeline is available.' : 'Using static timeline fallback.'
                  }
                />
              </ul>
            </div>
          </div>
        </details>
      </div>
      <SubmissionImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </aside>
  )
}
