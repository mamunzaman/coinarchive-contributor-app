import type { CoinSubmissionDetail } from '../../lib/api'
import { formatSubmittedDate } from '../../lib/format'
import { StatusBadge } from '../ui/StatusBadge'
import { DetailFieldGrid, DetailFieldRow, DetailSectionCard } from './SubmissionDetailCard'

type SubmissionDetailKeyFactsProps = {
  submission: CoinSubmissionDetail
  showContributor?: boolean
}

export function SubmissionDetailKeyFacts({ submission, showContributor = false }: SubmissionDetailKeyFactsProps) {
  const acf = submission.acf
  const coinCode = acf?.coin_code?.trim() ?? ''
  const uniqueCode = acf?.unique_code?.trim() ?? ''
  const contributor =
    submission.submitted_by?.email?.trim() ||
    (submission.submitted_by?.contributor_id
      ? `Contributor #${submission.submitted_by.contributor_id}`
      : '')

  return (
    <DetailSectionCard title="Submission information" subtitle="Compact review metadata">
      <DetailFieldGrid>
        <DetailFieldRow label="Coin code" value={coinCode} valueVariant="code" />
        <DetailFieldRow label="Unique code" value={uniqueCode} valueVariant="code" />
        {showContributor ? <DetailFieldRow label="Contributor" value={contributor} /> : null}
        <DetailFieldRow label="Submitted date" value={formatSubmittedDate(submission.date)} />
        <DetailFieldRow
          label="Last updated"
          value={submission.modified_date ? formatSubmittedDate(submission.modified_date) : ''}
        />
        <DetailFieldRow label="Release date" value={acf?.released_date ?? ''} />
      </DetailFieldGrid>
      <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
          Status
        </span>
        <StatusBadge status={submission.status} />
      </div>
    </DetailSectionCard>
  )
}
