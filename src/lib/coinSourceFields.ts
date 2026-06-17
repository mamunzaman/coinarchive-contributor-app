/** Canonical React form + primary ACF key */
export const COIN_SOURCE_NAME_FIELD = 'coin_source_name' as const

export const COIN_SOURCE_URL_FIELD = 'coin_source_url' as const

/**
 * WordPress ACF legacy slug (typo preserved). Backend expects this key on save/load.
 */
export const LEGACY_COIN_SOURCE_NAME_ACF_KEY =
  'official_scoin_source_nameource_name_coin_source_name' as const

export type CoinSourceAcfRecord = {
  coin_source_name?: string
  coin_source_url?: string
  official_source_name?: string
  official_source_url?: string
  [LEGACY_COIN_SOURCE_NAME_ACF_KEY]?: string
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

export function appendCoinSourceSubmitFields(formData: FormData, name: string, url: string): void {
  const trimmedName = name.trim()
  const trimmedUrl = url.trim()

  if (trimmedName) {
    formData.append(COIN_SOURCE_NAME_FIELD, trimmedName)
    formData.append(LEGACY_COIN_SOURCE_NAME_ACF_KEY, trimmedName)
  }

  if (trimmedUrl) {
    formData.append(COIN_SOURCE_URL_FIELD, trimmedUrl)
  }
}

export function appendCoinSourceAcfFields(formData: FormData, name: string, url: string): void {
  const trimmedName = name.trim()
  const trimmedUrl = url.trim()

  if (trimmedName) {
    formData.append(`acf[${COIN_SOURCE_NAME_FIELD}]`, trimmedName)
    formData.append(`acf[${LEGACY_COIN_SOURCE_NAME_ACF_KEY}]`, trimmedName)
  }

  if (trimmedUrl) {
    formData.append(`acf[${COIN_SOURCE_URL_FIELD}]`, trimmedUrl)
  }
}
