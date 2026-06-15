import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import type { CoinSubmissionDetail } from '../../lib/api'
import {
  buildAdminDataQualityAudit,
  getAdminDataQualityGuidanceKey,
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
  const radius = compact ? 22 : 30
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const viewBox = compact ? '0 0 64 64' : '0 0 80 80'
  const center = compact ? 32 : 40
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

function IssueButton({
  item,
  tone,
  t,
}: {
  item: AuditItem
  tone: 'critical' | 'recommended'
  t: TFunction
}) {
  const label = t(item.labelKey)
  const description = item.descriptionKey ? t(item.descriptionKey) : null
  const targetId = resolveAuditItemScrollTarget(item)
  const Icon = tone === 'critical' ? XCircle : AlertTriangle

  return (
    <li>
      <button
        type="button"
        className={`approval-readiness__issue approval-readiness__issue--${tone}`}
        onClick={() => scrollToApprovalTarget(targetId)}
        aria-label={t('adminDataQuality.approvalReadiness.navigateTo', { label })}
      >
        <Icon className="approval-readiness__issue-icon" aria-hidden />
        <span className="approval-readiness__issue-copy">
          <span className="approval-readiness__issue-label">{label}</span>
          {description ? (
            <span className="approval-readiness__issue-desc">{description}</span>
          ) : null}
        </span>
      </button>
    </li>
  )
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

  return (
    <section className="approval-readiness__section approval-readiness__section--passed" aria-labelledby="approval-readiness-passed-heading">
      <button
        type="button"
        id="approval-readiness-passed-heading"
        className="approval-readiness__passed-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <CheckCircle2 className="approval-readiness__passed-icon" aria-hidden />
        <span>{t('adminDataQuality.approvalReadiness.passedSummary', { count: items.length })}</span>
        <span className="approval-readiness__passed-action">
          {open
            ? t('adminDataQuality.approvalReadiness.hidePassed')
            : t('adminDataQuality.approvalReadiness.showPassed')}
        </span>
        <ChevronDown
          className={[
            'approval-readiness__passed-chevron',
            open ? 'approval-readiness__passed-chevron--open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        />
      </button>
      <div
        className={[
          'approval-readiness__passed-panel',
          open ? 'approval-readiness__passed-panel--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={!open}
      >
        <div className="approval-readiness__passed-panel-inner">
          <ul className="approval-readiness__passed-list">
            {items.map((item) => (
              <li key={item.id} className="approval-readiness__passed-row">
                <CheckCircle2 className="approval-readiness__passed-row-icon" aria-hidden />
                <span>{t(item.labelKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function DuplicateStatusCard({
  submission,
  t,
}: {
  submission: CoinSubmissionDetail
  t: TFunction
}) {
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const tone =
    duplicateRisk.level === 'exact'
      ? 'red'
      : duplicateRisk.level === 'similar'
        ? 'amber'
        : 'green'

  const messageKey =
    duplicateRisk.level === 'exact'
      ? 'adminDataQuality.approvalReadiness.duplicate.exact'
      : duplicateRisk.level === 'similar'
        ? 'adminDataQuality.approvalReadiness.duplicate.similar'
        : duplicateRisk.level === 'none'
          ? 'adminDataQuality.approvalReadiness.duplicate.none'
          : 'adminDataQuality.approvalReadiness.duplicate.unknown'

  const Icon =
    tone === 'red' ? XCircle : tone === 'amber' ? AlertTriangle : CheckCircle2

  return (
    <section
      id="approval-duplicate-status"
      className={`approval-readiness__duplicate approval-readiness__duplicate--${tone}`}
      aria-labelledby="approval-duplicate-status-title"
      tabIndex={-1}
    >
      <div className="approval-readiness__duplicate-head">
        <Copy className="approval-readiness__duplicate-icon" aria-hidden />
        <h3 id="approval-duplicate-status-title" className="approval-readiness__duplicate-title">
          {t('adminDataQuality.approvalReadiness.duplicate.title')}
        </h3>
      </div>
      <p className="approval-readiness__duplicate-message">
        <Icon className="approval-readiness__duplicate-status-icon" aria-hidden />
        <span>{t(messageKey)}</span>
      </p>
    </section>
  )
}

export function AdminDataQualityAudit({
  submission,
  sectionsCompact = false,
}: AdminDataQualityAuditProps) {
  const { t } = useTranslation()
  const audit = useMemo(() => buildAdminDataQualityAudit(submission), [submission])
  const guidanceKey = getAdminDataQualityGuidanceKey(audit)
  const badgeKey = getApprovalReadinessBadgeKey(audit)
  const criticalIssues = collectCriticalIssues(audit)
  const recommendedImprovements = collectRecommendedImprovements(audit)
  const passedChecks = collectPassedAuditItems(audit)
  const statusLabel = t(`adminDataQuality.approvalReadiness.status.${badgeKey}`)
  const allRecommendationsDone =
    recommendedImprovements.length === 0 && guidanceKey !== 'blockers'

  const scoreTrailing = (
    <div className="approval-readiness__hero-score">
      <ScoreRing score={audit.score} statusLabel={statusLabel} compact={sectionsCompact} />
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
    </div>
  )

  const desktopHero = (
    <div className="approval-readiness__hero">
      <div className="approval-readiness__hero-copy">
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
        <div className="approval-readiness__metrics" role="status">
          <span>{t('adminDataQuality.summaryRequired', audit.summary)}</span>
          <span aria-hidden>·</span>
          <span>{t('adminDataQuality.summaryRecommended', audit.summary)}</span>
        </div>
      </div>
      {scoreTrailing}
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
        trailing: scoreTrailing,
      }}
    >
      {!sectionsCompact ? desktopHero : (
        <p className="approval-readiness__subtitle approval-readiness__subtitle--compact">
          {t('adminDataQuality.approvalReadiness.subtitle')}
        </p>
      )}

      {guidanceKey === 'ready' && criticalIssues.length === 0 ? (
        <div role="status" className="approval-readiness__ready-banner">
          <CheckCircle2 className="approval-readiness__ready-banner-icon" aria-hidden />
          <div className="approval-readiness__ready-banner-copy">
            <p className="approval-readiness__ready-banner-title">
              {t('adminDataQuality.approvalReadiness.readyBannerTitle')}
            </p>
            <p className="approval-readiness__ready-banner-detail">
              {allRecommendationsDone
                ? t('adminDataQuality.approvalReadiness.readyBannerAllDone')
                : t('adminDataQuality.approvalReadiness.readyBannerImprovements', {
                    count: recommendedImprovements.length,
                  })}
            </p>
          </div>
        </div>
      ) : null}

      <section
        className="approval-readiness__section approval-readiness__section--critical"
        aria-labelledby="approval-readiness-critical-heading"
      >
        <h3 id="approval-readiness-critical-heading" className="approval-readiness__section-title">
          {t('adminDataQuality.approvalReadiness.criticalTitle')}
        </h3>
        {criticalIssues.length === 0 ? (
          <div className="approval-readiness__empty approval-readiness__empty--success" role="status">
            <CheckCircle2 className="approval-readiness__empty-icon" aria-hidden />
            <span>{t('adminDataQuality.approvalReadiness.noBlockers')}</span>
          </div>
        ) : (
          <ul className="approval-readiness__issue-list">
            {criticalIssues.map((item) => (
              <IssueButton key={item.id} item={item} tone="critical" t={t} />
            ))}
          </ul>
        )}
      </section>

      {recommendedImprovements.length > 0 ? (
        <section
          className="approval-readiness__section approval-readiness__section--recommended"
          aria-labelledby="approval-readiness-recommended-heading"
        >
          <h3 id="approval-readiness-recommended-heading" className="approval-readiness__section-title">
            {t('adminDataQuality.approvalReadiness.recommendedTitle', {
              count: recommendedImprovements.length,
            })}
          </h3>
          <ul className="approval-readiness__issue-list">
            {recommendedImprovements.map((item) => (
              <IssueButton key={item.id} item={item} tone="recommended" t={t} />
            ))}
          </ul>
        </section>
      ) : null}

      <DuplicateStatusCard submission={submission} t={t} />

      <PassedChecksSection items={passedChecks} sectionsCompact={sectionsCompact} t={t} />

      {guidanceKey === 'blockers' ? (
        <div role="status" className="approval-readiness__guidance approval-readiness__guidance--blockers">
          <ShieldAlert className="approval-readiness__guidance-icon" aria-hidden />
          <span>{t('adminDataQuality.guidance.blockers')}</span>
        </div>
      ) : guidanceKey === 'warnings' ? (
        <div role="status" className="approval-readiness__guidance approval-readiness__guidance--warnings">
          <AlertTriangle className="approval-readiness__guidance-icon" aria-hidden />
          <span>{t('adminDataQuality.guidance.warnings')}</span>
        </div>
      ) : null}
    </AdminResponsiveAccordion>
  )
}
