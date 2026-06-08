import { Check, Clock3, AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { computeCompletenessScore } from '../../lib/completenessScore'
import { buildImageQualityChecklist } from '../../lib/imageQualityChecklist'
import type { CoinFormValues } from '../../types/coinForm'
import { useImageDimensions } from '../../hooks/useImageDimensions'

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
}

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

function ChecklistIcon({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  if (status === 'pass') {
    return <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
  }

  if (status === 'warn') {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
  }

  return <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
}

export function SubmissionWorkflowPanel({
  values,
  obverseFile,
  reverseFile,
  galleryFiles,
  hasExistingObverse = false,
  hasExistingReverse = false,
  existingGalleryCount = 0,
  obversePreviewUrl,
  reversePreviewUrl,
  lastSavedAt,
  saveError,
}: SubmissionWorkflowPanelProps) {
  const obverseDimensions = useImageDimensions(obverseFile ?? obversePreviewUrl)
  const reverseDimensions = useImageDimensions(reverseFile ?? reversePreviewUrl)

  const hasObverse = Boolean(obverseFile || hasExistingObverse)
  const hasReverse = Boolean(reverseFile || hasExistingReverse)
  const hasGallery = galleryFiles.length > 0 || existingGalleryCount > 0

  const completeness = useMemo(
    () =>
      computeCompletenessScore({
        values,
        hasObverse,
        hasReverse,
        hasGallery,
      }),
    [values, hasObverse, hasReverse, hasGallery],
  )

  const checklist = useMemo(
    () =>
      buildImageQualityChecklist({
        hasObverse,
        hasReverse,
        hasGallery,
        obverseFile,
        reverseFile,
        galleryFiles,
        obverseDimensions,
        reverseDimensions,
      }),
    [
      galleryFiles,
      hasGallery,
      hasObverse,
      hasReverse,
      obverseDimensions,
      obverseFile,
      reverseDimensions,
      reverseFile,
    ],
  )

  return (
    <div className="grid gap-2.5 xl:gap-3">
      <div className="rounded-xl border border-border/70 bg-white p-3 shadow-[var(--shadow-card)] xl:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
          Catalogue readiness
        </p>
        <div className="mt-2 flex items-end justify-between gap-2 xl:mt-3 xl:gap-3">
          <p className="font-serif text-2xl font-semibold text-navy xl:text-3xl">{completeness.score}%</p>
          <p className="text-[11px] text-navy-muted xl:text-xs">
            {completeness.requiredFilled}/{completeness.requiredTotal} required
          </p>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel xl:mt-3 xl:h-2"
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
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-3 shadow-[var(--shadow-card)] xl:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
          Image quality
        </p>
        <ul className="mt-2 space-y-2 xl:mt-3 xl:space-y-2.5">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-xs xl:gap-2.5 xl:text-sm">
              <ChecklistIcon status={item.status} />
              <span className="min-w-0">
                <span className="font-medium text-navy">{item.label}</span>
                {item.detail ? (
                  <span className="mt-0.5 hidden text-xs text-navy-muted xl:block">{item.detail}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-3 shadow-[var(--shadow-card)] xl:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
          Autosave
        </p>
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
      </div>
    </div>
  )
}
