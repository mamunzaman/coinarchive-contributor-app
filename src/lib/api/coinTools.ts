import { parseApiError, readJsonResponse } from '../apiErrors'
import {
  COIN_LINK_IMPORT_MAX_URLS,
  enrichImportResultWithCatalogueText,
  normalizeCoinLinkImportResult,
  type CoinLinkImportResult,
} from '../coinImport'
import { ApiError, coinArchiveFetch, getApiBaseUrl } from './core'

/** Optional fields appended to submit/update FormData; backend may ignore unsupported keys. */
export type SubmitCoinFormFields = {
  content_language?: 'de' | 'en'
}

export type SubmitCoinResponse = {
  success: boolean
  message?: string
  post_id: number
  status: string
  submitted_by?: {
    auth_type: string
    contributor_id?: number | null
    email?: string | null
  }
}

export type DuplicateCheckPayload = {
  title?: string
  post_title?: string
  unique_code?: string
  coin_code?: string
  country: string
  year: string
  denomination: string
  coin_type: string
  commemorative_subject?: string
  coin_theme?: string
  coin_name?: string
  series?: string
  exclude_submission_id?: number
}

export type DuplicateCheckApiMatch = {
  id: number
  title: string
  coin_code?: string
  unique_code?: string
  status?: string
  country?: string
  year?: number | string
  view_url?: string
  edit_link?: string
  match_type?: 'exact_unique_code' | 'exact_coin_code' | 'exact_title' | 'similar'
}

export type DuplicateCheckResponse = {
  hasDuplicates: boolean
  exactUniqueCode?: boolean
  exactCoinCode?: boolean
  exactTitle?: boolean
  exactDuplicate?: boolean
  exact_unique_code?: boolean
  exact_coin_code?: boolean
  exact_title?: boolean
  exact_duplicate?: boolean
  similarMatches?: DuplicateCheckApiMatch[]
  matches: DuplicateCheckApiMatch[]
}

export type AiDescriptionField =
  | 'obverse_description'
  | 'reverse_description'
  | 'historical_background'
  | 'collector_notes'
  | 'seo_description'

export type GenerateAiDescriptionsPayload = {
  content_language?: 'de' | 'en'
  language_instruction?: string
  prompt?: string
  country: string
  year: string
  denomination: string
  coin_type: string
  theme?: string
  subject?: string
  release_date?: string
  mint_data?: string
  fields_requested: AiDescriptionField[]
}

export type GenerateAiDescriptionsResponse = {
  success: boolean
  descriptions: Partial<Record<AiDescriptionField, string>>
}

export async function checkCoinDuplicates(
  payload: DuplicateCheckPayload,
  token: string,
): Promise<DuplicateCheckResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/duplicates/check`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to verify duplicates right now.')
    throw new ApiError(message, response.status, code)
  }

  return data as DuplicateCheckResponse
}

function getAiDescriptionErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 401:
      return 'AI generation requires an authenticated session.'
    case 400:
      return 'Required coin fields are missing.'
    case 429:
      return 'AI generation limit reached. Try again later.'
    case 501:
      return 'AI provider is not configured yet.'
    case 502:
      return 'AI provider returned an invalid response.'
    default:
      return fallback
  }
}

export type CoinLinkImportPayload = {
  url?: string
  source_urls?: string[]
  catalogue_text?: string
}

export function buildCoinLinkImportPayload(
  sourceUrls: string[],
  catalogueText?: string,
): CoinLinkImportPayload {
  const urls = sourceUrls
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, COIN_LINK_IMPORT_MAX_URLS)

  const trimmedCatalogueText = catalogueText?.trim()
  const catalogueField = trimmedCatalogueText ? { catalogue_text: trimmedCatalogueText } : {}

  if (urls.length === 0) {
    return catalogueField
  }

  if (urls.length === 1) {
    return { url: urls[0], ...catalogueField }
  }

  return {
    url: urls[0],
    source_urls: urls,
    ...catalogueField,
  }
}

function getCoinLinkImportErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 401:
      return 'Coin link import requires an authenticated session.'
    case 404:
    case 501:
      return 'Coin link import is not available yet.'
    case 400:
      return 'The coin page URL is invalid or unsupported.'
    case 502:
      return 'Coin link import returned an invalid response.'
    default:
      return fallback
  }
}

export async function importCoinFromUrls(
  sourceUrls: string[],
  token: string,
  catalogueText?: string,
): Promise<CoinLinkImportResult> {
  if (!token) {
    throw new ApiError(getCoinLinkImportErrorMessage(401, ''), 401)
  }

  const trimmedCatalogueText = catalogueText?.trim()
  const payload = buildCoinLinkImportPayload(sourceUrls, trimmedCatalogueText)
  const fallbackUrl = payload.url ?? sourceUrls[0]?.trim() ?? ''

  if (!fallbackUrl && !trimmedCatalogueText) {
    throw new ApiError('The coin page URL is invalid or unsupported.', 400)
  }

  const response = await coinArchiveFetch(`${getApiBaseUrl()}/coin-link-import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Could not import coin data from this URL.')
    throw new ApiError(
      getCoinLinkImportErrorMessage(response.status, message),
      response.status,
      code ?? (response.status === 404 || response.status === 501 ? 'rest_coin_import_unavailable' : undefined),
    )
  }

  const result = normalizeCoinLinkImportResult(data, fallbackUrl || sourceUrls[0]?.trim() || '')
  return trimmedCatalogueText
    ? enrichImportResultWithCatalogueText(result, trimmedCatalogueText)
    : result
}

export async function importCoinFromUrl(
  url: string,
  token: string,
): Promise<CoinLinkImportResult> {
  return importCoinFromUrls([url], token)
}

export async function generateAiDescriptions(
  payload: GenerateAiDescriptionsPayload,
  token: string,
): Promise<GenerateAiDescriptionsResponse> {
  if (!token) {
    throw new ApiError(getAiDescriptionErrorMessage(401, ''), 401)
  }

  const response = await coinArchiveFetch(`${getApiBaseUrl()}/ai/descriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Could not generate descriptions.')
    throw new ApiError(getAiDescriptionErrorMessage(response.status, message), response.status, code)
  }

  return data as GenerateAiDescriptionsResponse
}

export async function submitCoin(
  formData: FormData,
  token: string,
): Promise<SubmitCoinResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/submit-coin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Coin submission failed. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  return data as SubmitCoinResponse
}
