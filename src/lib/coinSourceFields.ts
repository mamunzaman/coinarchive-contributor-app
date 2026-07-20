import { resolveOfficialSourceNameFromUrl } from './coinImportFieldUtils'

/** Canonical React form field for primary source name */
export const COIN_SOURCE_NAME_FIELD = 'coin_source_name' as const

/** Primary source URL ACF / form key */
export const COIN_SOURCE_URL_FIELD = 'coin_source_url' as const

/**
 * WordPress ACF primary source-name slug (typo preserved).
 * Populated from primary import URL domain/name.
 */
export const LEGACY_COIN_SOURCE_NAME_ACF_KEY =
  'official_scoin_source_nameource_name_coin_source_name' as const

/** Supplemental source name ACF key */
export const SECOND_SOURCE_NAME_ACF_KEY =
  'official_scoin_source_2nd_official_source_2nd_name' as const

/** Supplemental source URL ACF key */
export const SECOND_SOURCE_URL_ACF_KEY = 'official_source_2nd_url' as const

/** React form field for supplemental source name */
export const SECOND_SOURCE_NAME_FIELD = 'official_source_2nd_name' as const

/** React form field for supplemental source URL */
export const SECOND_SOURCE_URL_FIELD = 'official_source_2nd_url' as const

export type CoinSourceAttributionValues = {
  coin_source_name: string
  coin_source_url: string
  official_source_2nd_name: string
  official_source_2nd_url: string
}

export type CoinSourceAcfRecord = {
  coin_source_name?: string
  coin_source_url?: string
  official_source_name?: string
  official_source_url?: string
  [LEGACY_COIN_SOURCE_NAME_ACF_KEY]?: string
  [SECOND_SOURCE_NAME_ACF_KEY]?: string
  [SECOND_SOURCE_URL_ACF_KEY]?: string
  official_source_2nd_name?: string
  official_source_2nd_url?: string
}

export function readCoinSourceNameFromAcf(acf?: CoinSourceAcfRecord | null): string {
  if (!acf) {
    return ''
  }

  return (
    acf.coin_source_name?.trim() ||
    acf[LEGACY_COIN_SOURCE_NAME_ACF_KEY]?.trim() ||
    acf.official_source_name?.trim() ||
    ''
  )
}

export function readCoinSourceUrlFromAcf(acf?: CoinSourceAcfRecord | null): string {
  if (!acf) {
    return ''
  }

  return acf.coin_source_url?.trim() || acf.official_source_url?.trim() || ''
}

export function readSecondSourceNameFromAcf(acf?: CoinSourceAcfRecord | null): string {
  if (!acf) {
    return ''
  }

  return (
    acf[SECOND_SOURCE_NAME_ACF_KEY]?.trim() ||
    acf.official_source_2nd_name?.trim() ||
    ''
  )
}

export function readSecondSourceUrlFromAcf(acf?: CoinSourceAcfRecord | null): string {
  if (!acf) {
    return ''
  }

  return acf[SECOND_SOURCE_URL_ACF_KEY]?.trim() || acf.official_source_2nd_url?.trim() || ''
}

export function resolveSourceAttributionFromImportUrls(
  sourceUrls: string[],
): CoinSourceAttributionValues {
  const primaryUrl = sourceUrls[0]?.trim() || ''
  const supplementalUrl = sourceUrls[1]?.trim() || ''

  return {
    coin_source_name: primaryUrl ? resolveOfficialSourceNameFromUrl(primaryUrl) : '',
    coin_source_url: primaryUrl,
    official_source_2nd_name: supplementalUrl
      ? resolveOfficialSourceNameFromUrl(supplementalUrl)
      : '',
    official_source_2nd_url: supplementalUrl,
  }
}

export function appendCoinSourceSubmitFields(
  formData: FormData,
  attribution: CoinSourceAttributionValues,
): void {
  const primaryName = attribution.coin_source_name.trim()
  const primaryUrl = attribution.coin_source_url.trim()
  const secondName = attribution.official_source_2nd_name.trim()
  const secondUrl = attribution.official_source_2nd_url.trim()

  if (primaryName) {
    formData.append(COIN_SOURCE_NAME_FIELD, primaryName)
    formData.append(LEGACY_COIN_SOURCE_NAME_ACF_KEY, primaryName)
  }

  if (primaryUrl) {
    formData.append(COIN_SOURCE_URL_FIELD, primaryUrl)
  }

  if (secondName) {
    formData.append(SECOND_SOURCE_NAME_ACF_KEY, secondName)
  }

  if (secondUrl) {
    formData.append(SECOND_SOURCE_URL_ACF_KEY, secondUrl)
  }
}

export function appendCoinSourceAcfFields(
  formData: FormData,
  attribution: CoinSourceAttributionValues,
): void {
  const primaryName = attribution.coin_source_name.trim()
  const primaryUrl = attribution.coin_source_url.trim()
  const secondName = attribution.official_source_2nd_name.trim()
  const secondUrl = attribution.official_source_2nd_url.trim()

  if (primaryName) {
    formData.append(`acf[${COIN_SOURCE_NAME_FIELD}]`, primaryName)
    formData.append(`acf[${LEGACY_COIN_SOURCE_NAME_ACF_KEY}]`, primaryName)
  }

  if (primaryUrl) {
    formData.append(`acf[${COIN_SOURCE_URL_FIELD}]`, primaryUrl)
  }

  if (secondName) {
    formData.append(`acf[${SECOND_SOURCE_NAME_ACF_KEY}]`, secondName)
  }

  if (secondUrl) {
    formData.append(`acf[${SECOND_SOURCE_URL_ACF_KEY}]`, secondUrl)
  }
}

export function buildCoinSourceAcfPayload(
  attribution: CoinSourceAttributionValues,
): Record<string, string> {
  const primaryName = attribution.coin_source_name.trim()
  const primaryUrl = attribution.coin_source_url.trim()
  const secondName = attribution.official_source_2nd_name.trim()
  const secondUrl = attribution.official_source_2nd_url.trim()

  return {
    ...(primaryName
      ? {
          [COIN_SOURCE_NAME_FIELD]: primaryName,
          [LEGACY_COIN_SOURCE_NAME_ACF_KEY]: primaryName,
        }
      : {}),
    ...(primaryUrl ? { [COIN_SOURCE_URL_FIELD]: primaryUrl } : {}),
    ...(secondName ? { [SECOND_SOURCE_NAME_ACF_KEY]: secondName } : {}),
    ...(secondUrl ? { [SECOND_SOURCE_URL_ACF_KEY]: secondUrl } : {}),
  }
}
