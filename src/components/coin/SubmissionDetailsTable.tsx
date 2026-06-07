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

type DetailRow = {
  label: string
  value: string
}

function buildDetailRows(submission: CoinSubmissionDetail): DetailRow[] {
  const acf = submission.acf
  const singleMintMark = acf?.single_mint_mark ?? acf?.coin_single_mint_mark ?? ''

  return [
    { label: 'Quality', value: acf?.coin_quality ?? '' },
    { label: 'Mintage', value: acf?.coin_mintage ?? '' },
    { label: 'Country of issue', value: submission.country ?? '' },
    { label: 'Material', value: acf?.coin_material ?? '' },
    {
      label: 'Diameter',
      value: acf?.coin_diameter_mm != null ? `${acf.coin_diameter_mm} mm` : '',
    },
    {
      label: 'Weight',
      value: acf?.coin_weight_g != null ? `${acf.coin_weight_g} g` : '',
    },
    { label: 'Edge', value: acf?.coin_edge_inscription ?? '' },
    { label: 'Mint mark', value: singleMintMark },
    { label: 'Denomination', value: submission.denomination ?? '' },
    { label: 'Coin type', value: submission.coin_type ?? '' },
    { label: 'Theme', value: acf?.coin_theme ?? '' },
    { label: 'Released', value: acf?.released_date ?? '' },
    {
      label: 'Thickness',
      value: acf?.coin_thickness_mm != null ? `${acf.coin_thickness_mm} mm` : '',
    },
    { label: 'Country code', value: acf?.coin_country_code ?? '' },
  ].filter((row) => hasValue(row.value))
}

type SubmissionDetailsTableProps = {
  submission: CoinSubmissionDetail
}

export function SubmissionDetailsTable({ submission }: SubmissionDetailsTableProps) {
  const rows = buildDetailRows(submission)

  if (rows.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-xl font-semibold text-navy">Coin details</h2>
        <p className="mt-3 text-sm leading-relaxed text-navy-muted">
          No specification details have been recorded for this coin yet.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-navy">Coin details</h2>
      <dl className="mt-4 divide-y divide-border/60 border-y border-border/60">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4 sm:py-4"
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">
              {row.label}
            </dt>
            <dd className="text-sm leading-relaxed text-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
