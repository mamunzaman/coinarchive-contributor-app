import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../ui/StatusBadge'
import type { CoinSubmissionDetail } from '../../lib/api'
import { formatSubmittedDate } from '../../lib/format'
import { ICON_ACTION, LabeledActionButton } from '../ui/ActionControls'

type SubmissionDetailHeaderProps = {
  submission: CoinSubmissionDetail
  canDelete?: boolean
  isDeleting?: boolean
  deleteBlockedByImageEdit?: boolean
  onDelete?: () => void
  backTo?: string
  backLabel?: string
  editTo?: string
  showContributorActions?: boolean
  backLinkMode?: 'always' | 'desktop-only'
  showStatusBadge?: boolean
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-label/80 px-2.5 py-1 text-[11px] font-medium text-navy">
      {children}
    </span>
  )
}

function CoinCodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex max-w-full min-h-9 items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1.5 font-mono text-[11px] font-semibold text-navy transition-colors hover:border-primary/30 hover:bg-primary/5"
      aria-label={copied ? 'Coin code copied' : `Copy coin code ${code}`}
    >
      <span className="truncate">{code}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-navy-muted" aria-hidden />
      )}
    </button>
  )
}

export function SubmissionDetailHeader({
  submission,
  canDelete = false,
  isDeleting = false,
  deleteBlockedByImageEdit = false,
  onDelete,
  backTo = '/my-submissions',
  backLabel = 'Back to My Submissions',
  editTo,
  showContributorActions = true,
  backLinkMode = 'always',
  showStatusBadge = true,
}: SubmissionDetailHeaderProps) {
  const yearLabel = submission.year ? String(submission.year) : null
  const coinCode = submission.acf?.coin_code?.trim() || submission.acf?.unique_code?.trim() || ''

  const chips = [
    submission.country?.trim() ? submission.country : null,
    submission.denomination?.trim() ? submission.denomination : null,
    submission.coin_type?.trim() ? submission.coin_type : null,
  ].filter(Boolean) as string[]

  const hideHeaderNavRow =
    !showContributorActions && backLinkMode === 'desktop-only'

  return (
    <header className="rounded-xl border border-border/60 bg-white px-4 py-4 shadow-[var(--shadow-card)] sm:px-5 sm:py-5">
      <div
        className={[
          'flex flex-wrap items-center justify-between gap-3',
          hideHeaderNavRow ? 'hidden xl:flex' : '',
        ].join(' ')}
      >
        <Link
          to={backTo}
          className={[
            'min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover',
            backLinkMode === 'desktop-only' ? 'hidden xl:inline-flex' : 'inline-flex',
          ].join(' ')}
        >
          <ArrowLeft className={ICON_ACTION} aria-hidden />
          <span>{backLabel}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {showContributorActions && canDelete && deleteBlockedByImageEdit ? (
            <div className="flex flex-col items-end gap-1">
              <LabeledActionButton
                label="Delete submission"
                icon={Trash2}
                variant="danger"
                disabled
                className="opacity-50"
              />
              <p className="text-xs font-medium text-red-600">Finish image editing first.</p>
            </div>
          ) : null}
          {showContributorActions && canDelete && !deleteBlockedByImageEdit && onDelete ? (
            <LabeledActionButton
              label="Delete"
              icon={Trash2}
              variant="danger"
              disabled={isDeleting}
              onClick={onDelete}
            />
          ) : null}
          {showContributorActions && submission.status === 'pending' ? (
            <Link
              to={editTo ?? `/my-submissions/${submission.id}/edit`}
              className="action-btn-neutral inline-flex min-h-11 items-center gap-2 px-4"
            >
              <Pencil className={ICON_ACTION} aria-hidden />
              <span>Edit submission</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-semibold leading-tight text-navy sm:text-3xl">
            {submission.title}
          </h1>
          <p className="mt-1.5 text-sm text-navy-muted">
            Submitted {formatSubmittedDate(submission.date)}
          </p>
        </div>
        {yearLabel ? (
          <p
            className="shrink-0 font-serif text-3xl font-semibold tabular-nums text-navy sm:text-4xl"
            aria-label={`Year ${yearLabel}`}
          >
            {yearLabel}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <MetaChip key={chip}>{chip}</MetaChip>
        ))}
        {showStatusBadge ? <StatusBadge status={submission.status} /> : null}
        {coinCode ? <CoinCodeChip code={coinCode} /> : null}
      </div>
    </header>
  )
}
