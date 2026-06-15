import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Info,
  XCircle,
} from 'lucide-react'
import type { CoinSubmissionDetail } from '../../lib/api'
import {
  buildAdminDataQualityAudit,
} from '../../lib/adminDataQualityAudit'
import {
  collectCriticalIssues,
  collectPassedAuditItems,
  collectRecommendedImprovements,
  getApprovalReadinessBadgeKey,
  resolveAuditItemScrollTarget,
  scrollToApprovalTarget,
} from '../../lib/adminApprovalReadiness'
import { getSubmissionDuplicateRisk } from '../../lib/duplicateProtection'
import type { AdminDataQualityAudit } from '../../types/adminDataQualityAudit'
import type { AuditItem } from '../../types/adminDataQualityAudit'
import { AdminResponsiveAccordion } from './AdminResponsiveAccordion'

type AdminDataQualityAuditProps = {
  submission: CoinSubmissionDetail
  sectionsCompact?: boolean
}

function ScoreRing({
  score,
  statusLabel,
  compact = false,
}: {
  score: number
  statusLabel: string
  compact?: boolean
}) {
  const radius = compact ? 16 : 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const viewBox = compact ? '0 0 48 48' : '0 0 68 68'
  const center = compact ? 24 : 34
  const [displayScore, setDisplayScore] = useState(score)
  const previousScoreRef = useRef(score)

  useEffect(() => {
    const from = previousScoreRef.current
    if (from === score) return

    const start = performance.now()
    const duration = 500
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setDisplayScore(Math.round(from + (score - from) * progress))
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick)
      } else {
        previousScoreRef.current = score
      }
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [score])

  return (
    <div
      className={[
        'approval-readiness__score-ring',
        compact ? 'approval-readiness__score-ring--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${statusLabel}: ${score}%`}
      role="img"
    >
      <svg viewBox={viewBox} className="approval-readiness__score-svg" aria-hidden>
        <circle cx={center} cy={center} r={radius} className="approval-readiness__score-track" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="approval-readiness__score-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="approval-readiness__score-value" aria-hidden>
        {displayScore}
        <span className="approval-readiness__score-percent">%</span>
      </span>
    </div>
  )
}

function ScorePanel({
  audit,
  badgeKey,
  statusLabel,
  t,
}: {
  audit: AdminDataQualityAudit
  badgeKey: ReturnType<typeof getApprovalReadinessBadgeKey>
  statusLabel: string
  t: TFunction
}) {
  return (
    <div className="approval-readiness__score-panel">
      <ScoreRing score={audit.score} statusLabel={statusLabel} />
      <span
        className={[
          'approval-readiness__badge',
          badgeKey === 'ready'
            ? 'approval-readiness__badge--ready'
            : 'approval-readiness__badge--attention',
        ].join(' ')}
      >
        {statusLabel}
      </span>
      <div className="approval-readiness__metrics" role="status">
        <span>{t('adminDataQuality.summaryRequired', audit.summary)}</span>
        <span>{t('adminDataQuality.summaryRecommended', audit.summary)}</span>
      </div>
    </div>
  )
}

function AccordionScoreSummary({
  score,
  statusLabel,
}: {
  score: number
  statusLabel: string
}) {
  return (
    <span className="approval-readiness__accordion-summary" aria-label={`${statusLabel}: ${score}%`}>
      <span className="approval-readiness__accordion-score">{score}%</span>
      <span className="approval-readiness__accordion-status">{statusLabel}</span>
    </span>
  )
}

function StatusSummaryRow({
  badgeKey,
  criticalCount,
  recommendedCount,
  t,
}: {
  badgeKey: ReturnType<typeof getApprovalReadinessBadgeKey>
  criticalCount: number
  recommendedCount: number
  t: TFunction
}) {
  const hasBlockers = criticalCount > 0
  const tone = hasBlockers ? 'attention' : badgeKey === 'ready' ? 'ready' : 'warning'

  const primaryLabel = hasBlockers
    ? t('adminDataQuality.approvalReadiness.summaryBlockers', { count: criticalCount })
    : badgeKey === 'ready'
      ? t('adminDataQuality.approvalReadiness.status.ready')
      : t('adminDataQuality.approvalReadiness.status.needs_attention')

  const PrimaryIcon = hasBlockers ? AlertTriangle : CheckCircle2

  return (
    <div role="status" className="approval-readiness__status-row">
      <span className={`approval-readiness__status-pill approval-readiness__status-pill--${tone}`}>
        <PrimaryIcon className="approval-readiness__status-pill-icon" aria-hidden />
        <span>{primaryLabel}</span>
      </span>
      {!hasBlockers && recommendedCount > 0 ? (
        <span className="approval-readiness__status-pill approval-readiness__status-pill--soft">
          {t('adminDataQuality.approvalReadiness.summaryImprovementsChip', {
            count: recommendedCount,
          })}
        </span>
      ) : null}
      {!hasBlockers && recommendedCount > 0 ? (
        <span className="approval-readiness__status-pill approval-readiness__status-pill--soft">
          {t('adminDataQuality.approvalReadiness.summaryNoBlockers')}
        </span>
      ) : null}
      {!hasBlockers && recommendedCount === 0 ? (
        <span className="approval-readiness__status-pill approval-readiness__status-pill--soft">
          {t('adminDataQuality.approvalReadiness.summaryNoBlockers')}
        </span>
      ) : null}
      {hasBlockers && recommendedCount > 0 ? (
        <span className="approval-readiness__status-pill approval-readiness__status-pill--soft">
          {t('adminDataQuality.approvalReadiness.summaryImprovementsChip', {
            count: recommendedCount,
          })}
        </span>
      ) : null}
    </div>
  )
}

function CriticalIssueRow({ item, t }: { item: AuditItem; t: TFunction }) {
  const label = t(item.labelKey)
  const targetId = resolveAuditItemScrollTarget(item)
  const isDuplicate = item.category === 'duplicate' || item.id === 'duplicateStatus'
  const actionLabel = isDuplicate
    ? t('adminDataQuality.approvalReadiness.reviewAction')
    : t('adminDataQuality.approvalReadiness.jumpAction')

  return (
    <li>
      <button
        type="button"
        className="approval-readiness__critical-row"
        onClick={() => scrollToApprovalTarget(targetId)}
        aria-label={t('adminDataQuality.approvalReadiness.navigateTo', { label })}
      >
        <XCircle className="approval-readiness__critical-icon" aria-hidden />
        <span className="approval-readiness__critical-label">{label}</span>
        <span className="approval-readiness__critical-action">{actionLabel}</span>
      </button>
    </li>
  )
}

function ImprovementChip({ item, t }: { item: AuditItem; t: TFunction }) {
  const label = t(item.labelKey)
  const targetId = resolveAuditItemScrollTarget(item)

  return (
    <button
      type="button"
      className="approval-readiness__chip"
      onClick={() => scrollToApprovalTarget(targetId)}
      aria-label={t('adminDataQuality.approvalReadiness.navigateTo', { label })}
    >
      <AlertTriangle className="approval-readiness__chip-icon" aria-hidden />
      <span>{label}</span>
    </button>
  )
}

type PassedCheckGroup = {
  id: 'required' | 'recommended' | 'content'
  title: string
  items: AuditItem[]
}

const REQUIRED_PASSED_IDS = new Set([
  'country',
  'year',
  'coinType',
  'subjectTitle',
  'releaseDate',
  'coinCode',
  'obverseImage',
  'duplicateStatus',
])

const RECOMMENDED_PASSED_IDS = new Set([
  'reverseImage',
  'galleryImage',
  'shortDescription',
  'historicalBackground',
  'obverseDescription',
  'reverseDescription',
  'mintInformation',
  'seoSaved',
  'seoSlug',
])

const CONTENT_PASSED_IDS = new Set([
  'contentLanguage',
  'contentLanguageMissing',
  'contentLanguageInvalid',
])

function groupPassedChecks(items: AuditItem[]): PassedCheckGroup[] {
  const groups: PassedCheckGroup[] = [
    { id: 'required', title: 'Required', items: [] },
    { id: 'recommended', title: 'Recommended', items: [] },
    { id: 'content', title: 'Content', items: [] },
  ]

  for (const item of items) {
    if (REQUIRED_PASSED_IDS.has(item.id) || item.severity === 'required' || item.severity === 'critical') {
      groups[0].items.push(item)
    } else if (CONTENT_PASSED_IDS.has(item.id) || item.category === 'language') {
      groups[2].items.push(item)
    } else if (RECOMMENDED_PASSED_IDS.has(item.id) || item.severity === 'recommended' || item.severity === 'warning') {
      groups[1].items.push(item)
    } else {
      groups[1].items.push(item)
    }
  }

  return groups.filter((group) => group.items.length > 0)
}

function PassedChecksSection({
  items,
  sectionsCompact,
  t,
}: {
  items: AuditItem[]
  sectionsCompact: boolean
  t: TFunction
}) {
  const [open, setOpen] = useState(false)
  const prevCompactRef = useRef(sectionsCompact)

  useEffect(() => {
    if (sectionsCompact && !prevCompactRef.current) {
      setOpen(false)
    }
    prevCompactRef.current = sectionsCompact
  }, [sectionsCompact])

  if (items.length === 0) return null

  const groups = groupPassedChecks(items)
  const summaryText = open
    ? `${items.length} checks passed successfully`
    : `${items.length} checks passed`

  return (
    <div className="approval-readiness__audit-details">
      <button
        type="button"
        className="approval-readiness__audit-summary"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="approval-readiness__audit-summary-main">
          <span className="approval-readiness__audit-summary-icon" aria-hidden>
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <span className="approval-readiness__audit-summary-copy">
            <span className="approval-readiness__audit-summary-title">Audit Details</span>
            <span className="approval-readiness__audit-summary-subtitle">{summaryText}</span>
          </span>
        </span>
        <span className="approval-readiness__audit-summary-action">
          <span>{open ? 'Hide details' : 'View details'}</span>
          <ChevronDown
            className={[
              'approval-readiness__audit-chevron',
              open ? 'approval-readiness__audit-chevron--open' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div className="approval-readiness__audit-panel">
          <div className="approval-readiness__audit-panel-inner">
            <div className="approval-readiness__audit-panel-head">
              <p className="approval-readiness__audit-panel-title">Passed Quality Checks</p>
              <span className="approval-readiness__audit-panel-count">{items.length} passed</span>
            </div>
            <div className="approval-readiness__audit-grid">
              {groups.map((group) => (
                <section
                  key={group.id}
                  className="approval-readiness__audit-group"
                  aria-labelledby={`approval-readiness-audit-${group.id}`}
                >
                  <div className="approval-readiness__audit-group-head">
                    <h4 id={`approval-readiness-audit-${group.id}`} className="approval-readiness__audit-group-title">
                      {group.title}
                    </h4>
                    <span className="approval-readiness__audit-group-count">
                      {group.items.length} passed
                    </span>
                  </div>
                  <ul className="approval-readiness__audit-group-list">
                    {group.items.map((item) => (
                      <li key={item.id} className="approval-readiness__audit-row">
                        <CheckCircle2 className="approval-readiness__audit-row-icon" aria-hidden />
                        <span>{t(item.labelKey)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type DuplicateTone = 'red' | 'amber' | 'green' | 'neutral'

function DuplicateStatusCard({
  submission,
  t,
}: {
  submission: CoinSubmissionDetail
  t: TFunction
}) {
  const duplicateRisk = getSubmissionDuplicateRisk(submission)

  let tone: DuplicateTone = 'green'
  let titleKey = 'adminDataQuality.approvalReadiness.duplicate.noneTitle'
  let textKey = 'adminDataQuality.approvalReadiness.duplicate.noneText'

  if (duplicateRisk.level === 'exact') {
    tone = 'red'
    titleKey = 'adminDataQuality.approvalReadiness.duplicate.exactTitle'
    textKey = 'adminDataQuality.approvalReadiness.duplicate.exactText'
  } else if (duplicateRisk.level === 'similar') {
    tone = 'amber'
    titleKey = 'adminDataQuality.approvalReadiness.duplicate.similarTitle'
    textKey = 'adminDataQuality.approvalReadiness.duplicate.similarText'
  } else if (duplicateRisk.level === 'none') {
    tone = 'green'
    titleKey = 'adminDataQuality.approvalReadiness.duplicate.noneTitle'
    textKey = 'adminDataQuality.approvalReadiness.duplicate.noneText'
  } else {
    tone = 'neutral'
    titleKey = 'adminDataQuality.approvalReadiness.duplicate.unavailableTitle'
    textKey = 'adminDataQuality.approvalReadiness.duplicate.unavailableText'
  }

  const Icon =
    tone === 'red'
      ? XCircle
      : tone === 'amber'
        ? AlertTriangle
        : tone === 'neutral'
          ? Info
          : CheckCircle2

  return (
    <section
      id="approval-duplicate-status"
      className={`approval-readiness__content-panel approval-readiness__content-panel--duplicate approval-readiness__duplicate--${tone}`}
      aria-labelledby="approval-duplicate-status-title"
      tabIndex={-1}
    >
      <div className="approval-readiness__duplicate-row">
        <span className="approval-readiness__duplicate-icon-wrap" aria-hidden>
          <Copy className="approval-readiness__duplicate-type-icon" />
        </span>
        <div className="approval-readiness__duplicate-copy">
          <p id="approval-duplicate-status-title" className="approval-readiness__duplicate-title">
            <Icon className="approval-readiness__duplicate-status-icon" aria-hidden />
            <span>{t(titleKey)}</span>
          </p>
          <p className="approval-readiness__duplicate-text">{t(textKey)}</p>
        </div>
      </div>
    </section>
  )
}

export function AdminDataQualityAudit({
  submission,
  sectionsCompact = false,
}: AdminDataQualityAuditProps) {
  const { t } = useTranslation()
  const audit = useMemo(() => buildAdminDataQualityAudit(submission), [submission])
  const badgeKey = getApprovalReadinessBadgeKey(audit)
  const criticalIssues = collectCriticalIssues(audit)
  const recommendedImprovements = collectRecommendedImprovements(audit)
  const passedChecks = collectPassedAuditItems(audit)
  const statusLabel = t(`adminDataQuality.approvalReadiness.status.${badgeKey}`)

  const scorePanel = (
    <ScorePanel
      audit={audit}
      badgeKey={badgeKey}
      statusLabel={statusLabel}
      t={t}
    />
  )
  const compactScoreSummary = (
    <AccordionScoreSummary score={audit.score} statusLabel={statusLabel} />
  )

  const cardHeader = (
    <header className="approval-readiness__header">
      <div className="approval-readiness__header-copy">
        <p className="approval-readiness__eyebrow">{t('adminDataQuality.approvalReadiness.eyebrow')}</p>
        <div className="approval-readiness__title-row">
          <ClipboardCheck className="approval-readiness__title-icon" aria-hidden />
          <h2 id="admin-data-quality-title" className="approval-readiness__title">
            {t('adminDataQuality.approvalReadiness.title')}
          </h2>
        </div>
        <p className="approval-readiness__subtitle">
          {t('adminDataQuality.approvalReadiness.subtitle')}
        </p>
      </div>
      {scorePanel}
    </header>
  )

  const cardBody = (
    <div className="approval-readiness__body">
      <StatusSummaryRow
        badgeKey={badgeKey}
        criticalCount={criticalIssues.length}
        recommendedCount={recommendedImprovements.length}
        t={t}
      />

      {criticalIssues.length > 0 ? (
        <section
          className="approval-readiness__content-panel approval-readiness__content-panel--critical"
          aria-labelledby="approval-readiness-critical-heading"
        >
          <h3 id="approval-readiness-critical-heading" className="approval-readiness__panel-title">
            {t('adminDataQuality.approvalReadiness.criticalTitleCount', {
              count: criticalIssues.length,
            })}
          </h3>
          <ul className="approval-readiness__critical-list">
            {criticalIssues.map((item) => (
              <CriticalIssueRow key={item.id} item={item} t={t} />
            ))}
          </ul>
        </section>
      ) : null}

      {recommendedImprovements.length > 0 ? (
        <section
          className="approval-readiness__content-panel approval-readiness__content-panel--recommended"
          aria-labelledby="approval-readiness-recommended-heading"
        >
          <h3 id="approval-readiness-recommended-heading" className="approval-readiness__panel-title">
            {t('adminDataQuality.approvalReadiness.recommendedTitle', {
              count: recommendedImprovements.length,
            })}
          </h3>
          <div className="approval-readiness__chip-grid">
            {recommendedImprovements.map((item) => (
              <ImprovementChip key={item.id} item={item} t={t} />
            ))}
          </div>
        </section>
      ) : null}

      <DuplicateStatusCard submission={submission} t={t} />

      <PassedChecksSection items={passedChecks} sectionsCompact={sectionsCompact} t={t} />
    </div>
  )

  return (
    <AdminResponsiveAccordion
      id="admin-data-quality"
      compact={sectionsCompact}
      className="approval-readiness admin-data-quality"
      panelClassName="approval-readiness__panel admin-data-quality__panel"
      header={{
        eyebrow: t('adminDataQuality.approvalReadiness.eyebrow'),
        icon: <ClipboardCheck className="h-5 w-5" />,
        heading: t('adminDataQuality.approvalReadiness.title'),
        trailing: compactScoreSummary,
      }}
    >
      {!sectionsCompact ? cardHeader : (
        <p className="approval-readiness__subtitle approval-readiness__subtitle--compact">
          {t('adminDataQuality.approvalReadiness.subtitle')}
        </p>
      )}

      {cardBody}
    </AdminResponsiveAccordion>
  )
}
