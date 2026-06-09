import { AlertTriangle, Check, ClipboardCheck, Image, Lock, MessageSquare, RefreshCw, X } from 'lucide-react'
import type { CoinSubmissionDetail } from '../../lib/api'
import { computeCompletenessScore } from '../../lib/completenessScore'
import { getCoinStepCompletion, type StepCompletionResult } from '../../lib/stepCompletion'
import { coinFormValuesFromSubmission } from '../../types/coinForm'
import { StatusBadge } from '../ui/StatusBadge'

type AdminReviewPanelProps = {
  submission: CoinSubmissionDetail
  hasRevisionNotes: boolean
  hasActivityLogs: boolean
  onApprove?: () => void
  onReject?: () => void
  onRequestRevision?: () => void
  isDeciding?: boolean
  decisionError?: string | null
  decisionMessage?: string | null
  onReload?: () => void
  showDecisionControls?: boolean
}

const REVIEW_ANCHORS = [
  { href: '#review-summary', label: 'Summary' },
  { href: '#review-images', label: 'Images' },
  { href: '#review-data', label: 'Data' },
  { href: '#review-mint', label: 'Mint' },
  { href: '#review-admin', label: 'Admin' },
  { href: '#review-activity', label: 'Activity' },
]

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

export function AdminReviewPanel({
  submission,
  hasRevisionNotes,
  hasActivityLogs,
  onApprove,
  onReject,
  onRequestRevision,
  isDeciding = false,
  decisionError = null,
  decisionMessage = null,
  onReload,
  showDecisionControls = true,
}: AdminReviewPanelProps) {
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
  const hasHandlers = Boolean(onApprove || onReject || onRequestRevision)

  return (
    <aside className="w-full overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] xl:max-w-[340px]">

      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Review desk
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden xl:inline-flex">
            <StatusBadge status={submission.status} />
          </span>
          {onReload ? (
            <button
              type="button"
              disabled={isDeciding}
              onClick={onReload}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 xl:inline-flex"
              aria-label="Reload submission"
              title="Reload submission"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {showDecisionControls ? (
      <div className="hidden border-b border-slate-100 p-4 xl:block">
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

        {hasHandlers ? (
          <div className="grid gap-2">
            <button
              type="button"
              disabled={isDeciding}
              onClick={onApprove}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600 disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden />
              {isDeciding ? 'Processing…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={isDeciding}
              onClick={onRequestRevision}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" aria-hidden />
              Request revision
            </button>
            <button
              type="button"
              disabled={isDeciding}
              onClick={onReject}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden />
              Reject
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <p>Decision actions require WordPress review endpoints.</p>
          </div>
        )}
      </div>
      ) : null}

      {/* ── Catalogue readiness ── */}
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

      {/* ── Quick section jumps ── */}
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Jump to
        </p>
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
          {REVIEW_ANCHORS.map((anchor) => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              {anchor.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Field checklist ── */}
      <div className="border-b border-slate-100 px-4 py-3.5">
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

      {/* ── Image checklist ── */}
      <div className="border-b border-slate-100 px-4 py-3.5">
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

      {/* ── Review signals ── */}
      <div className="px-4 py-3.5">
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
    </aside>
  )
}
