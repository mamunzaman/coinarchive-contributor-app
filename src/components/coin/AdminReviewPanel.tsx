import { AlertTriangle, Check, ClipboardCheck, Image, Lock, XCircle } from 'lucide-react'
import type { CoinSubmissionDetail } from '../../lib/api'
import { computeCompletenessScore } from '../../lib/completenessScore'
import { getCoinStepCompletion, type StepCompletionResult } from '../../lib/stepCompletion'
import { coinFormValuesFromSubmission } from '../../types/coinForm'
import { Button } from '../ui/Button'
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
}

type ReviewAnchor = {
  href: string
  label: string
}

const REVIEW_ANCHORS: ReviewAnchor[] = [
  { href: '#review-data', label: 'Data' },
  { href: '#review-images', label: 'Images' },
  { href: '#review-mint', label: 'Mint' },
  { href: '#review-admin', label: 'Admin' },
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
    <li className="flex items-start gap-2 text-xs xl:text-sm">
      <span
        className={[
          'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
          ready ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        ].join(' ')}
      >
        {ready ? (
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        ) : (
          <AlertTriangle className="h-3 w-3" strokeWidth={2.25} aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-navy">{label}</span>
        {detail ? <span className="mt-0.5 block text-[11px] text-navy-muted xl:text-xs">{detail}</span> : null}
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

function DecisionControls({
  onApprove,
  onReject,
  onRequestRevision,
  isDeciding,
  decisionError,
  decisionMessage,
}: {
  onApprove?: () => void
  onReject?: () => void
  onRequestRevision?: () => void
  isDeciding?: boolean
  decisionError?: string | null
  decisionMessage?: string | null
}) {
  const hasHandlers = Boolean(onApprove || onReject || onRequestRevision)

  if (!hasHandlers) {
    return (
      <div className="rounded-xl border border-border/70 bg-page/50 p-3">
        <div className="flex items-start gap-2">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-navy-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy xl:text-sm">Decision API required</p>
            <p className="mt-1 text-[11px] leading-relaxed text-navy-muted xl:text-xs">
              Approve, request revision, reject, and admin note saving need WordPress review endpoints
              before these actions can submit changes.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <Button type="button" fullWidth disabled className="!min-h-10 !py-2.5">
            Approve
          </Button>
          <Button type="button" variant="secondary" fullWidth disabled className="!min-h-10 !py-2.5">
            Request revision
          </Button>
          <Button type="button" variant="ghost" fullWidth disabled className="!min-h-10 !py-2.5 text-red-700">
            Reject
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {decisionError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
        >
          {decisionError}
        </div>
      ) : null}
      {decisionMessage ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"
        >
          {decisionMessage}
        </div>
      ) : null}
      <div className="grid gap-2">
        <Button
          type="button"
          fullWidth
          disabled={isDeciding}
          className="!min-h-10 !py-2.5"
          onClick={onApprove}
        >
          {isDeciding ? 'Processing…' : 'Approve'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={isDeciding}
          className="!min-h-10 !py-2.5"
          onClick={onRequestRevision}
        >
          Request revision
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          disabled={isDeciding}
          className="!min-h-10 !py-2.5 text-red-700"
          onClick={onReject}
        >
          Reject
        </Button>
      </div>
    </div>
  )
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

  return (
    <aside className="rounded-2xl border border-border/60 bg-white p-4 shadow-[var(--shadow-card)] lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto xl:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Admin review
          </p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-navy">Review desk</h2>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-page/50 p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
              Catalogue readiness
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold text-navy">{completeness.score}%</p>
          </div>
          <span
            className={[
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              reviewReady
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
            ].join(' ')}
          >
            {reviewReady ? 'Ready' : 'Needs check'}
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-white"
          role="progressbar"
          aria-valuenow={completeness.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Catalogue readiness"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${completeness.score}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-navy-muted xl:text-xs">
          {completeness.requiredFilled}/{completeness.requiredTotal} required and{' '}
          {completeness.recommendedFilled}/{completeness.recommendedTotal} recommended checks complete.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {REVIEW_ANCHORS.map((anchor) => (
          <a
            key={anchor.href}
            href={anchor.href}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border/70 bg-page/60 px-3 text-xs font-semibold text-navy-muted transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {anchor.label}
          </a>
        ))}
      </div>

      <section className="mt-5 border-t border-border/60 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">
            Field checklist
          </p>
        </div>
        <ul className="mt-3 space-y-2.5">
          {stepCompletion
            .filter((step) => step.stepId !== 'review-submission')
            .map((step) => (
              <StepReviewRow key={step.stepId} step={step} />
            ))}
        </ul>
      </section>

      <section className="mt-5 border-t border-border/60 pt-4">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">
            Image checklist
          </p>
        </div>
        <ul className="mt-3 space-y-2.5">
          <CheckRow label="Obverse" ready={hasObverse} detail={hasObverse ? 'Primary face available' : 'Missing obverse image'} />
          <CheckRow label="Reverse" ready={hasReverse} detail={hasReverse ? 'Reverse face available' : 'Missing reverse image'} />
          <CheckRow
            label="Gallery"
            ready={galleryCount > 0}
            detail={galleryCount > 0 ? `${galleryCount} gallery image${galleryCount === 1 ? '' : 's'}` : 'No supporting gallery images'}
          />
        </ul>
      </section>

      <section className="mt-5 border-t border-border/60 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">
          Review signals
        </p>
        <div className="mt-3 space-y-2">
          <CheckRow
            label="Revision notes"
            ready={!hasRevisionNotes}
            detail={hasRevisionNotes ? 'Read contributor revision context below.' : 'No revision notes flagged.'}
          />
          <CheckRow
            label="Activity log"
            ready={hasActivityLogs}
            detail={hasActivityLogs ? 'Timeline is available.' : 'Using static submission timeline fallback.'}
          />
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>Duplicate review is handled in the contributor wizard; a dedicated backend duplicate endpoint is still pending.</p>
          </div>
        </div>
      </section>

      <section className="mt-5 border-t border-border/60 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">
          Decision controls
        </p>
        <div className="mt-3">
          <DecisionControls
            onApprove={onApprove}
            onReject={onReject}
            onRequestRevision={onRequestRevision}
            isDeciding={isDeciding}
            decisionError={decisionError}
            decisionMessage={decisionMessage}
          />
        </div>
      </section>
    </aside>
  )
}
