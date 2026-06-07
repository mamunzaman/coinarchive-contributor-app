import type { ReactNode } from 'react'
import { Card } from '../ui/Card'
import type { CoinSubmissionDetail } from '../../lib/api'

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-navy">{value}</p>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

type SubmissionDetailSectionsProps = {
  submission: CoinSubmissionDetail
}

export function SubmissionDetailSections({ submission }: SubmissionDetailSectionsProps) {
  const acf = submission.acf

  const coreItems = [
    { label: 'Coin Code', value: acf?.coin_code },
    { label: 'Theme', value: acf?.coin_theme },
    { label: 'Country', value: submission.country },
    { label: 'Country Code', value: acf?.coin_country_code },
    { label: 'Year', value: submission.year ? String(submission.year) : '' },
    { label: 'Denomination', value: submission.denomination },
    { label: 'Coin type', value: submission.coin_type },
  ].filter((item) => hasValue(item.value))

  const specificationItems = [
    { label: 'Released date', value: acf?.released_date },
    { label: 'Mintage', value: acf?.coin_mintage },
    { label: 'Material', value: acf?.coin_material },
    { label: 'Quality', value: acf?.coin_quality },
    {
      label: 'Weight (g)',
      value: acf?.coin_weight_g != null ? String(acf.coin_weight_g) : '',
    },
    {
      label: 'Diameter (mm)',
      value: acf?.coin_diameter_mm != null ? String(acf.coin_diameter_mm) : '',
    },
    {
      label: 'Thickness (mm)',
      value: acf?.coin_thickness_mm != null ? String(acf.coin_thickness_mm) : '',
    },
    { label: 'Edge inscription', value: acf?.coin_edge_inscription },
  ].filter((item) => hasValue(item.value))

  const descriptionItems = [
    { label: 'Short description', value: submission.short_description },
    { label: 'Obverse description', value: acf?.coin_obverse_description },
    { label: 'Reverse description', value: acf?.coin_reverse_description },
    { label: 'Historical background', value: acf?.coin_historical_background },
    { label: 'Collector notes', value: acf?.coin_collector_notes },
  ].filter((item) => hasValue(item.value))

  return (
    <>
      {coreItems.length > 0 ? (
        <SectionCard title="Core">
          <div className="grid gap-4 sm:grid-cols-2">
            {coreItems.map((item) => (
              <DetailItem key={item.label} label={item.label} value={item.value as string} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {specificationItems.length > 0 ? (
        <SectionCard title="Specifications">
          <div className="grid gap-4 sm:grid-cols-2">
            {specificationItems.map((item) => (
              <DetailItem key={item.label} label={item.label} value={item.value as string} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {descriptionItems.length > 0 ? (
        <SectionCard title="Descriptions">
          <div className="flex flex-col gap-4">
            {descriptionItems.map((item) => (
              <DetailItem key={item.label} label={item.label} value={item.value as string} />
            ))}
          </div>
        </SectionCard>
      ) : null}
    </>
  )
}
