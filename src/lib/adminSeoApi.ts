import type {
  SeoProviderInfo,
  SubmissionSeoData,
  UpdateSubmissionSeoPayload,
  UpdateSubmissionSeoResponse,
} from '../types/adminSeo'
import { parseSeoProvider } from '../types/adminSeo'
import { ApiError, coinArchiveFetch } from './api'
import { resolveCoinArchiveApiBaseUrl } from './apiBaseUrl'
import { parseApiError, readJsonResponse, resolveHttpStatus } from './apiErrors'
import type { SeoMetadataDraft } from './seoMetadata'

/**
 * Admin SEO save via POST /admin/submissions/:id/seo (coinarchive/v1).
 * GET admin submission detail may include submission.seo and seoProvider for prefill.
 */
export const IS_ADMIN_SEO_SAVE_AVAILABLE = true

export const ADMIN_SEO_UPDATE_PATH = (submissionId: number) =>
  `/admin/submissions/${submissionId}/seo`

export { parseSeoProvider, resolveSeoProvider } from '../types/adminSeo'

export function parseSubmissionSeo(raw: unknown): SubmissionSeoData | null {
  if (typeof raw !== 'object' || raw === null) {
    return null
  }

  const record = raw as Record<string, unknown>

  return {
    title: typeof record.title === 'string' ? record.title : '',
    metaDescription:
      typeof record.metaDescription === 'string' ? record.metaDescription : '',
    focusKeyphrase:
      typeof record.focusKeyphrase === 'string' ? record.focusKeyphrase : '',
    slug: typeof record.slug === 'string' ? record.slug : '',
  }
}

export function submissionSeoToDraft(seo: SubmissionSeoData): SeoMetadataDraft {
  return {
    seoTitle: seo.title,
    metaDescription: seo.metaDescription,
    focusKeyphrase: seo.focusKeyphrase,
    slug: seo.slug,
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

/**
 * Saves admin SEO fields via POST /admin/submissions/:id/seo.
 */
export async function updateSubmissionSeo(
  submissionId: number,
  payload: UpdateSubmissionSeoPayload,
  token: string,
): Promise<UpdateSubmissionSeoResponse> {
  if (!IS_ADMIN_SEO_SAVE_AVAILABLE) {
    throw new ApiError(
      'Backend support required for saving SEO fields.',
      501,
      'admin_seo_not_available',
    )
  }

  if (!Number.isFinite(submissionId) || submissionId <= 0) {
    throw new ApiError('Invalid submission id.', 0)
  }

  const baseUrl = resolveCoinArchiveApiBaseUrl()
  if (!baseUrl) {
    throw new ApiError('API base URL is not configured.', 0)
  }

  const response = await coinArchiveFetch(`${baseUrl}${ADMIN_SEO_UPDATE_PATH(submissionId)}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const status = resolveHttpStatus(response.status, data)
    const { message, code } = parseApiError(data, 'Could not save SEO fields.')
    throw new ApiError(message, status, code)
  }

  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const seo = parseSubmissionSeo(record.seo)

  if (!seo) {
    throw new ApiError('Invalid SEO save response.', response.status)
  }

  const seoProvider =
    parseSeoProvider(record.seoProvider) ??
    parseSeoProvider((record.submission as Record<string, unknown> | undefined)?.seoProvider)

  return {
    success: record.success === true,
    message: typeof record.message === 'string' ? record.message : undefined,
    seo,
    seoProvider: seoProvider ?? undefined,
  }
}

export type SeoProviderCopy = {
  providerLabel: string
  isFallback: boolean
}

export function getSeoProviderCopy(provider: SeoProviderInfo): SeoProviderCopy {
  const isFallback = provider.active === 'none' || !provider.supported
  return {
    providerLabel: provider.label,
    isFallback,
  }
}
