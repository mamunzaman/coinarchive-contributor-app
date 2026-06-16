import type { SeoProviderInfo, SubmissionSeoData } from '../types/adminSeo'
import { resolveSeoProvider } from '../types/adminSeo'
import type { CoinAcfDetail, ContentLanguage } from '../types/coinForm'
export type { CoinAcfDetail } from '../types/coinForm'
import { mergeSubmissionWithAcf } from '../types/coinForm'
import type { DefaultImages, FormOptions } from '../types/formOptions'
import { EMPTY_FORM_OPTIONS, resolveFormOptions } from '../types/formOptions'
import { resolveCoinArchiveApiBaseUrl } from './apiBaseUrl'
import {
  parseApiError,
  readJsonResponse,
  resolveHttpStatus,
  type ApiDuplicateBlockInfo,
} from './apiErrors'

export type { ApiDuplicateBlockInfo } from './apiErrors'

export type RegisterContributorPayload = {
  email: string
  password: string
  display_name: string
}

export type RegisterContributorResponse = {
  message?: string
  dev_verification_token?: string
}

export type LoginContributorPayload = {
  email: string
  password: string
}

export type ContributorRole = 'admin' | 'contributor'

export type Contributor = {
  id: number
  email: string
  display_name: string
  status: string
  role?: ContributorRole
}

export type LoginContributorResponse = {
  success: boolean
  message?: string
  token: string
  expires_at?: string
  contributor: Contributor
}

export class ApiError extends Error {
  status: number
  code?: string
  duplicate?: ApiDuplicateBlockInfo

  constructor(
    message: string,
    status: number,
    code?: string,
    duplicate?: ApiDuplicateBlockInfo,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.duplicate = duplicate
  }
}

function getAdminApiKey(): string {
  const apiKey = import.meta.env.VITE_ADMIN_API_KEY
  if (!apiKey) {
    throw new ApiError('Admin API key is not configured.', 0)
  }
  return apiKey
}

function getApiBaseUrl(): string {
  const baseUrl = resolveCoinArchiveApiBaseUrl()
  if (!baseUrl) {
    throw new ApiError('API base URL is not configured.', 0)
  }
  return baseUrl
}

export async function coinArchiveFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0)
  }
}

function throwOnFailedResponse(response: Response, data: unknown, fallback: string): never {
  const status = resolveHttpStatus(response.status, data)
  const { message, code, duplicate } = parseApiError(data, fallback)
  throw new ApiError(message, status, code, duplicate)
}

export { throwOnFailedResponse as throwOnApiFailure }

export async function registerContributor(
  payload: RegisterContributorPayload,
): Promise<RegisterContributorResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Registration failed. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  return (data ?? {}) as RegisterContributorResponse
}

export async function loginContributor(
  payload: LoginContributorPayload,
): Promise<LoginContributorResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Login failed. Please try again.')
    throw new ApiError(getLoginErrorMessage(code, message), response.status, code)
  }

  return data as LoginContributorResponse
}

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  rest_invalid_credentials: 'Invalid email or password.',
  rest_email_not_verified: 'Email address is not verified. Please check your inbox.',
  rest_contributor_not_approved: 'Your account is not approved yet. Please wait for admin approval.',
}

export type ApproveContributorResponse = {
  success: boolean
  message?: string
  contributor?: {
    id: number
    status: string
    email_verified?: boolean
    approved_by?: number
    approved_at?: string
  }
}

export async function approveContributor(
  contributorId: number,
): Promise<ApproveContributorResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/admin/approve-contributor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CoinArchive-Key': getAdminApiKey(),
    },
    body: JSON.stringify({ contributor_id: Number(contributorId) }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Approval failed. Please try again.')
    throw new ApiError(getApproveErrorMessage(code, message), response.status, code)
  }

  return data as ApproveContributorResponse
}

export type SetContributorRoleResponse = {
  success: boolean
  message?: string
  contributor?: {
    id: number
    status: string
    role?: ContributorRole
    email?: string
    display_name?: string
  }
}

export async function setContributorRole(
  contributorId: number,
  role: ContributorRole,
): Promise<SetContributorRoleResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/admin/set-contributor-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CoinArchive-Key': getAdminApiKey(),
    },
    body: JSON.stringify({ contributor_id: Number(contributorId), role }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to update contributor role.')
    throw new ApiError(getApproveErrorMessage(code, message), response.status, code)
  }

  return data as SetContributorRoleResponse
}

