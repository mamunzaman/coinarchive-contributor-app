import { Link } from 'react-router-dom'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getAdminQueueQuality,
  getAdminSubmissionCountry,
  getContributorLabel,
  getSubmissionCoinCode,
} from '../../lib/adminQueueFilters'
import { getSubmissionDuplicateRisk } from '../../lib/duplicateProtection'
import { getSubmissionPreviewUrl } from '../../lib/submissionListUtils'

type AdminQueueCoinCellProps = {
  submission: AdminSubmissionListItem
  detailPath: string
  compact?: boolean
}

function CoinThumbnail({
  submission,
  compact = false,
}: {
  submission: AdminSubmissionListItem
  compact?: boolean
}) {
  const previewUrl = getSubmissionPreviewUrl(submission)
  const sizeClass = compact ? 'h-16 w-16 xl:h-[4.5rem] xl:w-[4.5rem]' : 'h-20 w-20'
  const alt = `${submission.title} thumbnail`

  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={alt}
        className={[
          sizeClass,
          'shrink-0 rounded-2xl border border-slate-200/70 bg-white object-contain p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
        ].join(' ')}
      />
    )
  }

  return (
    <div
      className={[
        sizeClass,
        'flex shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50 font-serif text-base text-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
      ].join(' ')}
    >
      ◎
    </div>
  )
}

function MetaChip({ value }: { value: string }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
      <span className="truncate">{value}</span>
    </span>
  )
}

export function QueueSignalBadges({ submission }: { submission: AdminSubmissionListItem }) {
  const quality = getAdminQueueQuality(submission)
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const duplicateRiskClass =
    duplicateRisk.level === 'exact'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : duplicateRisk.level === 'similar'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : duplicateRisk.level === 'none'
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200'
  const duplicateRiskLabel =
    duplicateRisk.level === 'exact'
      ? 'Exact duplicate'
      : duplicateRisk.level === 'similar'
        ? 'Similar duplicate'
        : duplicateRisk.level === 'none'
          ? 'No known risk'
          : 'Duplicate not checked'
  const qualityClass =
    quality.score >= 85
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : quality.score >= 65
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-red-50 text-red-700 ring-red-200'
  const missingText =
    quality.missing.length > 0
      ? `Missing: ${quality.missing.slice(0, 2).join(', ')}${quality.missing.length > 2 ? '…' : ''}`
      : 'Core review data present'

  return (
    <div className="flex flex-wrap gap-1.5">
      <span
        className={[
          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
          duplicateRiskClass,
        ].join(' ')}
        title={duplicateRisk.reason}
        aria-label={`${duplicateRiskLabel}${duplicateRisk.reason ? `: ${duplicateRisk.reason}` : ''}`}
      >
        {duplicateRiskLabel}
      </span>
      <span
        className={[
          'inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
          qualityClass,
        ].join(' ')}
        title={missingText}
        aria-label={`${quality.score}% ready. ${missingText}`}
      >
        {quality.score}% ready
        <span className="ml-1 hidden max-w-[12rem] truncate sm:inline">{missingText}</span>
      </span>
    </div>
  )
}

export function AdminQueueCoinCell({
  submission,
  detailPath,
  compact = false,
}: AdminQueueCoinCellProps) {
  const coinCode = getSubmissionCoinCode(submission)
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const contributor = getContributorLabel(submission)
  const country = getAdminSubmissionCountry(submission)
  const year = submission.year != null ? String(submission.year) : ''
  const chips = [
    country || null,
    year || null,
    submission.denomination?.trim() || null,
    submission.coin_type?.trim() || null,
  ].filter(Boolean) as string[]

  return (
    <div className="flex min-w-0 items-center gap-3">
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
          {chips.map((chip) => <MetaChip key={chip} value={chip} />)}
          <MetaChip value={`#${submission.id}`} />
        </div>
        <p className="mt-1 truncate text-[11px] leading-snug text-slate-500">
          {contributor !== '—' ? contributor : 'Contributor unavailable'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {coinCode ? (
            <span className="inline-block max-w-full truncate rounded-md bg-slate-100 px-1.5 py-px font-mono text-[10px] tracking-wide text-slate-500">
              {coinCode}
            </span>
          ) : null}
          <QueueSignalBadges submission={submission} />
        </div>
      </div>
    </div>
  )
}
