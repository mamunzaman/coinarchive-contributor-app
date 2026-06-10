import type { CoinSubmissionDetail } from '../../lib/api'
import { hasAiAssistedDescriptionContent } from '../../lib/aiDescriptionGenerator'
import { SafeHtmlContent } from '../ui/SafeHtmlContent'
import {
  DetailFieldGrid,
  DetailFieldRow,
  DetailSectionCard,
  DetailTextBlock,
} from './SubmissionDetailCard'

type SubmissionDetailsTableProps = {
  submission: CoinSubmissionDetail
  editHrefs?: {
    about?: string
    specifications?: string
    descriptions?: string
  }
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined
}

function hasHtmlText(value: string | undefined): boolean {
  return Boolean(value?.replace(/<[^>]*>/g, '').trim())
}

export function SubmissionDetailsTable({ submission, editHrefs }: SubmissionDetailsTableProps) {
  const acf = submission.acf
  const hasAiDescriptions = hasAiAssistedDescriptionContent(submission)
  const hasAbout =
    [
      submission.title,
      submission.country,
      submission.year ? String(submission.year) : '',
      submission.denomination,
      submission.coin_type,
      acf?.coin_theme,
      acf?.coin_country_code,
      submission.short_description,
    ].some(hasText)

  const hasSpecifications =
    [
      acf?.coin_material,
      acf?.coin_quality,
      acf?.coin_mintage,
      acf?.coin_weight_g,
      acf?.coin_diameter_mm,
      acf?.coin_thickness_mm,
      acf?.coin_edge_inscription,
    ].some(hasText)

  const hasDescriptions =
    [
      acf?.coin_obverse_description,
      acf?.coin_reverse_description,
      acf?.coin_collector_notes,
    ].some(hasText) || hasHtmlText(acf?.coin_historical_background)

  return (
    <>
      {hasAbout ? (
        <DetailSectionCard
          title="About coin"
          subtitle="Catalogue identity and summary"
          editHref={editHrefs?.about}
        >
          <DetailFieldGrid>
            <DetailFieldRow label="Title" value={submission.title ?? ''} className="detail-field-span-full" />
            <DetailFieldRow label="Country" value={submission.country ?? ''} />
            <DetailFieldRow label="Year" value={submission.year ? String(submission.year) : ''} />
            <DetailFieldRow label="Denomination" value={submission.denomination ?? ''} />
            <DetailFieldRow label="Coin type" value={submission.coin_type ?? ''} />
            <DetailFieldRow label="Coin theme" value={acf?.coin_theme ?? ''} />
            <DetailFieldRow label="Country code" value={acf?.coin_country_code ?? ''} />
            <DetailTextBlock label="Short description" value={submission.short_description ?? ''} />
          </DetailFieldGrid>
        </DetailSectionCard>
      ) : null}

      {hasSpecifications ? (
        <DetailSectionCard
          title="Specifications"
          subtitle="Physical and material attributes"
          editHref={editHrefs?.specifications}
        >
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
      ) : null}

      {hasDescriptions ? (
        <DetailSectionCard
          title="Descriptions"
          subtitle="Obverse, reverse, historical, and collector text"
          editHref={editHrefs?.descriptions}
          titleAccessory={
            hasAiDescriptions ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary ring-1 ring-primary/20">
                AI Assisted
              </span>
            ) : null
          }
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
            {hasHtmlText(acf?.coin_historical_background) ? (
              <div className="detail-field-row detail-field-span-full border-b border-border/40 py-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
                  Historical background
                </dt>
                <dd className="mt-1.5">
                  <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/20 px-3 py-2.5 text-sm text-navy">
                    <SafeHtmlContent html={acf?.coin_historical_background ?? ''} />
                  </div>
                </dd>
              </div>
            ) : null}
            <DetailTextBlock label="Collector notes" value={acf?.coin_collector_notes ?? ''} />
          </DetailFieldGrid>
        </DetailSectionCard>
      ) : null}
    </>
  )
}