const APPROVE_ERROR_MESSAGES: Record<string, string> = {
  rest_contributor_not_found: 'Contributor not found. Check the ID and try again.',
  rest_contributor_already_approved: 'This contributor is already approved.',
  rest_contributor_not_ready: 'Contributor is not ready for approval. Verify their email first.',
  rest_missing_contributor_id: 'Contributor ID is required.',
}

function getApproveErrorMessage(code: string | undefined, fallback: string): string {
  if (code && APPROVE_ERROR_MESSAGES[code]) {
    return APPROVE_ERROR_MESSAGES[code]
  }
  return fallback
}

function getLoginErrorMessage(code: string | undefined, fallback: string): string {
  if (code && LOGIN_ERROR_MESSAGES[code]) {
    return LOGIN_ERROR_MESSAGES[code]
  }
  return fallback
}

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

import {
  COIN_LINK_IMPORT_MAX_URLS,
  enrichImportResultWithCatalogueText,
  normalizeCoinLinkImportResult,
  type CoinLinkImportResult,
} from './coinImport'

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

export type SubmissionImageRef = {
  id: number
  url: string
}

export type CoinSubmission = {
  id: number
  title: string
  status: string
  content_language?: 'de' | 'en'
  content_language_label?: string
  content_language_badge?: string
  content_language_notice?: string
  missing_translation_language?: string
  missing_translation_language_label?: string
  translation_status?: string
  translation_status_label?: string
  translation_post_id?: number | string | null
  date: string
  modified_date?: string
  edit_link?: string
  preview_image?: SubmissionImageRef | null
  images?: {
    obverse?: SubmissionImageRef | null
    reverse?: SubmissionImageRef | null
    gallery?: SubmissionImageRef[]
  }
  admin_notes?: string | string[]
  revision_notes?: string | string[]
  review_notes?: string | string[]
  admin_feedback?: string | string[]
  rejection_note?: string | string[]
  submission_status?: string
  post_status?: string
  can_edit?: boolean
  allowed_actions?: string[] | Record<string, boolean>
}

export type MySubmissionsResponse = {
  success: boolean
  submissions: CoinSubmission[]
}

