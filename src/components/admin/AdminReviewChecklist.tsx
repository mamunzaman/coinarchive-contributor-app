import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, XCircle } from 'lucide-react'
import type { CoinSubmissionDetail } from '../../lib/api'
import { getSubmissionDuplicateRisk } from '../../lib/duplicateProtection'
import { coinFormValuesFromSubmission } from '../../types/coinForm'
import { AdminResponsiveAccordion } from './AdminResponsiveAccordion'

type ChecklistState = 'pass' | 'warning' | 'fail'
type ChecklistGroup = 'Required' | 'Recommended' | 'Risk'

type ChecklistItem = {
  label: string
  state: ChecklistState
  helper: string
}

export type AdminReviewGuidance = {
  label: string
  detail: string
  tone: 'ready' | 'review' | 'incomplete'
}

type ReadinessSummary = {
  score: number
  tone: AdminReviewGuidance['tone']
  guidance: AdminReviewGuidance
  groups: Array<{ title: ChecklistGroup; items: ChecklistItem[] }>
  duplicateMessage: string
  duplicateTone: 'red' | 'amber' | 'green'
}

function hasText(value: string | number | undefined | null): boolean {
  return String(value ?? '').trim().length > 0
}

function hasMintData(submission: CoinSubmissionDetail): boolean {
  const values = coinFormValuesFromSubmission(submission)
  if (values.hasMintVariants) {
    return values.mintVariants.some(
      (row) => row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim(),
    )
  }
  return Boolean(values.singleMintMark.trim() || values.mintMarksAvailable.trim())
}

function getReadinessTone(score: number): AdminReviewGuidance['tone'] {
  if (score >= 90) return 'ready'
  if (score >= 70) return 'review'
  return 'incomplete'
}

function buildItem(label: string, ready: boolean, readyText: string, missingText: string): ChecklistItem {
  return {
    label,
    state: ready ? 'pass' : 'fail',
    helper: ready ? readyText : missingText,
  }
}

export function getAdminReviewReadiness(submission: CoinSubmissionDetail): ReadinessSummary {
  const values = coinFormValuesFromSubmission(submission)
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const hasObverse = Boolean(submission.images.obverse?.url)
  const hasReverse = Boolean(submission.images.reverse?.url)
  const hasGallery = (submission.images.gallery?.length ?? 0) > 0
  const hasDescription = Boolean(
    values.short_description.trim() ||
      values.coin_obverse_description.trim() ||
      values.coin_reverse_description.trim() ||
      values.coin_historical_background.trim(),
  )
  const hasCollectorNotes = Boolean(values.coin_collector_notes.trim())
  const mintReady = hasMintData(submission)

  const required: ChecklistItem[] = [
    buildItem('Title', hasText(values.title), 'Ready', 'Missing title'),
    buildItem('Country', hasText(values.country), 'Ready', 'Missing country'),
    buildItem('Year', hasText(values.year), 'Ready', 'Missing year'),
    buildItem('Denomination', hasText(values.denomination), 'Ready', 'Missing denomination'),
    buildItem('Obverse image', hasObverse, 'Ready', 'Missing obverse image'),
    buildItem('Release date', hasText(values.released_date), 'Ready', 'Missing release date'),
  ]

  const recommended: ChecklistItem[] = [
    {
      label: 'Reverse image',
      state: hasReverse ? 'pass' : 'warning',
      helper: hasReverse ? 'Ready' : 'Missing reverse image',
    },
    {
      label: 'Description',
      state: hasDescription ? 'pass' : 'warning',
      helper: hasDescription ? 'Ready' : 'Add description before approval',
    },
    {
      label: 'Mint data',
      state: mintReady ? 'pass' : 'warning',
      helper: mintReady ? 'Ready' : 'Mint data is incomplete',
    },
    {
      label: 'Gallery images',
      state: hasGallery ? 'pass' : 'warning',
      helper: hasGallery ? 'Ready' : 'No gallery images',
    },
    {
      label: 'Collector notes',
      state: hasCollectorNotes ? 'pass' : 'warning',
      helper: hasCollectorNotes ? 'Ready' : 'No collector notes',
    },
  ]

  const missingRequired = required.filter((item) => item.state === 'fail').length
  const risk: ChecklistItem[] = [
    {
      label: 'Exact duplicate',
      state: duplicateRisk.level === 'exact' ? 'fail' : 'pass',
      helper: duplicateRisk.level === 'exact' ? 'Exact duplicate risk detected' : 'No exact duplicate signal',
    },
    {
      label: 'Similar duplicate',
      state: duplicateRisk.level === 'similar' ? 'warning' : 'pass',
      helper: duplicateRisk.level === 'similar' ? 'Review before approval' : 'No similar duplicate signal',
    },
    {
      label: 'Missing critical data',
      state: missingRequired > 0 ? 'fail' : 'pass',
      helper:
        missingRequired > 0
          ? `${missingRequired} required item${missingRequired === 1 ? '' : 's'} missing`
          : 'Required data present',
    },
  ]

  const requiredScore = (required.filter((item) => item.state === 'pass').length / required.length) * 60
  const recommendedScore = (recommended.filter((item) => item.state === 'pass').length / recommended.length) * 25
  const riskScore =
    duplicateRisk.level === 'exact' || missingRequired > 0
      ? 0
      : duplicateRisk.level === 'similar'
        ? 7
        : 15
  const score = Math.round(requiredScore + recommendedScore + riskScore)
  const tone = getReadinessTone(score)
  const guidance =
    missingRequired > 0
      ? {
          label: 'Missing required fields',
          detail: 'Approval is still available, but required data should be fixed first.',
          tone: 'incomplete' as const,
        }
      : duplicateRisk.level === 'exact' || duplicateRisk.level === 'similar' || score < 90
        ? {
            label: 'Review recommended',
            detail: 'Compare risk signals and missing recommended fields before approving.',
            tone: 'review' as const,
          }
        : {
            label: 'Ready to approve',
            detail: 'Required data is present and no blocking review signals are visible.',
            tone: 'ready' as const,
          }

  const duplicateMessage =
    duplicateRisk.level === 'exact'
      ? 'Exact duplicate risk detected. Approval is not recommended.'
      : duplicateRisk.level === 'similar'
        ? 'Similar coin exists. Compare before approval.'
        : duplicateRisk.level === 'none'
          ? 'No known duplicate risk.'
          : 'Duplicate risk data is not available.'

  return {
    score,
    tone,
    guidance,
    duplicateMessage,
    duplicateTone:
      duplicateRisk.level === 'exact' ? 'red' : duplicateRisk.level === 'similar' ? 'amber' : 'green',
    groups: [
      { title: 'Required', items: required },
      { title: 'Recommended', items: recommended },
      { title: 'Risk', items: risk },
    ],
  }
}

