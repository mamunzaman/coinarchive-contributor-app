import { useMemo, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import type { CoinSubmissionDetail } from '../../lib/api'
import {
  buildAdminDataQualityAudit,
  getAdminDataQualityGuidanceKey,
} from '../../lib/adminDataQualityAudit'
import type { AdminDataQualityStatus, AuditItem } from '../../types/adminDataQualityAudit'
import { AdminResponsiveAccordion } from './AdminResponsiveAccordion'

type AdminDataQualityAuditProps = {
  submission: CoinSubmissionDetail
  sectionsCompact?: boolean
}

function statusTone(status: AdminDataQualityStatus): 'excellent' | 'good' | 'review' | 'critical' {
  if (status === 'excellent') return 'excellent'
  if (status === 'good') return 'good'
  if (status === 'needs_review') return 'review'
  return 'critical'
}

function AuditRow({ item, t }: { item: AuditItem; t: (key: string) => string }) {
  const iconClass = item.passed
    ? 'admin-data-quality__icon--pass'
    : item.severity === 'warning'
      ? 'admin-data-quality__icon--warn'
      : 'admin-data-quality__icon--fail'

  const Icon = item.passed
    ? CheckCircle2
    : item.severity === 'warning'
      ? AlertTriangle
      : XCircle

  const description = item.descriptionKey ? t(item.descriptionKey) : null

  return (
    <li className="admin-data-quality__row">
      <span className={`admin-data-quality__icon ${iconClass}`} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <span className="admin-data-quality__row-copy">
        <span className="admin-data-quality__row-label">{t(item.labelKey)}</span>
        {description ? (
          <span className="admin-data-quality__row-desc">{description}</span>
        ) : null}
        <span className="sr-only">{item.passed ? t('adminDataQuality.passed') : t('adminDataQuality.failed')}</span>
      </span>
    </li>
  )
}

function ScoreRing({ score, statusLabel, compact = false }: { score: number; statusLabel: string; compact?: boolean }) {
  const radius = compact ? 22 : 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const viewBox = compact ? '0 0 56 56' : '0 0 72 72'
  const center = compact ? 28 : 36

  return (
    <div
      className={[
        'admin-data-quality__score-ring',
        compact ? 'admin-data-quality__score-ring--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${statusLabel}: ${score}%`}
      role="img"
    >
      <svg viewBox={viewBox} className="admin-data-quality__score-svg" aria-hidden>
        <circle cx={center} cy={center} r={radius} className="admin-data-quality__score-track" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="admin-data-quality__score-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="admin-data-quality__score-value">{score}</span>
    </div>
  )
}

function ChecklistSection({
  title,
  items,
  tone,
  defaultOpen = true,
  sectionsCompact = false,
  t,
}: {
  title: string
  items: AuditItem[]
  tone: 'required' | 'recommended' | 'warnings'
  defaultOpen?: boolean
  sectionsCompact?: boolean
  t: (key: string) => string
}) {
  const [open, setOpen] = useState(sectionsCompact ? false : defaultOpen)
  const prevCompactRef = useRef(sectionsCompact)
  const passed = items.filter((entry) => entry.passed).length

  useEffect(() => {
    if (sectionsCompact && !prevCompactRef.current) {
      setOpen(false)
    } else if (!sectionsCompact && prevCompactRef.current) {
      setOpen(defaultOpen)
    }
    prevCompactRef.current = sectionsCompact
  }, [sectionsCompact, defaultOpen])

  if (items.length === 0) return null

  return (
    <div className={`admin-data-quality__section admin-data-quality__section--${tone}`}>
      <button
        type="button"
        className="admin-data-quality__section-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="admin-data-quality__section-head">
          <span className="admin-data-quality__section-title">{title}</span>
          <span className="admin-data-quality__section-count">
            {passed}/{items.length}
          </span>
        </span>
        <ChevronDown
          className={`admin-data-quality__section-chevron ${open ? 'admin-data-quality__section-chevron--open' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="admin-data-quality__list">
          {items.map((item) => (
            <AuditRow key={item.id} item={item} t={t} />
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function AdminDataQualityAudit({
  submission,
  sectionsCompact = false,
}: AdminDataQualityAuditProps) {
  const { t } = useTranslation()
  const audit = useMemo(() => buildAdminDataQualityAudit(submission), [submission])
  const guidanceKey = getAdminDataQualityGuidanceKey(audit)
  const tone = statusTone(audit.status)
  const failedWarnings = audit.warnings.filter((entry) => !entry.passed)
  const statusLabel = t(`adminDataQuality.status.${audit.status}`)

  const compactScoreTrailing = (
    <div className="admin-data-quality__header-meta">
      <ScoreRing score={audit.score} statusLabel={statusLabel} compact />
      <span className={`admin-data-quality__status admin-data-quality__status--${tone}`}>
        {statusLabel}
      </span>
    </div>
  )

  const desktopScoreTrailing = (
    <div className="admin-data-quality__header-meta">
      <ScoreRing score={audit.score} statusLabel={statusLabel} />
      <span className={`admin-data-quality__status admin-data-quality__status--${tone}`}>
        {statusLabel}
      </span>
    </div>
  )

  const desktopHeader = (
    <div className="admin-data-quality__header">
      <div className="admin-data-quality__intro">
        <p className="admin-data-quality__eyebrow">{t('adminDataQuality.eyebrow')}</p>
        <div className="admin-data-quality__title-row">
          <ClipboardCheck className="admin-data-quality__title-icon" aria-hidden />
          <h2 id="admin-data-quality-title" className="admin-data-quality__title">
            {t('adminDataQuality.title')}
          </h2>
        </div>
        <p className="admin-data-quality__subtitle">{t('adminDataQuality.subtitle')}</p>
      </div>
      {desktopScoreTrailing}
    </div>
  )

  return (
    <AdminResponsiveAccordion
      id="admin-data-quality"
      compact={sectionsCompact}
      className="admin-data-quality"
      panelClassName="admin-data-quality__panel"
      header={{
        eyebrow: t('adminDataQuality.eyebrow'),
        icon: <ClipboardCheck className="h-5 w-5" />,
        heading: t('adminDataQuality.title'),
        trailing: compactScoreTrailing,
      }}
    >
      {!sectionsCompact ? desktopHeader : (
        <p className="admin-data-quality__subtitle admin-data-quality__subtitle--compact">
          {t('adminDataQuality.subtitle')}
        </p>
      )}

      <div className="admin-data-quality__summary">
        <span>{t('adminDataQuality.summaryRequired', audit.summary)}</span>
        <span aria-hidden>·</span>
        <span>{t('adminDataQuality.summaryRecommended', audit.summary)}</span>
      </div>

      <div
        role="status"
        className={`admin-data-quality__guidance admin-data-quality__guidance--${guidanceKey}`}
      >
        {guidanceKey === 'blockers' ? (
          <ShieldAlert className="admin-data-quality__guidance-icon" aria-hidden />
        ) : guidanceKey === 'warnings' ? (
          <AlertTriangle className="admin-data-quality__guidance-icon" aria-hidden />
        ) : (
          <CheckCircle2 className="admin-data-quality__guidance-icon" aria-hidden />
        )}
        <span>{t(`adminDataQuality.guidance.${guidanceKey}`)}</span>
      </div>

      <div className="admin-data-quality__grid">
        <ChecklistSection
          title={t('adminDataQuality.sections.required')}
          items={audit.required}
          tone="required"
          sectionsCompact={sectionsCompact}
          defaultOpen={!sectionsCompact}
          t={t}
        />
        <ChecklistSection
          title={t('adminDataQuality.sections.recommended')}
          items={audit.recommended}
          tone="recommended"
          sectionsCompact={sectionsCompact}
          defaultOpen={!sectionsCompact && audit.blockers.length === 0}
          t={t}
        />
        {failedWarnings.length > 0 ? (
          <ChecklistSection
            title={t('adminDataQuality.sections.warnings')}
            items={failedWarnings}
            tone="warnings"
            sectionsCompact={sectionsCompact}
            defaultOpen={!sectionsCompact}
            t={t}
          />
        ) : null}
      </div>
    </AdminResponsiveAccordion>
  )
}
