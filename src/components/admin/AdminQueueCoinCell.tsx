import { Link } from 'react-router-dom'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getAdminSubmissionCountry,
  getContributorLabel,
  getSubmissionCompletenessScore,
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
  const completeness = getSubmissionCompletenessScore(submission)
  const incomplete = completeness !== null && completeness < 80
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const showDuplicateRisk = duplicateRisk.level === 'exact' || duplicateRisk.level === 'similar'

  if (!showDuplicateRisk && !incomplete) {
    return null
  }

  const duplicateRiskClass =
    duplicateRisk.level === 'exact'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : 'bg-amber-50 text-amber-700 ring-amber-200'

  return (
    <div className="flex flex-wrap gap-1.5">
      {showDuplicateRisk ? (
        <span
          className={[
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
            duplicateRiskClass,
          ].join(' ')}
          title={duplicateRisk.reason}
          aria-label={`${duplicateRisk.label}${duplicateRisk.reason ? `: ${duplicateRisk.reason}` : ''}`}
        >
          {duplicateRisk.label}
        </span>
      ) : null}
      {incomplete ? (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
          Incomplete {completeness}%
        </span>
      ) : null}
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
