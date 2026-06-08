import { AlertTriangle, Check, Circle, Clock3, Copy, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { computeCompletenessScore } from '../../lib/completenessScore'
import {
  getCatalogueHealthSteps,
  getWizardNextAction,
  type StepCompletionResult,
  type StepCompletionStatus,
} from '../../lib/stepCompletion'
import type { CoinFormValues } from '../../types/coinForm'
import type { CoinFormStepId } from '../../types/coinFormSteps'
import { Button } from '../ui/Button'

type SubmissionWorkflowPanelProps = {
  values: CoinFormValues
  obverseFile: File | null
  reverseFile: File | null
  galleryFiles: File[]
  hasExistingObverse?: boolean
  hasExistingReverse?: boolean
  existingGalleryCount?: number
  obversePreviewUrl?: string | null
  reversePreviewUrl?: string | null
  lastSavedAt: string | null
  saveError?: string | null
  stepCompletion?: StepCompletionResult[]
  hasDuplicateWarning?: boolean
  onJumpToStep?: (stepId: CoinFormStepId) => void
}

type QuickJump = {
  stepId: CoinFormStepId
  label: string
}

const QUICK_JUMPS: QuickJump[] = [
  { stepId: 'core-identity', label: 'Core' },
  { stepId: 'images', label: 'Images' },
  { stepId: 'mint-information', label: 'Mint' },
  { stepId: 'specifications', label: 'Specs' },
  { stepId: 'descriptions', label: 'Notes' },
  { stepId: 'review-submission', label: 'Review' },
]

function formatSavedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-muted xl:text-[11px] xl:tracking-[0.18em]">
      {children}
    </p>
  )
}

function HealthStatusIcon({ status }: { status: StepCompletionStatus }) {
  if (status === 'complete') {
    return <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
  }

  if (status === 'attention') {
    return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" strokeWidth={2.25} aria-hidden />
  }

  return <Circle className="h-3 w-3 shrink-0 text-navy-muted/45" strokeWidth={2} aria-hidden />
}

function ImageStatusRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs xl:text-sm">
      <span className="text-navy-muted">{label}</span>
      <span
        className={[
          'inline-flex items-center gap-1 font-medium',
          ready ? 'text-emerald-700' : 'text-amber-800',
        ].join(' ')}
      >
        {ready ? (
          <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
        ) : (
          <Circle className="h-2.5 w-2.5 shrink-0 fill-amber-400/90 text-transparent" aria-hidden />
        )}
        {ready ? 'Ready' : 'Missing'}
      </span>
    </div>
  )
}

