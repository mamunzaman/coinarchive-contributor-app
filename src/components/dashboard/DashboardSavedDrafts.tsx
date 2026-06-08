import type { ReactNode } from 'react'
import { FilePenLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'
import { ICON_ACTION } from '../ui/ActionControls'
import { StatusBadge } from '../ui/StatusBadge'
import { CompletionIndicator, getCompletionAccentClass } from './CompletionIndicator'
import {
  computeDraftCompletenessFromKey,
  computeSubmissionListCompleteness,
  type CompletenessResult,
} from '../../lib/completenessScore'
import { listSavedDrafts } from '../../lib/formDraftStorage'

type DashboardSavedDraftsProps = {
  apiDraftSubmissions?: CoinSubmission[]
}

function DraftContinueButton() {
  return (
    <span className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white group-focus-visible:bg-primary group-focus-visible:text-white">
      Continue
      <FilePenLine className={ICON_ACTION} aria-hidden />
    </span>
  )
}

function DraftRow({
  to,
  title,
  meta,
  completeness,
}: {
  to: string
  title: string
  meta: ReactNode
  completeness: CompletenessResult | null
}) {
  const accentClass = completeness ? getCompletionAccentClass(completeness) : 'bg-amber-400'

  return (
    <li>
      <Link
        to={to}
        className={[
          'group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl',
          'border border-border/50 bg-white/90 px-3 py-2.5',
          'transition-colors hover:border-border/70 hover:bg-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-1 focus-visible:ring-offset-amber-50/80',
        ].join(' ')}
      >
        <span
          className={['absolute inset-y-2 left-0 w-1 rounded-r-full', accentClass].join(' ')}
          aria-hidden
        />
        <span className="min-w-0 flex-1 pl-2">
          <span className="block truncate text-sm font-medium text-navy">{title}</span>
          <span className="mt-0.5 block text-xs text-navy-muted">{meta}</span>
          {completeness ? (
            <CompletionIndicator variant="card" result={completeness} className="mt-1" />
          ) : null}
        </span>
        <DraftContinueButton />
      </Link>
    </li>
  )
}

export function DashboardSavedDrafts({ apiDraftSubmissions = [] }: DashboardSavedDraftsProps) {
  const localDrafts = listSavedDrafts()

  if (localDrafts.length === 0 && apiDraftSubmissions.length === 0) {
    return null
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-100/90 bg-amber-50/35 p-3 sm:p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-100/90"
          aria-hidden
        >
          <FilePenLine className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-base font-semibold text-navy sm:text-lg">
              Continue unfinished drafts
            </h2>
            <span className="rounded-full border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-900/90">
              Unfinished
            </span>
          </div>
          <p className="mt-1 text-sm leading-snug text-navy-muted">
            Finish missing coin details before submitting.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {localDrafts.slice(0, 5).map((draft) => (
          <DraftRow
            key={draft.key}
            to={draft.kind === 'new' ? '/new-coin' : `/my-submissions/${draft.submissionId}/edit`}
            title={draft.title}
            meta={draft.kind === 'new' ? 'Local new coin draft' : `Local edit draft #${draft.submissionId}`}
            completeness={computeDraftCompletenessFromKey(draft.key)}
          />
        ))}
        {apiDraftSubmissions.map((submission) => (
          <DraftRow
            key={`api-draft-${submission.id}`}
            to={`/my-submissions/${submission.id}`}
            title={submission.title}
            meta={
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>Server draft · ID {submission.id}</span>
                <StatusBadge status={submission.status} />
              </span>
            }
            completeness={computeSubmissionListCompleteness(submission)}
          />
        ))}
      </ul>
    </section>
  )
}
