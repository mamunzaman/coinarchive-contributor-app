import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getAdminContentLanguageMeta,
  getAdminSubmissionCountry,
  getSubmissionCoinCode,
  type AdminContentLanguageMeta,
} from '../../lib/adminQueueFilters'
import { getSubmissionDuplicateRisk } from '../../lib/duplicateProtection'
import type { SubmissionDuplicateRiskLevel } from '../../lib/duplicateProtection'
import { formatSubmittedDate } from '../../lib/format'
import { getSubmissionPreviewUrl } from '../../lib/submissionListUtils'

type AdminQueueCoinCellProps = {
  submission: AdminSubmissionListItem
  detailPath: string
  compact?: boolean
  layout?: 'default' | 'card'
}

function CoinThumbnail({
  submission,
  compact = false,
}: {
  submission: AdminSubmissionListItem
  compact?: boolean
}) {
  const previewUrl = getSubmissionPreviewUrl(submission)
  const sizeClass = compact ? 'h-14 w-14' : 'h-[4.5rem] w-[4.5rem]'
  const alt = `${submission.title} thumbnail`

  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={compact ? 56 : 72}
        height={compact ? 56 : 72}
        className={[
          sizeClass,
          'admin-queue-thumb shrink-0 rounded-xl border border-slate-200/70 bg-white object-contain p-1 shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
        ].join(' ')}
      />
    )
  }

  return (
    <div
      className={[
        sizeClass,
        'admin-queue-thumb flex shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50 font-serif text-base text-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
      ].join(' ')}
    >
      ◎
    </div>
  )
}

function MetaChip({ value }: { value: string }) {
  return (
    <span className="admin-queue-meta-chip inline-flex max-w-full items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
      <span className="truncate">{value}</span>
    </span>
  )
}

function getTranslationBadgeLabels(
  languageMeta: AdminContentLanguageMeta,
  compact: boolean,
  t: (key: string, params?: Record<string, unknown>) => string,
): { short: string; full: string } | null {
  const full = languageMeta.translationStatusLabel?.trim() ?? ''
  if (!full) return null

  if (!compact) {
    return { short: full, full }
  }

  const status = languageMeta.translationStatus.trim().toLowerCase().replace(/-/g, '_')
  if (status.includes('missing')) {
    const language =
      languageMeta.missingTranslationLanguageLabel ||
      t(`admin.contentLanguage.${languageMeta.missingTranslationLanguage}`)
    return {
      short: t('admin.translationMissing', { language }),
      full,
    }
  }

  if (status.includes('pending')) {
    return {
      short: t('admin.queue.translationPendingShort'),
      full,
    }
  }

  if (status.includes('available') || status.includes('linked')) {
    return {
      short: t('admin.queue.translationAvailableShort'),
      full,
    }
  }

  if (full.length > 34) {
    return { short: `${full.slice(0, 31)}…`, full }
  }

  return { short: full, full }
}

export function QueueLanguageBadges({
  submission,
  compactTranslation = false,
}: {
  submission: AdminSubmissionListItem
  compactTranslation?: boolean
}) {
  const { t } = useTranslation()
  const languageMeta = getAdminContentLanguageMeta(submission)
  const translationLabels = getTranslationBadgeLabels(languageMeta, compactTranslation, t)

  return (
    <>
      <span className="admin-queue-badge admin-queue-badge--language inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200">
        <span className="font-bold">{languageMeta.badge}</span>
        <span className="truncate">{languageMeta.label}</span>
      </span>
      {translationLabels ? (
        <span
          className="admin-queue-badge admin-queue-badge--translation inline-flex max-w-[11rem] items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200 sm:max-w-[13rem]"
          title={translationLabels.full}
          aria-label={translationLabels.full}
        >
          <span className="truncate">{translationLabels.short}</span>
        </span>
      ) : null}
    </>
  )
}

function getDuplicateRiskLabelKey(level: SubmissionDuplicateRiskLevel): string {
  switch (level) {
    case 'exact':
      return 'admin.queue.duplicateExact'
    case 'similar':
      return 'admin.queue.duplicateSimilar'
    case 'none':
      return 'admin.queue.duplicateNone'
    default:
      return 'admin.queue.duplicateUnchecked'
  }
}

