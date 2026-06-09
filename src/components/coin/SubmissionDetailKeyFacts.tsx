import type { CoinSubmissionDetail } from '../../lib/api'
import { StatusBadge } from '../ui/StatusBadge'
import { DetailFieldGrid, DetailFieldRow, DetailSectionCard } from './SubmissionDetailCard'

type SubmissionDetailKeyFactsProps = {
  submission: CoinSubmissionDetail
}

export function SubmissionDetailKeyFacts({ submission }: SubmissionDetailKeyFactsProps) {
  const acf = submission.acf
  const coinCode = acf?.coin_code?.trim() || acf?.unique_code?.trim() || ''

  return (
    <DetailSectionCard title="Key facts" subtitle="Quick reference for this submission">
      <DetailFieldGrid>
        <DetailFieldRow label="Country" value={submission.country ?? ''} />
        <DetailFieldRow label="Year" value={submission.year ? String(submission.year) : ''} />
        <DetailFieldRow label="Denomination" value={submission.denomination ?? ''} />
        <DetailFieldRow label="Coin type" value={submission.coin_type ?? ''} />
        <DetailFieldRow label="Release date" value={acf?.released_date ?? ''} />
          <DetailFieldRow label="Coin code" value={coinCode} valueVariant="code" />
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