function ChecklistIcon({ state }: { state: ChecklistState }) {
  const className =
    state === 'pass'
      ? 'text-emerald-600'
      : state === 'warning'
        ? 'text-amber-600'
        : 'text-red-600'

  if (state === 'pass') return <CheckCircle2 className={`h-4 w-4 ${className}`} aria-hidden />
  if (state === 'warning') return <AlertTriangle className={`h-4 w-4 ${className}`} aria-hidden />
  return <XCircle className={`h-4 w-4 ${className}`} aria-hidden />
}

function ReviewGroupList({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="admin-review-checklist__list space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 shrink-0">
            <ChecklistIcon state={item.state} />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-navy">{item.label}</span>
            <span className="mt-0.5 block text-xs text-navy-muted">{item.helper}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function ReviewGroupSection({
  title,
  items,
  sectionsCompact,
}: {
  title: string
  items: ChecklistItem[]
  sectionsCompact: boolean
}) {
  const [open, setOpen] = useState(!sectionsCompact)
  const prevCompactRef = useRef(sectionsCompact)
  const passed = items.filter((item) => item.state === 'pass').length

  useEffect(() => {
    if (sectionsCompact && !prevCompactRef.current) {
      setOpen(false)
    } else if (!sectionsCompact && prevCompactRef.current) {
      setOpen(true)
    }
    prevCompactRef.current = sectionsCompact
  }, [sectionsCompact])

  if (!sectionsCompact) {
    return (
      <div className="admin-review-checklist__group rounded-xl border border-border/60 bg-page/50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">{title}</h3>
        <div className="mt-3">
          <ReviewGroupList items={items} />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-review-checklist__group admin-review-checklist__group--compact">
      <button
        type="button"
        className="admin-review-checklist__group-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="admin-review-checklist__group-head">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">{title}</span>
          <span className="admin-review-checklist__group-count">
            {passed}/{items.length}
          </span>
        </span>
        <ChevronDown
          className={[
            'admin-review-checklist__group-chevron',
            open ? 'admin-review-checklist__group-chevron--open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="admin-review-checklist__group-body">
          <ReviewGroupList items={items} />
        </div>
      ) : null}
    </div>
  )
}

export function AdminReviewChecklist({
  submission,
  sectionsCompact = false,
}: {
  submission: CoinSubmissionDetail
  sectionsCompact?: boolean
}) {
  const readiness = getAdminReviewReadiness(submission)
  const scoreClass =
    readiness.tone === 'ready'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : readiness.tone === 'review'
        ? 'bg-amber-50 text-amber-900 ring-amber-200'
        : 'bg-red-50 text-red-800 ring-red-200'
  const duplicateClass =
    readiness.duplicateTone === 'red'
      ? 'border-red-200 bg-red-50 text-red-800'
      : readiness.duplicateTone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  const scoreBadge = (
    <span className={`admin-compact-header__pill rounded-full px-3 py-1 text-xs font-semibold ring-1 ${scoreClass}`}>
      Approval readiness: {readiness.score}%
    </span>
  )

  const desktopHeader = (
    <div className="admin-review-checklist__header">
      <div>
        <p className="admin-compact-header__eyebrow">Admin readiness</p>
        <h2 className="admin-review-checklist__title">Review Checklist</h2>
      </div>
      {scoreBadge}
    </div>
  )

  return (
    <AdminResponsiveAccordion
      id="admin-review-checklist"
      compact={sectionsCompact}
      className="admin-review-checklist"
      panelClassName="admin-review-checklist__panel"
      header={{
        eyebrow: 'Admin readiness',
        heading: 'Review Checklist',
        trailing: scoreBadge,
      }}
    >
      {!sectionsCompact ? desktopHeader : null}

      <div role="status" className={`admin-review-checklist__duplicate rounded-xl border px-3 py-2.5 text-sm ${duplicateClass}`}>
        {readiness.duplicateMessage}
      </div>

      <div className="admin-review-checklist__groups">
        {readiness.groups.map((group) => (
          <ReviewGroupSection
            key={group.title}
            title={group.title}
            items={group.items}
            sectionsCompact={sectionsCompact}
          />
        ))}
      </div>
    </AdminResponsiveAccordion>
  )
}
