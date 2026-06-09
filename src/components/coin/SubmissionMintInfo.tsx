import {
  formatMintMarkDisplay,
  getMintMarkLabel,
  REVIEW_EMPTY_VALUE,
  type CoinAcfDetail,
  type MintVariantAcf,
} from '../../types/coinForm'
import {
  DetailFieldGrid,
  DetailFieldRow,
  DetailSectionCard,
  DetailTextBlock,
} from './SubmissionDetailCard'

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
  bare?: boolean
  className?: string
}

function MintVariantCard({ row, index }: { row: MintVariantAcf; index: number }) {
  const code = row.mint_mark_code ?? ''
  const city = getMintMarkLabel(code) ?? ''

  return (
    <div className="rounded-lg border border-border/50 bg-[#faf8f5] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        Variant {index + 1}
      </p>
      <DetailFieldGrid>
        <DetailFieldRow label="Mint mark" value={formatMintMarkDisplay(code) || code} />
        <DetailFieldRow label="Mint city / location" value={city} />
        <DetailFieldRow
          label="Variant mintage"
          value={row.mint_mintage != null ? String(row.mint_mintage) : ''}
        />
        <DetailTextBlock label="Variant notes" value={row.mint_notes ?? ''} />
      </DetailFieldGrid>
    </div>
  )
}

function MintInfoContent({ acf }: { acf?: CoinAcfDetail }) {
  const variantsEnabled = acf ? hasMintVariants(acf) : false
  const singleMintMark = acf?.single_mint_mark ?? acf?.coin_single_mint_mark ?? ''
  const mintMarksAvailable = acf?.mint_marks_available ?? acf?.coin_mint_marks_available ?? ''
  const variantRows = acf ? getVariants(acf) : []

  return (
    <>
      <DetailFieldGrid>
        <DetailFieldRow
          label="Mint status"
          value={variantsEnabled ? 'Multiple mint variants' : 'Single mint'}
        />
        <DetailFieldRow label="Mint marks available" value={mintMarksAvailable} />
      </DetailFieldGrid>

      {variantsEnabled ? (
        variantRows.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {variantRows.map((row, index) => (
              <MintVariantCard key={`${row.mint_mark_code ?? 'v'}-${index}`} row={row} index={index} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm italic text-navy-muted">{REVIEW_EMPTY_VALUE}</p>
        )
      ) : (
        <div className="mt-4 rounded-lg border border-border/50 bg-[#faf8f5] px-3 py-3">
          <DetailFieldGrid>
            <DetailFieldRow
              label="Mint mark"
              value={formatMintMarkDisplay(singleMintMark) || singleMintMark}
            />
            <DetailFieldRow
              label="Mint city / location"
              value={getMintMarkLabel(singleMintMark) ?? ''}
            />
          </DetailFieldGrid>
        </div>
      )}
    </>
  )
}

export function SubmissionMintInfo({ acf, bare = false, className = '' }: SubmissionMintInfoProps) {
  const content = <MintInfoContent acf={acf} />

  if (bare) {
    return content
  }

  return (
    <DetailSectionCard
      title="Mint information"
      subtitle="Single mint or multi-mint variant data"
      className={className}
    >
      {content}
    </DetailSectionCard>
  )
}