export function QueueDuplicateBadge({ submission }: { submission: AdminSubmissionListItem }) {
  const { t } = useTranslation()
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const duplicateRiskClass =
    duplicateRisk.level === 'exact'
      ? 'admin-queue-badge--duplicate-exact'
      : duplicateRisk.level === 'similar'
        ? 'admin-queue-badge--duplicate-similar'
        : duplicateRisk.level === 'none'
          ? 'admin-queue-badge--duplicate-none'
          : 'admin-queue-badge--duplicate-unknown'
  const duplicateLabel = t(getDuplicateRiskLabelKey(duplicateRisk.level))

  return (
    <span
      className={['admin-queue-badge', duplicateRiskClass].join(' ')}
      title={duplicateRisk.reason || undefined}
      aria-label={`${duplicateLabel}${duplicateRisk.reason ? `: ${duplicateRisk.reason}` : ''}`}
    >
      <span className="truncate">{duplicateLabel}</span>
    </span>
  )
}

export function QueueBadgeRows({
  submission,
  compactTranslation = false,
}: {
  submission: AdminSubmissionListItem
  compactTranslation?: boolean
}) {
  return (
    <div className="admin-queue-badges">
      <div className="admin-queue-badges__row">
        <QueueLanguageBadges submission={submission} compactTranslation={compactTranslation} />
      </div>
      <div className="admin-queue-badges__row">
        <QueueDuplicateBadge submission={submission} />
      </div>
    </div>
  )
}

export function AdminQueueCardMetaRow({ submission }: { submission: AdminSubmissionListItem }) {
  const { t } = useTranslation()
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const duplicateLabel = t(getDuplicateRiskLabelKey(duplicateRisk.level))

  return (
    <div className="admin-queue-card-meta grid grid-cols-1 gap-x-4 gap-y-1 border-t border-slate-100 bg-slate-50/50 px-3 py-2 sm:grid-cols-3">
      <p className="min-w-0 truncate text-[11px] leading-snug">
        <span className="text-slate-400">{t('admin.queue.submittedLabel')}: </span>
        <span className="font-medium text-slate-700">{formatSubmittedDate(submission.date)}</span>
      </p>
      <p className="min-w-0 truncate text-[11px] leading-snug">
        <span className="text-slate-400">{t('admin.queue.updatedLabel')}: </span>
        <span className="font-medium text-slate-700">
          {formatSubmittedDate(submission.modified_date ?? submission.date)}
        </span>
      </p>
      <p
        className="min-w-0 truncate text-[11px] leading-snug"
        title={duplicateRisk.reason || undefined}
      >
        <span className="text-slate-400">{t('admin.queue.duplicateLabel')}: </span>
        <span className="font-medium text-slate-700">{duplicateLabel}</span>
      </p>
    </div>
  )
}

export function AdminQueueCoinCell({
  submission,
  detailPath,
  compact = false,
  layout = 'default',
}: AdminQueueCoinCellProps) {
  const coinCode = getSubmissionCoinCode(submission)
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const country = getAdminSubmissionCountry(submission)
  const year = submission.year != null ? String(submission.year) : ''
  const chips = [
    country || null,
    year || null,
    submission.denomination?.trim() || null,
    submission.coin_type?.trim() || null,
  ].filter(Boolean) as string[]

  if (layout === 'card') {
    return (
      <div className="admin-queue-coin-cell admin-queue-coin-cell--card flex min-w-0 items-start gap-2.5">
        <CoinThumbnail submission={submission} compact />
        <div className="min-w-0 flex-1">
          <Link
            to={detailPath}
            state={{ duplicateRisk }}
            className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors hover:text-teal-600"
            title={submission.title}
          >
            {submission.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <MetaChip value={`#${submission.id}`} />
            {chips.slice(0, 2).map((chip) => (
              <MetaChip key={chip} value={chip} />
            ))}
          </div>
          <div className="mt-1.5">
            <QueueBadgeRows submission={submission} compactTranslation />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-queue-coin-cell flex min-w-0 items-start gap-3">
      <CoinThumbnail submission={submission} compact={compact} />
      <div className="min-w-0 flex-1">
        <Link
          to={detailPath}
          state={{ duplicateRisk }}
          className="block truncate text-[14px] font-semibold leading-snug text-slate-800 transition-colors hover:text-teal-600 xl:text-[15px]"
          title={submission.title}
        >
          {submission.title}
        </Link>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <MetaChip key={chip} value={chip} />
          ))}
          <MetaChip value={`#${submission.id}`} />
        </div>
        <div className="mt-1.5 min-w-0 space-y-1">
          {coinCode ? (
            <span className="inline-block max-w-full truncate rounded-md bg-slate-100 px-1.5 py-px font-mono text-[10px] tracking-wide text-slate-500">
              {coinCode}
            </span>
          ) : null}
          <QueueBadgeRows submission={submission} compactTranslation />
        </div>
      </div>
    </div>
  )
}