export async function getMySubmissions(token: string): Promise<MySubmissionsResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/my-submissions`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load submissions. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  return data as MySubmissionsResponse
}

export type {
  DefaultImageRef,
  DefaultImages,
  FormOptions,
  TaxonomyOption,
} from '../types/formOptions'

export type FormOptionsResponse = {
  success: boolean
  options: FormOptions
  default_images?: DefaultImages
}

export async function getFormOptions(
  token: string,
  contentLanguage: ContentLanguage = 'de',
): Promise<FormOptionsResponse> {
  const params = new URLSearchParams({ content_language: contentLanguage || 'de' })
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/form-options?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load form options. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  const responseData = data as FormOptionsResponse
  const rawOptions = responseData.options ?? EMPTY_FORM_OPTIONS
  const normalizedOptions: FormOptions = {
    countries: rawOptions.countries ?? [],
    values: rawOptions.values ?? [],
    types: rawOptions.types ?? [],
    series: rawOptions.series ?? [],
  }

  return {
    ...responseData,
    options: resolveFormOptions(normalizedOptions, contentLanguage),
  }
}

export type SubmissionImage = {
  id: number
  url: string
}

export function normalizeGalleryImageId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return 0
    }

    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return 0
}

export type SubmissionActivityLog = {
  id: number
  post_id: number
  user_id: number
  event_type: string
  event_label: string
  event_message: string
  event_data?: Record<string, unknown>
  created_at: string
}

export type SubmissionActivityLogsPayload = {
  recent: SubmissionActivityLog[]
  total: number
}

export type CoinSubmissionDetail = {
  id: number
  title: string
  status: string
  /** Admin detail only — populated when backend exposes submission.seo. */
  seo?: SubmissionSeoData
  /** Active WordPress SEO plugin detected by backend. */
  seoProvider?: SeoProviderInfo
  content_language?: 'de' | 'en'
  content_language_label?: string
  content_language_badge?: string
  content_language_notice?: string
  missing_translation_language?: string
  missing_translation_language_label?: string
  translation_status?: string
  translation_status_label?: string
  translation_post_id?: number | string | null
  date: string
  modified_date?: string
  thumbnail_url?: string | null
  obverse_url?: string | null
  reverse_url?: string | null
  image_url?: string | null
  default_image_url?: string | null
  default_obverse_url?: string | null
  default_reverse_url?: string | null
  country: string
  denomination: string
  coin_type: string
  coin_series?: string
  year: number
  short_description: string
  acf?: CoinAcfDetail
  images: {
    obverse: SubmissionImage | null
    reverse: SubmissionImage | null
    gallery?: SubmissionImage[]
  }
  admin_notes?: string | string[]
  revision_notes?: string | string[]
  review_notes?: string | string[]
  admin_feedback?: string | string[]
  rejection_note?: string | string[]
  submission_status?: string
  post_status?: string
  can_edit?: boolean
  allowed_actions?: string[] | Record<string, boolean>
  submitted_by?: {
    auth_type?: string
    contributor_id?: number | null
    email?: string | null
  }
}

export type MySubmissionDetailResponse = {
  success: boolean
  submission: CoinSubmissionDetail
  acf?: CoinAcfDetail
  activity_logs?: SubmissionActivityLogsPayload
}

export type MySubmissionActivityResponse = {
  success: boolean
  post_id: number
  total: number
  activity_logs: SubmissionActivityLog[]
}

function normalizeActivityLog(raw: unknown): SubmissionActivityLog | null {
  if (typeof raw !== 'object' || raw === null) {
    return null
  }

  const record = raw as Record<string, unknown>

  if (typeof record.id !== 'number' || typeof record.event_type !== 'string') {
    return null
  }

  return {
    id: record.id,
    post_id: typeof record.post_id === 'number' ? record.post_id : 0,
    user_id: typeof record.user_id === 'number' ? record.user_id : 0,
    event_type: record.event_type,
    event_label: typeof record.event_label === 'string' ? record.event_label : record.event_type,
    event_message: typeof record.event_message === 'string' ? record.event_message : '',
    event_data:
      typeof record.event_data === 'object' && record.event_data !== null
        ? (record.event_data as Record<string, unknown>)
        : undefined,
    created_at: typeof record.created_at === 'string' ? record.created_at : '',
  }
}

function normalizeActivityLogsPayload(raw: unknown): SubmissionActivityLogsPayload | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined
  }

  const record = raw as Record<string, unknown>
  const recentRaw = Array.isArray(record.recent) ? record.recent : []
  const recent = recentRaw
    .map(normalizeActivityLog)
    .filter((log): log is SubmissionActivityLog => log !== null)

  return {
    recent,
    total: typeof record.total === 'number' ? record.total : recent.length,
  }
}

function normalizeActivityLogList(raw: unknown): SubmissionActivityLog[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map(normalizeActivityLog).filter((log): log is SubmissionActivityLog => log !== null)
}

function readSubmissionImageList(value: unknown): SubmissionImage[] {
  if (!Array.isArray(value)) {
    return []
  }

  const results: SubmissionImage[] = []

  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      continue
    }

    const record = item as Record<string, unknown>
    const id = normalizeGalleryImageId(record.id)
    const url = record.url

    if (id > 0 && typeof url === 'string' && url.trim()) {
      results.push({ id, url: url.trim() })
    }
  }

  return results
}

function readGalleryImagesFromPayload(data: unknown): SubmissionImage[] {
  if (typeof data !== 'object' || data === null) {
    return []
  }

  const record = data as Record<string, unknown>
  const submission = record.submission

  if (typeof submission === 'object' && submission !== null) {
    const images = (submission as Record<string, unknown>).images
    if (typeof images === 'object' && images !== null) {
      const fromSubmission = readSubmissionImageList((images as Record<string, unknown>).gallery)
      if (fromSubmission.length > 0) {
        return fromSubmission
      }
    }
  }

  const topImages = record.images
  if (typeof topImages === 'object' && topImages !== null) {
    const fromTopImages = readSubmissionImageList((topImages as Record<string, unknown>).gallery)
    if (fromTopImages.length > 0) {
      return fromTopImages
    }
  }

  return readSubmissionImageList(record.gallery)
}

function mergeSubmissionGalleryImages(
  current: SubmissionImage[],
  incoming: SubmissionImage[],
  changes?: SubmissionGalleryImageChange,
): SubmissionImage[] {
  const removedIds = new Set(changes?.removed_ids ?? [])
  const addedIds = changes?.added_ids ?? []
  const byId = new Map(current.map((image) => [image.id, image]))

  for (const image of incoming) {
    byId.set(image.id, image)
  }

  let ordered = current.filter((image) => !removedIds.has(image.id))

  for (const id of addedIds) {
    const image = byId.get(id)
    if (image && !ordered.some((entry) => entry.id === id)) {
      ordered.push(image)
    }
  }

  if (incoming.length > 0) {
    const incomingFiltered = incoming.filter((image) => !removedIds.has(image.id))
    const currentWithoutRemoved = current.filter((image) => !removedIds.has(image.id))
    const incomingHasAllOrdered = ordered.every((image) =>
      incomingFiltered.some((entry) => entry.id === image.id),
    )

    if (incomingFiltered.length < currentWithoutRemoved.length) {
      return incomingFiltered
    }

    if (incomingFiltered.length > ordered.length || incomingHasAllOrdered) {
      return incomingFiltered
    }
  }

  return ordered
}

export function applyGalleryImagesToSubmission(
  submission: CoinSubmissionDetail,
  gallery: SubmissionImage[],
  imageChanges?: SubmissionImageChanges,
): CoinSubmissionDetail {
  const current = submission.images.gallery ?? []
  const merged = mergeSubmissionGalleryImages(current, gallery, imageChanges?.gallery)

  if (
    merged.length === current.length &&
    merged.every((image, index) => image.id === current[index]?.id && image.url === current[index]?.url)
  ) {
    return submission
  }

  return {
    ...submission,
    images: {
      ...submission.images,
      gallery: merged,
    },
  }
}

function normalizeSubmissionImages(submission: CoinSubmissionDetail): CoinSubmissionDetail {
  return {
    ...submission,
    images: {
      obverse: submission.images?.obverse ?? null,
      reverse: submission.images?.reverse ?? null,
      gallery: readSubmissionImageList(submission.images?.gallery),
    },
  }
}

function normalizeSubmissionDetail(data: unknown): CoinSubmissionDetail {
  if (typeof data !== 'object' || data === null) {
    throw new ApiError('Invalid submission response.', 0)
  }

  const record = data as Record<string, unknown>
  const submission = record.submission as CoinSubmissionDetail
  const acf = record.acf as CoinAcfDetail | undefined
  const merged = normalizeSubmissionImages(mergeSubmissionWithAcf(submission, acf))
  const rawProvider = record.seoProvider ?? merged.seoProvider ?? submission.seoProvider

  return {
    ...merged,
    seoProvider: resolveSeoProvider(rawProvider),
  }
}

export function normalizeSubmissionResponse(data: unknown): MySubmissionDetailResponse {
  const submission = normalizeSubmissionDetail(data)
  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const activity_logs = normalizeActivityLogsPayload(record.activity_logs)

  return {
    success: true,
    submission,
    acf: submission.acf,
    activity_logs,
  }
}

export async function getMySubmission(
  id: number,
  token: string,
): Promise<MySubmissionDetailResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/my-submissions/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load submission. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  return normalizeSubmissionResponse(data)
}

export async function getMySubmissionActivity(
  id: number,
  token: string,
): Promise<MySubmissionActivityResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/my-submissions/${id}/activity`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load activity. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  if (typeof data !== 'object' || data === null) {
    throw new ApiError('Invalid activity response.', 0)
  }

  const record = data as Record<string, unknown>
  const activity_logs = normalizeActivityLogList(record.activity_logs)

  return {
    success: true,
    post_id: typeof record.post_id === 'number' ? record.post_id : id,
    total: typeof record.total === 'number' ? record.total : activity_logs.length,
    activity_logs,
  }
}

