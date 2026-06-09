import type { CoinFormValues } from '../../types/coinForm'
import type { TaxonomyOption } from '../../types/formOptions'
import { generateCoinCodePreview } from '../../lib/coinCodePreview'

type CoinCataloguePreviewCardProps = {
  values: CoinFormValues
  obversePreviewUrl?: string | null
  reversePreviewUrl?: string | null
  countries?: TaxonomyOption[]
  title?: string
}

export function CoinCataloguePreviewCard({
  values,
  obversePreviewUrl,
  reversePreviewUrl,
  countries = [],
  title = 'Catalogue preview',
}: CoinCataloguePreviewCardProps) {
  const codePreview = generateCoinCodePreview(
    values.country,
    values.year,
    values.denomination,
    values.coin_type,
    countries,
    values.released_date,
  )

  const descriptionPreview =
    values.short_description.trim() ||
    'Short description will appear here as you type.'

  return (
    <div className="rounded-xl border border-border/70 bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
        {title}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PreviewFace label="Obverse" url={obversePreviewUrl} />
        <PreviewFace label="Reverse" url={reversePreviewUrl} />
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="font-serif text-lg font-semibold text-navy">
          {values.country.trim() || 'Country'}
        </p>
        <p className="text-sm text-navy-muted">
          {[values.year.trim() || 'Year', values.denomination.trim() || 'Denomination']
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="text-sm font-medium text-primary">
          {values.coin_type.trim() || 'Coin type'}
        </p>
      </div>

      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-navy-muted">
        {descriptionPreview}
      </p>

      {codePreview.baseComplete ? (
        <div className="mt-4 space-y-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
              Coin code
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-navy">{codePreview.coinCode}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
              Unique code
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-navy">{codePreview.uniqueCode}</p>
          </div>
          {codePreview.releaseDateMissing ? (
            <p className="text-[11px] text-amber-700">
              Release date is required to generate the final unique code.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PreviewFace({ label, url }: { label: string; url?: string | null }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
        {label}
      </p>
      {url ? (
        <img
          src={url}
          alt={label}
          className="aspect-square w-full rounded-xl border border-border/60 bg-panel object-contain p-2"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border/60 bg-panel text-xs text-navy-muted">
          No image
        </div>
      )}
    </div>
  )
}
