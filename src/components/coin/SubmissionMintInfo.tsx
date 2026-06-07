import { Card } from '../ui/Card'
import type { CoinAcfDetail, MintVariantAcf } from '../../types/coinForm'

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-navy">{value}</p>
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
    <Card>
      <h2 className="font-serif text-lg font-semibold text-navy">Mint information</h2>
      <div className="mt-4 flex flex-col gap-4">
        <DetailItem label="Has mint variants" value={variants ? 'Yes' : 'No'} />

        {!variants && hasSingleMint ? (
          <DetailItem label="Single mint mark" value={singleMintMark} />
        ) : null}

        {variants && mintMarksAvailable.trim() ? (
          <DetailItem label="Mint marks available" value={mintMarksAvailable} />
        ) : null}

        {variants && variantRows.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">
              Mint variants
            </p>
            <div className="grid gap-3">
              {variantRows.map((row, index) => (
                <div
                  key={`${row.mint_mark_code ?? 'variant'}-${index}`}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {row.mint_mark_code ? (
                      <DetailItem label="Mint mark code" value={row.mint_mark_code} />
                    ) : null}
                    {row.mint_mintage != null && String(row.mint_mintage).trim() ? (
                      <DetailItem label="Mint mintage" value={String(row.mint_mintage)} />
                    ) : null}
                  </div>
                  {row.mint_notes?.trim() ? (
                    <div className="mt-4">
                      <DetailItem label="Mint notes" value={row.mint_notes} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