export type SubmissionFaceImageChange = {
  removed: boolean
  uploaded_id: number | null
  deleted: boolean
  delete_blocked_reason: string
}

export type SubmissionGalleryBlockedDeletion = {
  id?: number
  reason?: string
}

export type SubmissionGalleryImageChange = {
  added_ids: number[]
  removed_ids: number[]
  deleted_ids: number[]
  blocked_deletions: SubmissionGalleryBlockedDeletion[]
}

export type SubmissionImageChanges = {
  obverse: SubmissionFaceImageChange
  reverse: SubmissionFaceImageChange
  gallery: SubmissionGalleryImageChange
}

function readFaceImageChange(value: unknown): SubmissionFaceImageChange {
  if (typeof value !== 'object' || value === null) {
    return {
      removed: false,
      uploaded_id: null,
      deleted: false,
      delete_blocked_reason: '',
    }
  }

  const record = value as Record<string, unknown>
  const uploadedId = record.uploaded_id

  return {
    removed: Boolean(record.removed),
    uploaded_id: typeof uploadedId === 'number' && uploadedId > 0 ? uploadedId : null,
    deleted: Boolean(record.deleted),
    delete_blocked_reason:
      typeof record.delete_blocked_reason === 'string' ? record.delete_blocked_reason : '',
  }
}

