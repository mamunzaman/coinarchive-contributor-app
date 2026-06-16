import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, XCircle } from 'lucide-react'
import { getAdminReviewReadiness } from '../../lib/adminReviewReadiness'
import type { CoinSubmissionDetail } from '../../lib/api'
import { AdminResponsiveAccordion } from './AdminResponsiveAccordion'

type ChecklistState = 'pass' | 'warning' | 'fail'

type ChecklistItem = {
  label: string
  state: ChecklistState
  helper: string
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

export { getAdminReviewReadiness, type AdminReviewGuidance } from '../../lib/adminReviewReadiness'
