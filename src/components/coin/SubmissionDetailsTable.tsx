import type { CoinSubmissionDetail } from '../../lib/api'
import { SafeHtmlContent } from '../ui/SafeHtmlContent'
import {
  DetailFieldGrid,
  DetailFieldRow,
  DetailSectionCard,
  DetailTextBlock,
} from './SubmissionDetailCard'

type SubmissionDetailsTableProps = {
  submission: CoinSubmissionDetail
}

export function SubmissionDetailsTable({ submission }: SubmissionDetailsTableProps) {
  const acf = submission.acf

  return (
    <>
      <DetailSectionCard title="About this coin" subtitle="Title and core catalogue identity">
        <DetailFieldGrid>
          <DetailFieldRow label="Title" value={submission.title ?? ''} className="detail-field-span-full" />
          <DetailFieldRow label="Country" value={submission.country ?? ''} />
          <DetailFieldRow label="Year" value={submission.year ? String(submission.year) : ''} />
          <DetailFieldRow label="Denomination" value={submission.denomination ?? ''} />
          <DetailFieldRow label="Coin type" value={submission.coin_type ?? ''} />
          <DetailFieldRow label="Coin theme" value={acf?.coin_theme ?? ''} />
          <DetailFieldRow label="Release date" value={acf?.released_date ?? ''} />
          <DetailFieldRow label="Country code" value={acf?.coin_country_code ?? ''} />
          <DetailTextBlock label="Short description" value={submission.short_description ?? ''} />
        </DetailFieldGrid>
      </DetailSectionCard>

      <DetailSectionCard title="Specifications" subtitle="Physical and material attributes">
        <DetailFieldGrid>
          <DetailFieldRow label="Material" value={acf?.coin_material ?? ''} />
          <DetailFieldRow label="Quality" value={acf?.coin_quality ?? ''} />
          <DetailFieldRow label="Mintage" value={acf?.coin_mintage ?? ''} />
          <DetailFieldRow
            label="Weight"
            value={acf?.coin_weight_g != null ? `${acf.coin_weight_g} g` : ''}
          />
          <DetailFieldRow
            label="Diameter"
            value={acf?.coin_diameter_mm != null ? `${acf.coin_diameter_mm} mm` : ''}
          />
          <DetailFieldRow
            label="Thickness"
            value={acf?.coin_thickness_mm != null ? `${acf.coin_thickness_mm} mm` : ''}
          />
          <DetailFieldRow
            label="Edge inscription"
            value={acf?.coin_edge_inscription ?? ''}
            className="detail-field-span-full"
          />
        </DetailFieldGrid>
      </DetailSectionCard>

      <DetailSectionCard
        title="Descriptions & notes"
        subtitle="Obverse, reverse, and collector text"
        className="md:col-span-2 2xl:col-span-2"
      >
        <DetailFieldGrid>
          <DetailTextBlock
            label="Obverse description"
            value={acf?.coin_obverse_description ?? ''}
          />
          <DetailTextBlock
            label="Reverse description"
            value={acf?.coin_reverse_description ?? ''}
          />
          <div className="detail-field-row detail-field-span-full border-b border-border/40 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
              Historical background
            </dt>
            <dd className="mt-1.5">
              {acf?.coin_historical_background?.trim() ? (
                <div className="max-h-36 overflow-y-auto rounded-lg bg-muted/20 px-3 py-2.5 text-sm text-navy">
                  <SafeHtmlContent html={acf.coin_historical_background} />
                </div>
              ) : (
                <span className="text-sm italic text-navy-muted">Not provided</span>
              )}
            </dd>
          </div>
          <DetailTextBlock label="Collector notes" value={acf?.coin_collector_notes ?? ''} />
        </DetailFieldGrid>
      </DetailSectionCard>
    </>
  )
}
