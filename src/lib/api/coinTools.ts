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
      return fallback || 'The coin page URL is invalid or unsupported.'
    case 502:
      return fallback || 'Coin link import could not fetch or parse one of the source pages.'
    case 503:
      return 'Coin link import is temporarily unavailable. Try again shortly.'
    default:
      return fallback
  }
}

function isProbablyHtmlDocument(raw: string): boolean {
  const sample = raw.slice(0, 240).toLowerCase()
  return sample.includes('<!doctype html') || sample.includes('<html') || sample.includes('<body')
}

function summarizeCoinLinkImportRawBody(raw: string): string {
  const compact = raw.replace(/\s+/g, ' ').trim()
  if (!compact) {
    return '(empty body)'
  }

  if (isProbablyHtmlDocument(compact)) {
    const titleMatch = compact.match(/<title[^>]*>(.*?)<\/title>/i)
    const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim()
    return title ? `HTML document titled "${title.slice(0, 80)}"` : 'HTML document (non-JSON)'
  }

  return compact.length > 280 ? `${compact.slice(0, 280)}…` : compact
}

function buildCoinLinkImportDevDetail(parts: {
  status: number
  contentType: string
  code?: string
  message?: string
  rawPreview?: string
  reason?: string
}): string {
  return [
    `HTTP ${parts.status}`,
    parts.contentType ? `CT ${parts.contentType}` : '',
    parts.code ? `code ${parts.code}` : '',
    parts.reason ?? '',
    parts.message ? `msg ${parts.message}` : '',
    parts.rawPreview ? `body ${parts.rawPreview}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

async function readCoinLinkImportResponse(response: Response): Promise<{
  data: unknown
  rawText: string
  contentType: string
  jsonParseFailed: boolean
}> {
  const contentType = response.headers.get('content-type') ?? ''
  const rawText = await response.text()

  if (!rawText.trim()) {
    return { data: null, rawText, contentType, jsonParseFailed: false }
  }

  try {
    return {
      data: JSON.parse(rawText) as unknown,
      rawText,
      contentType,
      jsonParseFailed: false,
    }
  } catch {
    return { data: null, rawText, contentType, jsonParseFailed: true }
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

  const { data, rawText, contentType, jsonParseFailed } = await readCoinLinkImportResponse(response)
  const isDev = import.meta.env.DEV

  if (jsonParseFailed) {
    const preview = summarizeCoinLinkImportRawBody(rawText)
    const message = isDev
      ? buildCoinLinkImportDevDetail({
          status: response.status,
          contentType: contentType || 'unknown',
          reason: 'non-JSON response',
          rawPreview: preview,
        })
      : response.status === 502
        ? 'Coin link import could not fetch or parse one of the source pages.'
        : 'Coin link import returned a non-JSON response.'

    throw new ApiError(message, response.status || 502, 'rest_coin_import_invalid_response')
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Could not import coin data from this URL.')
    const lower = message.toLowerCase()
    const blocked =
      lower.includes('blocked') ||
      lower.includes('forbidden') ||
      lower.includes('cloudflare') ||
      lower.includes('captcha') ||
      response.status === 403

    const productionMessage = getCoinLinkImportErrorMessage(
      response.status,
      blocked
        ? 'One of the source sites blocked the import request.'
        : message || 'Could not import coin data from this URL.',
    )
    const detailMessage = isDev
      ? buildCoinLinkImportDevDetail({
          status: response.status,
          contentType: contentType || 'application/json',
          code,
          message,
          reason: blocked ? 'upstream block' : 'API error',
          rawPreview: summarizeCoinLinkImportRawBody(rawText),
        })
      : productionMessage

    throw new ApiError(
      detailMessage,
      response.status,
      code ?? (response.status === 404 || response.status === 501 ? 'rest_coin_import_unavailable' : undefined),
    )
  }

  try {
    const result = normalizeCoinLinkImportResult(data, fallbackUrl || sourceUrls[0]?.trim() || '')
    return trimmedCatalogueText
      ? enrichImportResultWithCatalogueText(result, trimmedCatalogueText)
      : result
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'schema mismatch'
    const message = isDev
      ? buildCoinLinkImportDevDetail({
          status: response.status,
          contentType: contentType || 'application/json',
          reason: `schema mismatch (${reason})`,
          rawPreview: summarizeCoinLinkImportRawBody(rawText),
        })
      : 'Coin link import returned an unexpected response shape.'

    throw new ApiError(message, 502, 'rest_coin_import_schema_mismatch')
  }
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