export function SubmissionWorkflowPanel({
  values,
  obverseFile,
  reverseFile,
  galleryFiles,
  hasExistingObverse = false,
  hasExistingReverse = false,
  existingGalleryCount = 0,
  lastSavedAt,
  saveError,
  stepCompletion = [],
  hasDuplicateWarning = false,
  onJumpToStep,
}: SubmissionWorkflowPanelProps) {
  const hasObverse = Boolean(obverseFile || hasExistingObverse)
  const hasReverse = Boolean(reverseFile || hasExistingReverse)
  const galleryCount = galleryFiles.length + existingGalleryCount

  const completeness = useMemo(
    () =>
      computeCompletenessScore({
        values,
        hasObverse,
        hasReverse,
        hasGallery: galleryCount > 0,
      }),
    [values, hasObverse, hasReverse, galleryCount],
  )

  const catalogueHealth = useMemo(() => getCatalogueHealthSteps(stepCompletion), [stepCompletion])
  const nextAction = useMemo(() => getWizardNextAction(stepCompletion), [stepCompletion])

  const visibleQuickJumps = useMemo(() => {
    if (stepCompletion.length === 0) {
      return QUICK_JUMPS.filter((jump) => jump.stepId !== 'status-admin')
    }

    const visibleIds = new Set(stepCompletion.map((step) => step.stepId))
    return QUICK_JUMPS.filter((jump) => visibleIds.has(jump.stepId))
  }, [stepCompletion])

  return (
    <div className="rounded-xl border border-border/70 bg-white p-3 shadow-[var(--shadow-card)] xl:p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Action Center
          </p>
          <p className="mt-0.5 text-[11px] text-navy-muted xl:text-xs">Your next steps at a glance</p>
        </div>
        <Sparkles className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
      </div>

      <div className="mt-3 space-y-3 xl:mt-4 xl:space-y-4">
        <section>
          <SectionLabel>Catalogue health</SectionLabel>
          <div className="mt-1.5 flex items-end justify-between gap-2 xl:mt-2">
            <p className="font-serif text-xl font-semibold text-navy xl:text-2xl">{completeness.score}%</p>
            <p className="text-[10px] text-navy-muted xl:text-[11px]">
              {completeness.requiredFilled}/{completeness.requiredTotal} required
            </p>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel xl:mt-2 xl:h-2"
            role="progressbar"
            aria-valuenow={completeness.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Catalogue readiness"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          {catalogueHealth.length > 0 ? (
            <ul className="mt-2 space-y-1 xl:mt-2.5 xl:space-y-1.5">
              {catalogueHealth.map((step) => (
                <li key={step.stepId} className="flex items-center gap-2 text-xs text-navy xl:text-sm">
                  <HealthStatusIcon status={step.status} />
                  <span className="min-w-0 truncate font-medium">{step.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="border-t border-border/50 pt-3 xl:pt-3.5">
          <SectionLabel>Image status</SectionLabel>
          <div className="mt-1.5 space-y-1 xl:mt-2 xl:space-y-1.5">
            <ImageStatusRow label="Obverse" ready={hasObverse} />
            <ImageStatusRow label="Reverse" ready={hasReverse} />
            <div className="flex items-center justify-between gap-2 text-xs xl:text-sm">
              <span className="text-navy-muted">Gallery</span>
              <span className="font-medium text-navy">{galleryCount}</span>
            </div>
          </div>
        </section>

        <section className="border-t border-border/50 pt-3 xl:pt-3.5">
          <SectionLabel>Duplicate check</SectionLabel>
          <p
            className={[
              'mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium xl:mt-2 xl:text-sm',
              hasDuplicateWarning ? 'text-amber-800' : 'text-navy-muted',
            ].join(' ')}
          >
            <Copy className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            {hasDuplicateWarning ? 'Possible duplicate' : 'No duplicate warning'}
          </p>
        </section>

        <section className="border-t border-border/50 pt-3 xl:pt-3.5">
          <SectionLabel>Next action</SectionLabel>
          <p className="mt-1.5 text-xs font-semibold text-navy xl:mt-2 xl:text-sm">{nextAction.message}</p>
          {onJumpToStep ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-2 !min-h-9 w-full !px-3 !py-2 text-xs xl:!min-h-10 xl:text-sm"
              onClick={() => onJumpToStep(nextAction.stepId)}
            >
              {nextAction.isReview ? 'Go to review' : 'Go to step'}
            </Button>
          ) : null}
        </section>

        {onJumpToStep ? (
          <section className="border-t border-border/50 pt-3 xl:pt-3.5">
            <SectionLabel>Quick jumps</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-1.5 xl:gap-2">
              {visibleQuickJumps.map((jump) => (
                <button
                  key={jump.stepId}
                  type="button"
                  onClick={() => onJumpToStep(jump.stepId)}
                  className={[
                    'rounded-full border border-border/70 bg-page/60 px-2.5 py-1 text-[11px] font-semibold text-navy-muted transition-colors',
                    'hover:border-primary/30 hover:bg-primary/5 hover:text-navy',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                    'xl:px-3 xl:py-1.5 xl:text-xs',
                  ].join(' ')}
                >
                  {jump.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-t border-border/50 pt-3 xl:pt-3.5">
          <SectionLabel>Autosave</SectionLabel>
          {saveError ? (
            <p className="mt-1.5 text-xs text-red-700 xl:mt-2 xl:text-sm">{saveError}</p>
          ) : lastSavedAt ? (
            <div className="mt-1.5 flex items-start gap-2 text-xs text-navy xl:mt-2 xl:text-sm">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary xl:h-4 xl:w-4" aria-hidden />
              <div>
                <p>Draft saved automatically</p>
                <p className="mt-0.5 text-[11px] text-navy-muted xl:text-xs">{formatSavedAt(lastSavedAt)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-navy-muted xl:mt-2 xl:text-sm">
              Changes save locally every 10 seconds.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
