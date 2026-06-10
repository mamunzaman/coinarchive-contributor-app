import {
  formatMintMarkDisplay,
  getMintMarkLabel,
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

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined
}

function variantHasContent(row: MintVariantAcf): boolean {
  return [row.mint_mark_code, row.mint_mintage, row.mint_notes].some(hasText)
}

type SubmissionMintInfoProps = {
  acf?: CoinAcfDetail
  bare?: boolean
  className?: string
  editHref?: string
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
  const variantRows = (acf ? getVariants(acf) : []).filter(variantHasContent)

  return (
    <>
      <DetailFieldGrid>
        <DetailFieldRow label="Mint marks available" value={mintMarksAvailable} />
      </DetailFieldGrid>

      {variantsEnabled && variantRows.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {variantRows.map((row, index) => (
            <MintVariantCard key={`${row.mint_mark_code ?? 'v'}-${index}`} row={row} index={index} />
          ))}
        </div>
      ) : null}

      {!variantsEnabled && singleMintMark.trim() ? (
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
      ) : null}
    </>
  )
}

export function SubmissionMintInfo({
  acf,
  bare = false,
  className = '',
  editHref,
}: SubmissionMintInfoProps) {
  const variantsEnabled = acf ? hasMintVariants(acf) : false
  const singleMintMark = acf?.single_mint_mark ?? acf?.coin_single_mint_mark ?? ''
  const mintMarksAvailable = acf?.mint_marks_available ?? acf?.coin_mint_marks_available ?? ''
  const variantRows = (acf ? getVariants(acf) : []).filter(variantHasContent)
  const hasContent = Boolean(
    mintMarksAvailable.trim() ||
      singleMintMark.trim() ||
      (variantsEnabled && variantRows.length > 0),
  )

  if (!hasContent) {
    return null
  }

  const content = <MintInfoContent acf={acf} />

  if (bare) {
    return content
  }

  return (
    <DetailSectionCard
      title="Mint information"
      subtitle="Single mint or multi-mint variant data"
      className={className}
      editHref={editHref}
    >
      {content}
    </DetailSectionCard>
  )
}
