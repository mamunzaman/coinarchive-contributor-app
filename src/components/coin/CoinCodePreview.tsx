import { Hash } from 'lucide-react'
import { generateCoinCodePreview } from '../../lib/coinCodePreview'
import type { TaxonomyOption } from '../../types/formOptions'

type CoinCodePreviewProps = {
  country: string
  year: string
  denomination: string
  coinType: string
  releaseDate?: string
  countries?: TaxonomyOption[]
}

export function CoinCodePreview({
  country,
  year,
  denomination,
  coinType,
  releaseDate = '',
  countries = [],
}: CoinCodePreviewProps) {
  const preview = generateCoinCodePreview(
    country,
    year,
    denomination,
    coinType,
    countries,
    releaseDate,
  )

  if (!preview.baseComplete) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Coin code preview
          </p>
        </div>
        <p className="mt-2 text-sm text-navy-muted">
          Complete country, year, denomination, and coin type
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
          Coin code
        </p>
      </div>

      <p className="mt-2 font-mono text-sm font-semibold text-navy">{preview.coinCode}</p>

      {preview.releaseDateMissing ? (
        <p className="mt-2 text-xs text-amber-700">
          Release date is required to generate the final coin code.
        </p>
      ) : null}

      <p className="mt-2 text-xs text-navy-muted">
        Preview only. WordPress may assign -002, -003, etc. if this code already exists.
      </p>
      <p className="mt-1 text-xs text-navy-muted">
        Final suffix is assigned by WordPress on submit.
      </p>
    </div>
  )
}
