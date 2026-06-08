import { formatMintMarkDisplay, type CoinAcfDetail, type MintVariantAcf } from '../../types/coinForm'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4 sm:py-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">{label}</dt>
      <dd className="text-sm leading-relaxed text-navy">{value}</dd>
    </div>
  )
}

function hasMintVariants(acf: CoinAcfDetail): boolean {
  if (acf.has_mint_variants !== undefined) {
    return Number(acf.has_mint_variants) === 1 || acf.has_mint_variants === true
  }

  if (acf.coin_has_mint_variants !== undefined) {
    return Number(acf.coin_has_mint_variants) === 1 || acf.coin_has_mint_variants === true
  }

  const variants = acf.mint_variants ?? acf.coin_mint_variants
  return Array.isArray(variants) && variants.length > 0
}

function getVariants(acf: CoinAcfDetail): MintVariantAcf[] {
  const variants = acf.mint_variants ?? acf.coin_mint_variants
  return Array.isArray(variants) ? variants : []
}

type SubmissionMintInfoProps = {
  acf?: CoinAcfDetail
}

export function SubmissionMintInfo({ acf }: SubmissionMintInfoProps) {
  if (!acf) {
    return null
  }

  const variants = hasMintVariants(acf)
  const singleMintMark = acf.single_mint_mark ?? acf.coin_single_mint_mark ?? ''
  const mintMarksAvailable = acf.mint_marks_available ?? acf.coin_mint_marks_available ?? ''
  const variantRows = getVariants(acf).filter(
    (row) => row.mint_mark_code || row.mint_mintage || row.mint_notes,
  )

  const hasSingleMint = !variants && singleMintMark.trim()
  const hasVariantInfo =
    variants && (mintMarksAvailable.trim() || variantRows.length > 0)

  if (!hasSingleMint && !hasVariantInfo && !variants) {
    return null
  }

  return (
    <section className="border-t border-border/50 pt-8">
      <h2 className="font-serif text-xl font-semibold text-navy">Mint information</h2>
      <dl className="mt-4 divide-y divide-border/60 border-y border-border/60">
        <DetailRow label="Has mint variants" value={variants ? 'Yes' : 'No'} />

        {!variants && hasSingleMint ? (
          <DetailRow label="Single mint mark" value={singleMintMark} />
        ) : null}

        {variants && mintMarksAvailable.trim() ? (
          <DetailRow label="Mint marks available" value={mintMarksAvailable} />
        ) : null}
      </dl>

      {variants && variantRows.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">
            Mint variants
          </h3>
          {variantRows.map((row, index) => (
            <div
              key={`${row.mint_mark_code ?? 'variant'}-${index}`}
              className="rounded-xl border border-border/40 bg-white/70 p-4 sm:p-5"
            >
              <dl className="divide-y divide-border/40">
                {row.mint_mark_code ? (
                  <DetailRow
                    label="Mint mark code"
                    value={formatMintMarkDisplay(row.mint_mark_code ?? '') || row.mint_mark_code || ''}
                  />
                ) : null}
                {row.mint_mintage != null && String(row.mint_mintage).trim() ? (
                  <DetailRow label="Mint mintage" value={String(row.mint_mintage)} />
                ) : null}
                {row.mint_notes?.trim() ? (
                  <DetailRow label="Mint notes" value={row.mint_notes} />
                ) : null}
              </dl>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
