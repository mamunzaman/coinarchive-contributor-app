import type {
  CoinImportReviewFieldRow,
  CoinImportReviewModel,
  CoinLinkImportResult,
} from './coinImport'

const IDENTITY_KEYS = new Set(['country', 'year', 'denomination', 'coin_theme', 'coin_designer'])
const RELEASE_KEYS = new Set([
  'released_date',
  'coin_mintage',
  'coin_material',
  'coin_weight_g',
  'coin_diameter_mm',
  'coin_edge_inscription',
])
const DESCRIPTION_KEYS = new Set([
  'short_description',
  'coin_obverse_description',
  'coin_reverse_description',
])

function previewDisplayValue(row: CoinImportReviewFieldRow): string {
  if (row.isTaxonomy && row.matchedValue?.trim()) {
    return row.matchedValue
  }
  return row.aiValue?.trim() ?? ''
}

function hasVisiblePreviewRows(rows: CoinImportReviewFieldRow[]): boolean {
  return rows.some((row) => previewDisplayValue(row).length > 0)
}

export function hasImportPreviewData(
  reviewModel: CoinImportReviewModel,
  result: CoinLinkImportResult,
): boolean {
  const basicSection = reviewModel.sections.find((section) => section.id === 'basic')
  const releaseSection = reviewModel.sections.find((section) => section.id === 'release_specs')
  const descriptionSection = reviewModel.sections.find((section) => section.id === 'descriptions')

  const identityRows = basicSection?.fields.filter((row) => IDENTITY_KEYS.has(row.key)) ?? []
  const releaseRows = releaseSection?.fields.filter((row) => RELEASE_KEYS.has(row.key)) ?? []
  const descriptionRows = [
    ...(basicSection?.fields.filter((row) => row.key === 'short_description') ?? []),
    ...(descriptionSection?.fields.filter((row) => DESCRIPTION_KEYS.has(row.key)) ?? []),
  ]

  return (
    hasVisiblePreviewRows(identityRows) ||
    hasVisiblePreviewRows(releaseRows) ||
    hasVisiblePreviewRows(descriptionRows) ||
    Boolean(result.sourceUrl) ||
    (result.sources?.length ?? 0) > 0
  )
}
