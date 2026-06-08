import { FilePenLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CoinSubmission } from '../../lib/api'
import { Card } from '../ui/Card'
import { ICON_ACTION } from '../ui/ActionControls'
import { StatusBadge } from '../ui/StatusBadge'
import { listSavedDrafts } from '../../lib/formDraftStorage'

type DashboardSavedDraftsProps = {
  apiDraftSubmissions?: CoinSubmission[]
}

export function DashboardSavedDrafts({ apiDraftSubmissions = [] }: DashboardSavedDraftsProps) {
  const localDrafts = listSavedDrafts()

  if (localDrafts.length === 0 && apiDraftSubmissions.length === 0) {
    return null
  }

  return (
    <Card className="!p-4 sm:!p-5">
      <div className="flex items-center gap-2">
        <FilePenLine className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="font-serif text-base font-semibold text-navy">Saved drafts</h2>
      </div>
      <p className="mt-1 text-sm text-navy-muted">
        Unfinished entries saved on this device. Continue editing anytime.
      </p>
      <ul className="mt-4 space-y-2">
        {localDrafts.slice(0, 5).map((draft) => (
          <li key={draft.key}>
            <Link
              to={draft.kind === 'new' ? '/new-coin' : `/my-submissions/${draft.submissionId}/edit`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-white"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-navy">{draft.title}</span>
                <span className="mt-0.5 block text-xs text-navy-muted">
                  {draft.kind === 'new' ? 'Local new coin draft' : `Local edit draft #${draft.submissionId}`}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">
                Continue
                <FilePenLine className={`${ICON_ACTION} ml-1 inline`} aria-hidden />
              </span>
            </Link>
          </li>
        ))}
        {apiDraftSubmissions.map((submission) => (
          <li key={`api-draft-${submission.id}`}>
            <Link
              to={`/my-submissions/${submission.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-white"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-navy">{submission.title}</span>
                <span className="mt-0.5 block text-xs text-navy-muted">Server draft · ID {submission.id}</span>
              </span>
              <StatusBadge status={submission.status} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
