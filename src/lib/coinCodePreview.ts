import {
  coinCodeMatchesCountryCode,
  resolveCountryCodeForFormValue,
  resolveCountryCodeWithDebug,
} from './countryCodeResolver'
import type { TaxonomyOption } from '../types/formOptions'
import type { CoinFormValues } from '../types/coinForm'

export type CoinCodeDrivingFields = Pick<
  CoinFormValues,
  'country' | 'year' | 'denomination' | 'coin_type' | 'released_date'
>

export type ResolvedCoinCodeFields = {
  coin_code: string
  unique_code: string
  coin_country_code: string
  coin_code_driver_snapshot: string
}

const RELEASE_DATE_PLACEHOLDER = '[RELEASE_DATE]'
const DEFAULT_SUFFIX_PREVIEW = '001'

export type CoinCodePreviewResult = {
  coinCode: string
  releaseDateMissing: boolean
  baseComplete: boolean
}

function normalizeCoinCodePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function isValidDateParts(year: string, month: string, day: string): boolean {
  const y = Number.parseInt(year, 10)
  const m = Number.parseInt(month, 10)
  const d = Number.parseInt(day, 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return false
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false
  }
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export function normalizeReleaseDate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (/^\d{8}$/.test(trimmed)) {
    const year = trimmed.slice(0, 4)
    const month = trimmed.slice(4, 6)
    const day = trimmed.slice(6, 8)
    return isValidDateParts(year, month, day) ? trimmed : ''
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch && isValidDateParts(isoMatch[1], isoMatch[2], isoMatch[3])) {
    return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`
  }

  const euMatch = trimmed.match(/^(\d{2})[./](\d{2})[./](\d{4})$/)
  if (euMatch && isValidDateParts(euMatch[3], euMatch[2], euMatch[1])) {
    return `${euMatch[3]}${euMatch[2]}${euMatch[1]}`
  }

  return ''
}

function normalizeSuffixPreview(suffix?: string): string {
  const normalized = normalizeCoinCodePart(suffix ?? DEFAULT_SUFFIX_PREVIEW)
  return normalized || DEFAULT_SUFFIX_PREVIEW
}

export function buildCoinCodeDriverFingerprint(values: CoinCodeDrivingFields): string {
  return JSON.stringify({
    country: values.country.trim(),
    year: values.year.trim(),
    denomination: values.denomination.trim(),
    coin_type: values.coin_type.trim(),
    released_date: values.released_date.trim(),
  })
}

export function haveCoinCodeDriversChanged(values: CoinFormValues): boolean {
  return buildCoinCodeDriverFingerprint(values) !== values.coin_code_driver_snapshot
}

function shouldPreserveExistingCoinCode(
  values: CoinFormValues,
  coin_country_code: string,
  coin_code_driver_snapshot: string,
): boolean {
  const existing = values.coin_code.trim()
  if (!existing) {
    return false
  }
  if (coin_code_driver_snapshot !== values.coin_code_driver_snapshot) {
    return false
  }
  if (coin_country_code && !coinCodeMatchesCountryCode(existing, coin_country_code)) {
    return false
  }
  return true
}

export function resolveCountryCodeForSubmit(
  country: string,
  countries: TaxonomyOption[] = [],
): string {
  return resolveCountryCodeForFormValue(country, countries)
}

export function resolveCoinCodeFields(
  values: CoinFormValues,
  countries: TaxonomyOption[] = [],
): ResolvedCoinCodeFields {
  const countryDebug = resolveCountryCodeWithDebug(values.country, countries)
  const coin_country_code = countryDebug.resolvedCountryCode
  const coin_code_driver_snapshot = buildCoinCodeDriverFingerprint(values)
  const existingSuffix =
    values.coin_code.trim() && coinCodeMatchesCountryCode(values.coin_code, coin_country_code)
      ? values.coin_code.split('-').pop()
      : undefined
  const preview = generateCoinCodePreview(
    values.country,
    values.year,
    values.denomination,
    values.coin_type,
    countries,
    values.released_date,
    existingSuffix,
  )

  const driversUnchanged = coin_code_driver_snapshot === values.coin_code_driver_snapshot

  if (
    values.coin_code_manual &&
    values.coin_code.trim() &&
    driversUnchanged &&
    (!coin_country_code || coinCodeMatchesCountryCode(values.coin_code, coin_country_code))
  ) {
    return {
      coin_code: values.coin_code.trim(),
      unique_code: values.unique_code?.trim() || values.coin_code.trim(),
      coin_country_code,
      coin_code_driver_snapshot: values.coin_code_driver_snapshot,
    }
  }

  const preserveExisting = shouldPreserveExistingCoinCode(
    values,
    coin_country_code,
    coin_code_driver_snapshot,
  )

  if (import.meta.env.DEV) {
    console.info('[coin-form] coin code resolution', {
      selectedCountryRaw: countryDebug.rawCountryValue,
      matchedCountryOption: countryDebug.matchedOption,
      resolvedCountryCode: countryDebug.resolvedCountryCode,
      generatedCoinCode: preview.coinCode,
      existingCoinCode: values.coin_code,
      preserveExisting,
    })
  }

  if (preserveExisting) {
    return {
      coin_code: values.coin_code.trim(),
      unique_code: values.unique_code?.trim() || values.coin_code.trim(),
      coin_country_code,
      coin_code_driver_snapshot,
    }
  }

  return {
    coin_code: preview.coinCode,
    unique_code: preview.coinCode,
    coin_country_code,
    coin_code_driver_snapshot,
  }
}

export function syncCoinCodeFormFields(
  values: CoinFormValues,
  countries: TaxonomyOption[] = [],
): Partial<CoinFormValues> | null {
  const resolved = resolveCoinCodeFields(values, countries)
  const updates: Partial<CoinFormValues> = {}

  if (resolved.coin_code !== values.coin_code) {
    updates.coin_code = resolved.coin_code
  }
  if (resolved.unique_code !== values.unique_code) {
    updates.unique_code = resolved.unique_code
  }
  if (resolved.coin_country_code !== values.coin_country_code) {
    updates.coin_country_code = resolved.coin_country_code
  }
  if (resolved.coin_code_driver_snapshot !== values.coin_code_driver_snapshot) {
    updates.coin_code_driver_snapshot = resolved.coin_code_driver_snapshot
  }

  return Object.keys(updates).length > 0 ? updates : null
}

export function resolveCoinCodeForSubmit(
  values: CoinFormValues,
  countries: TaxonomyOption[] = [],
): string {
  return resolveCoinCodeFields(values, countries).coin_code
}

export function generateCoinCodePreview(
  country: string,
  year: string,
  denomination: string,
  coinType: string,
  countries: TaxonomyOption[] = [],
  releaseDate = '',
  suffix?: string,
): CoinCodePreviewResult {
  const countryCode = resolveCountryCodeForFormValue(country, countries)
  const yearPart = Number.parseInt(year, 10)
  const valuePart = normalizeCoinCodePart(denomination)
  const typePart = normalizeCoinCodePart(coinType)
  const baseComplete = Boolean(countryCode && yearPart > 0 && valuePart && typePart)

  if (!baseComplete) {
    return {
      coinCode: '',
      releaseDateMissing: !normalizeReleaseDate(releaseDate),
      baseComplete: false,
    }
  }

  const base = `${countryCode}-${yearPart}-${valuePart}-${typePart}`
  const normalizedReleaseDate = normalizeReleaseDate(releaseDate)
  const releaseDateMissing = !normalizedReleaseDate
  const releasePart = normalizedReleaseDate || RELEASE_DATE_PLACEHOLDER
  const suffixPart = normalizeSuffixPreview(suffix)

  const coinCode = `${base}-${releasePart}-${suffixPart}`

  return {
    coinCode,
    releaseDateMissing,
    baseComplete: true,
  }
}
