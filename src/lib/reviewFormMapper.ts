import type { CoinFormValues, MintVariantRow } from '../types/coinForm'
import { isMintVariantRowFilled, normalizeMintMarkCode } from '../types/coinForm'
import {
  COIN_SOURCE_NAME_FIELD,
  COIN_SOURCE_URL_FIELD,
  LEGACY_COIN_SOURCE_NAME_ACF_KEY,
} from './coinSourceFields'

export function firstNonEmptyTrimmed(...values: Array<string | number | null | undefined>): string {
  for (const value of values) {
    const trimmed = String(value ?? '').trim()
    if (trimmed) {
      return trimmed
    }
  }
  return ''
}

export type ReviewFormSnapshot = {
  country: string
  coinCountryCode: string
  coinCode: string
  year: string
  denomination: string
  coinType: string
  coinSeries: string
  coinDesigner: string
  coinTheme: string
  releasedDate: string
  shortDescription: string
  coinMintage: string
  coinMaterial: string
  coinQuality: string
  coinWeightG: string
  coinDiameterMm: string
  coinThicknessMm: string
  coinEdgeInscription: string
  coinObverseDescription: string
  coinReverseDescription: string
  coinHistoricalBackground: string
  coinCollectorNotes: string
  coinIssueStatus: string
  coinSourceName: string
  coinSourceUrl: string
  hasMintVariants: boolean
  singleMintMark: string
  mintMarksAvailable: string
  mintVariants: MintVariantRow[]
}

export function getReviewMintVariantRows(values: CoinFormValues): MintVariantRow[] {
  if (!values.hasMintVariants) {
    return []
  }

  return values.mintVariants.filter(isMintVariantRowFilled)
}

export function mapCoinFormValuesForReview(values: CoinFormValues): ReviewFormSnapshot {
  return {
    country: values.country.trim(),
    coinCountryCode: values.coin_country_code.trim(),
    coinCode: values.coin_code.trim(),
    year: values.year.trim(),
    denomination: values.denomination.trim(),
    coinType: values.coin_type.trim(),
    coinSeries: values.coin_series.trim(),
    coinDesigner: values.coin_designer.trim(),
    coinTheme: values.coin_theme.trim(),
    releasedDate: values.released_date.trim(),
    shortDescription: values.short_description.trim(),
    coinMintage: values.coin_mintage.trim(),
    coinMaterial: values.coin_material.trim(),
    coinQuality: values.coin_quality.trim(),
    coinWeightG: values.coin_weight_g.trim(),
    coinDiameterMm: values.coin_diameter_mm.trim(),
    coinThicknessMm: values.coin_thickness_mm.trim(),
    coinEdgeInscription: values.coin_edge_inscription.trim(),
    coinObverseDescription: values.coin_obverse_description.trim(),
    coinReverseDescription: values.coin_reverse_description.trim(),
    coinHistoricalBackground: values.coin_historical_background.trim(),
    coinCollectorNotes: values.coin_collector_notes.trim(),
    coinIssueStatus: values.coin_issue_status.trim(),
    coinSourceName: values.coin_source_name.trim(),
    coinSourceUrl: values.coin_source_url.trim(),
    hasMintVariants: values.hasMintVariants,
    singleMintMark: values.singleMintMark.trim(),
    mintMarksAvailable: values.mintMarksAvailable.trim(),
    mintVariants: getReviewMintVariantRows(values),
  }
}

export type CoinAcfPayload = Record<string, string>

export function buildMintVariantsPayload(values: CoinFormValues): Array<{
  mint_mark_code: string
  mint_mintage: string
  mint_notes: string
}> {
  return getReviewMintVariantRows(values).map((row) => ({
    mint_mark_code: normalizeMintMarkCode(row.mintMarkCode),
    mint_mintage: row.mintMintage.trim(),
    mint_notes: row.mintNotes.trim(),
  }))
}

export function buildCoinAcfPayload(values: CoinFormValues): CoinAcfPayload {
  const payload: CoinAcfPayload = {
    coin_code: values.coin_code.trim(),
    unique_code: (values.unique_code.trim() || values.coin_code.trim()),
    coin_country_code: values.coin_country_code.trim(),
    coin_year: values.year.trim(),
    coin_short_description: values.short_description.trim(),
    released_date: values.released_date.trim(),
    coin_mintage: values.coin_mintage.trim(),
    coin_material: values.coin_material.trim(),
    coin_quality: values.coin_quality.trim(),
    coin_weight_g: values.coin_weight_g.trim(),
    coin_diameter_mm: values.coin_diameter_mm.trim(),
    coin_thickness_mm: values.coin_thickness_mm.trim(),
    coin_edge_inscription: values.coin_edge_inscription.trim(),
    coin_designer: values.coin_designer.trim(),
    coin_theme: values.coin_theme.trim(),
    coin_obverse_description: values.coin_obverse_description.trim(),
    coin_reverse_description: values.coin_reverse_description.trim(),
    coin_historical_background: values.coin_historical_background.trim(),
    coin_collector_notes: values.coin_collector_notes.trim(),
    coin_issue_status: values.coin_issue_status.trim(),
    [COIN_SOURCE_NAME_FIELD]: values.coin_source_name.trim(),
    [COIN_SOURCE_URL_FIELD]: values.coin_source_url.trim(),
    [LEGACY_COIN_SOURCE_NAME_ACF_KEY]: values.coin_source_name.trim(),
    has_mint_variants: values.hasMintVariants ? '1' : '0',
    coin_has_mint_variants: values.hasMintVariants ? '1' : '0',
    single_mint_mark: values.singleMintMark.trim(),
    coin_single_mint_mark: values.singleMintMark.trim(),
    coin_mint_mark: values.singleMintMark.trim(),
    mint_marks_available: values.mintMarksAvailable.trim(),
    coin_mint_marks_available: values.mintMarksAvailable.trim(),
  }

  const mintVariants = buildMintVariantsPayload(values)
  if (mintVariants.length > 0) {
    const json = JSON.stringify(mintVariants)
    payload.mint_variants = json
    payload.coin_mint_variants = json
  }

  return payload
}

export type ReviewSubmitPayloadDebug = {
  coin_code: string
  coin_country_code: string
  released_date: string
  coin_mintage: string
  coin_mint_variants_count: number
  acf_keys: string[]
}

export function buildReviewSubmitPayloadDebug(values: CoinFormValues): ReviewSubmitPayloadDebug {
  const acf = buildCoinAcfPayload(values)
  const mintVariants = buildMintVariantsPayload(values)

  return {
    coin_code: values.coin_code.trim(),
    coin_country_code: values.coin_country_code.trim(),
    released_date: values.released_date.trim(),
    coin_mintage: values.coin_mintage.trim(),
    coin_mint_variants_count: mintVariants.length,
    acf_keys: Object.keys(acf).filter((key) => Boolean(acf[key]?.trim())),
  }
}