function readGalleryIdList(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => (typeof item === 'number' ? item : Number.parseInt(String(item), 10)))
    .filter((id) => Number.isFinite(id) && id > 0)
}

function readGalleryBlockedDeletions(value: unknown): SubmissionGalleryBlockedDeletion[] {
  if (!Array.isArray(value)) {
    return []
  }

  const results: SubmissionGalleryBlockedDeletion[] = []

  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      results.push({ reason: item.trim() })
      continue
    }

    if (typeof item !== 'object' || item === null) {
      continue
    }

    const record = item as Record<string, unknown>
    const id = record.id
    const reason = record.reason

    results.push({
      id: typeof id === 'number' && id > 0 ? id : undefined,
      reason: typeof reason === 'string' ? reason : undefined,
    })
  }

  return results
}

export function readSubmissionImageChanges(data: unknown): SubmissionImageChanges | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined
  }

  const record = data as Record<string, unknown>
  const raw =
    record.image_changes ??
    (typeof record.data === 'object' && record.data !== null
      ? (record.data as Record<string, unknown>).image_changes
      : undefined)

  if (typeof raw !== 'object' || raw === null) {
    return undefined
  }

  const changes = raw as Record<string, unknown>
  const galleryRaw =
    typeof changes.gallery === 'object' && changes.gallery !== null
      ? (changes.gallery as Record<string, unknown>)
      : null

  return {
    obverse: readFaceImageChange(changes.obverse),
    reverse: readFaceImageChange(changes.reverse),
    gallery: {
      added_ids: readGalleryIdList(galleryRaw?.added_ids),
      removed_ids: readGalleryIdList(galleryRaw?.removed_ids),
      deleted_ids: readGalleryIdList(galleryRaw?.deleted_ids),
      blocked_deletions: readGalleryBlockedDeletions(galleryRaw?.blocked_deletions),
    },
  }
}

export function collectSubmissionImageChangeWarnings(
  imageChanges: SubmissionImageChanges | undefined,
): string[] {
  if (!imageChanges) {
    return []
  }

  const warnings: string[] = []

  for (const side of ['obverse', 'reverse'] as const) {
    const change = imageChanges[side]
    if (change.removed && !change.deleted && change.delete_blocked_reason.trim()) {
      warnings.push(
        `Image was removed from this submission, but media deletion was blocked: ${change.delete_blocked_reason.trim()}`,
      )
    }
  }

  for (const blocked of imageChanges.gallery.blocked_deletions) {
    const reason = blocked.reason?.trim() || 'blocked'
    warnings.push(
      `Image was removed from this submission, but media deletion was blocked: ${reason}`,
    )
  }

  return warnings
}

export type UpdateMySubmissionResponse = {
  success: boolean
  message?: string
  submission: CoinSubmissionDetail
  acf?: CoinAcfDetail
  image_changes?: SubmissionImageChanges
}

export async function updateMySubmission(
  id: number,
  formData: FormData,
  token: string,
): Promise<UpdateMySubmissionResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/my-submissions/${id}/update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to update submission. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  const record = data as Record<string, unknown>
  const image_changes = readSubmissionImageChanges(record)
  const galleryFromPayload = readGalleryImagesFromPayload(data)
  const submission = applyGalleryImagesToSubmission(
    normalizeSubmissionDetail(data),
    galleryFromPayload,
    image_changes,
  )

  return {
    success: Boolean(record.success),
    message: typeof record.message === 'string' ? record.message : undefined,
    submission,
    acf: submission.acf,
    image_changes,
  }
}

export type DeleteMySubmissionResponse = {
  success: boolean
  deleted_attachments?: unknown[]
  skipped_attachments?: unknown[]
  message?: string
}

export async function deleteMySubmission(
  id: number | string,
  token: string,
): Promise<DeleteMySubmissionResponse> {
  const response = await coinArchiveFetch(`${getApiBaseUrl()}/my-submissions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to delete submission. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  if (typeof data !== 'object' || data === null) {
    return { success: true }
  }

  const record = data as Record<string, unknown>

  return {
    success: Boolean(record.success ?? true),
    deleted_attachments: Array.isArray(record.deleted_attachments)
      ? record.deleted_attachments
      : undefined,
    skipped_attachments: Array.isArray(record.skipped_attachments)
      ? record.skipped_attachments
      : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
  }
}
