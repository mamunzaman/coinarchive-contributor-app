import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../ui/StatusBadge'
import type { CoinSubmissionDetail } from '../../lib/api'
import { formatSubmittedDate } from '../../lib/format'

type SubmissionDetailHeaderProps = {
  submission: CoinSubmissionDetail
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-label/80 px-3 py-1.5 text-xs font-medium text-navy">
      {children}
    </span>
  )
}

export function SubmissionDetailHeader({ submission }: SubmissionDetailHeaderProps) {
  const yearLabel = submission.year ? String(submission.year) : null

  const chips = [
    submission.country?.trim() ? submission.country : null,
    submission.coin_type?.trim() ? submission.coin_type : null,
    submission.denomination?.trim() ? submission.denomination : null,
    yearLabel,
  ].filter(Boolean) as string[]

  return (
    <header className="flex flex-col gap-5 border-b border-border/50 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/my-submissions"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          ← Back to My Submissions
        </Link>
        {submission.status === 'pending' ? (
          <Link
            to={`/my-submissions/${submission.id}/edit`}
            className="action-btn-neutral min-h-11 px-5"
          >
            Edit submission
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl lg:text-[2.75rem]">
          {submission.title}
        </h1>
        {yearLabel ? (
          <p
            className="shrink-0 font-serif text-4xl font-semibold tabular-nums text-navy sm:text-5xl lg:text-6xl"
            aria-label={`Year ${yearLabel}`}
          >
            {yearLabel}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <MetaChip key={chip}>{chip}</MetaChip>
        ))}
        <StatusBadge status={submission.status} />
      </div>

      <p className="text-sm text-navy-muted">
        Submitted {formatSubmittedDate(submission.date)}
        {submission.acf?.coin_code?.trim() ? (
          <span className="text-navy-muted/80"> · {submission.acf.coin_code}</span>
        ) : null}
      </p>
    </header>
  )
}
