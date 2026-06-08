import type { CoinFormValues } from '../types/coinForm'

export type CompletenessResult = {
  score: number
  requiredFilled: number
  requiredTotal: number
  recommendedFilled: number
  recommendedTotal: number
  missingRecommended: string[]
}

type CompletenessContext = {
  values: CoinFormValues
  hasObverse: boolean
  hasReverse: boolean
  hasGallery: boolean
}

function hasMintInfo(values: CoinFormValues): boolean {
  if (values.hasMintVariants) {
    return values.mintVariants.some(
      (row) =>
        row.mintMarkCode.trim() ||
        row.mintMintage.trim() ||
        row.mintNotes.trim(),
    )
  }

  return Boolean(values.singleMintMark.trim())
}

function hasReferences(values: CoinFormValues): boolean {
  return Boolean(
    values.coin_historical_background.trim() ||
      values.coin_collector_notes.trim() ||
      values.coin_obverse_description.trim() ||
      values.coin_reverse_description.trim(),
  )
}

export function computeCompletenessScore(context: CompletenessContext): CompletenessResult {
  const { values, hasObverse, hasReverse, hasGallery } = context

  const requiredChecks = [
    Boolean(values.title.trim()),
    Boolean(values.country.trim()),
    Boolean(values.year.trim()),
    Boolean(values.denomination.trim()),
    Boolean(values.coin_type.trim()),
    Boolean(values.short_description.trim()),
    hasObverse,
    hasReverse,
  ]

  const recommendedItems: Array<{ label: string; filled: boolean }> = [
    { label: 'Mint information', filled: hasMintInfo(values) },
    { label: 'Gallery images', filled: hasGallery },
    { label: 'Material', filled: Boolean(values.coin_material.trim()) },
    { label: 'Weight', filled: Boolean(values.coin_weight_g.trim()) },
    { label: 'Edge inscription', filled: Boolean(values.coin_edge_inscription.trim()) },
    { label: 'Designer / theme', filled: Boolean(values.coin_theme.trim()) },
    { label: 'References / notes', filled: hasReferences(values) },
  ]

  const requiredFilled = requiredChecks.filter(Boolean).length
  const recommendedFilled = recommendedItems.filter((item) => item.filled).length
  const requiredTotal = requiredChecks.length
  const recommendedTotal = recommendedItems.length

  const requiredScore = (requiredFilled / requiredTotal) * 70
  const recommendedScore = (recommendedFilled / recommendedTotal) * 30
  const score = Math.round(requiredScore + recommendedScore)

  return {
    score,
    requiredFilled,
    requiredTotal,
    recommendedFilled,
    recommendedTotal,
    missingRecommended: recommendedItems.filter((item) => !item.filled).map((item) => item.label),
  }
}
