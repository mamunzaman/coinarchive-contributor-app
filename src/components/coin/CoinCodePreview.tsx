import { Hash } from 'lucide-react'
import { generateCoinCodePreview } from '../../lib/coinCodePreview'
import type { TaxonomyOption } from '../../types/formOptions'

type CoinCodePreviewProps = {
  country: string
  year: string
  denomination: string
  coinType: string
  countries?: TaxonomyOption[]
}

export function CoinCodePreview({
  country,
  year,
  denomination,
  coinType,
  countries = [],
}: CoinCodePreviewProps) {
  const preview = generateCoinCodePreview(country, year, denomination, coinType, countries)

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
          Coin ID preview
        </p>
      </div>
      <p className="mt-2 font-mono text-sm font-semibold text-navy">
        {preview || 'Complete country, year, denomination, and coin type'}
      </p>
    </div>
  )
}
