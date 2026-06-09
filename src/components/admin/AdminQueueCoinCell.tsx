import { Link } from 'react-router-dom'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import {
  getAdminSubmissionCountry,
  getContributorLabel,
  getSubmissionCoinCode,
} from '../../lib/adminQueueFilters'
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
  // 48px on tablet, 56px on desktop
  const sizeClass = compact ? 'h-12 w-12 xl:h-14 xl:w-14' : 'h-14 w-14'

  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt=""
        className={[
          sizeClass,
          'shrink-0 rounded-xl border border-slate-200/70 bg-white object-cover shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
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

export function AdminQueueCoinCell({
  submission,
  detailPath,
  compact = false,
}: AdminQueueCoinCellProps) {
  const coinCode = getSubmissionCoinCode(submission)
  const contributor = getContributorLabel(submission)
  const country = getAdminSubmissionCountry(submission)
  const year = submission.year != null ? String(submission.year) : ''

  const metaParts = [
    `#${submission.id}`,
    contributor !== '—' ? contributor : null,
    country || null,
    year || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <CoinThumbnail submission={submission} compact={compact} />
      <div className="min-w-0 flex-1">
        <Link
          to={detailPath}
          className="block truncate text-[14px] font-semibold leading-snug text-slate-800 transition-colors hover:text-teal-600 xl:text-[15px]"
          title={submission.title}
        >
          {submission.title}
        </Link>
        <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-400">
          {metaParts}
        </p>
        {coinCode ? (
          <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-px font-mono text-[10px] tracking-wide text-slate-500">
            {coinCode}
          </span>
        ) : null}
      </div>
    </div>
  )
}
