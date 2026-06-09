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
  variant?: 'form' | 'review'
}

export function CoinCodePreview({
  country,
  year,
  denomination,
  coinType,
  releaseDate = '',
  countries = [],
  variant = 'form',
}: CoinCodePreviewProps) {
  const preview = generateCoinCodePreview(
    country,
    year,
    denomination,
    coinType,
    countries,
    releaseDate,
  )

  const isReview = variant === 'review'
  const title = isReview ? 'Coin Code Preview' : 'Coin code'
  const shellClass = isReview
    ? 'rounded-xl border border-primary/25 bg-gradient-to-br from-white via-[#f8fbfa] to-[#f3f8f7] px-4 py-4 shadow-[var(--shadow-card)] sm:px-5 sm:py-5'
    : 'rounded-xl border border-border/60 bg-muted/20 px-4 py-3'

  if (!preview.baseComplete) {
    return (
      <div className={shellClass}>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
            {title}
          </p>
        </div>
        <p className="mt-2 text-sm text-navy-muted">
          Complete country, year, denomination, and coin type to preview the coin code.
        </p>
      </div>
    )
  }

  return (
    <div className={shellClass}>
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
          {title}
        </p>
      </div>

      <p
        className={[
          'mt-3 break-all font-mono font-semibold text-navy',
          isReview ? 'text-base sm:text-lg' : 'text-sm',
        ].join(' ')}
      >
        {preview.coinCode}
      </p>

      {preview.releaseDateMissing ? (
        <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
          Release date is required to generate the final coin code suffix.
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-navy-muted">
        {isReview
          ? 'Preview only. WordPress assigns the final suffix when submitted.'
          : 'Preview only. WordPress may assign -002, -003, etc. if this code already exists.'}
      </p>
      {!isReview ? (
        <p className="mt-1 text-xs text-navy-muted">Final suffix is assigned by WordPress on submit.</p>
      ) : null}
    </div>
  )
}
