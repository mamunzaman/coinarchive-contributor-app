import type { CoinAcfDetail } from '../types/coinForm'
import { mergeSubmissionWithAcf } from '../types/coinForm'
import type { FormOptions } from '../types/formOptions'

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

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
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
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new ApiError('API base URL is not configured.', 0)
  }
  return baseUrl.replace(/\/$/, '')
}

function parseApiError(
  data: unknown,
  fallback: string,
): { message: string; code?: string } {
  if (typeof data !== 'object' || data === null) {
    return { message: fallback }
  }

  const record = data as Record<string, unknown>
  const code = typeof record.code === 'string' ? record.code : undefined

  if (typeof record.message === 'string' && record.message.trim()) {
    return {
      message: record.message.replace(/<[^>]*>/g, '').trim(),
      code,
    }
  }

  if (typeof record.error === 'string' && record.error.trim()) {
    return { message: record.error.trim(), code }
  }

  return { message: fallback, code }
}

export async function registerContributor(
  payload: RegisterContributorPayload,
): Promise<RegisterContributorResponse> {
  const response = await fetch(`${getApiBaseUrl()}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Registration failed. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  return (data ?? {}) as RegisterContributorResponse
}

export async function loginContributor(
  payload: LoginContributorPayload,
): Promise<LoginContributorResponse> {
  const response = await fetch(`${getApiBaseUrl()}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

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
  const response = await fetch(`${getApiBaseUrl()}/admin/approve-contributor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CoinArchive-Key': getAdminApiKey(),
    },
    body: JSON.stringify({ contributor_id: Number(contributorId) }),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Approval failed. Please try again.')
    throw new ApiError(getApproveErrorMessage(code, message), response.status, code)
  }

  return data as ApproveContributorResponse
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

export async function submitCoin(
  formData: FormData,
  token: string,
): Promise<SubmitCoinResponse> {
  const response = await fetch(`${getApiBaseUrl()}/submit-coin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

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
  date: string
  edit_link?: string
  preview_image?: SubmissionImageRef | null
  images?: {
    obverse?: SubmissionImageRef | null
    reverse?: SubmissionImageRef | null
    gallery?: SubmissionImageRef[]
  }
}

export type MySubmissionsResponse = {
  success: boolean
  submissions: CoinSubmission[]
}

export async function getMySubmissions(token: string): Promise<MySubmissionsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/my-submissions`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load submissions. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  return data as MySubmissionsResponse
}

export type { TaxonomyOption } from '../types/formOptions'
export type { FormOptions } from '../types/formOptions'

export type FormOptionsResponse = {
  success: boolean
  options: FormOptions
}

export async function getFormOptions(token: string): Promise<FormOptionsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/form-options`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load form options. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  return data as FormOptionsResponse
}

export type SubmissionImage = {
  id: number
  url: string
}

export type CoinSubmissionDetail = {
  id: number
  title: string
  status: string
  date: string
  country: string
  denomination: string
  coin_type: string
  year: number
  short_description: string
  acf?: CoinAcfDetail
  images: {
    obverse: SubmissionImage | null
    reverse: SubmissionImage | null
    gallery?: SubmissionImage[]
  }
}

export type MySubmissionDetailResponse = {
  success: boolean
  submission: CoinSubmissionDetail
  acf?: CoinAcfDetail
}

function normalizeSubmissionImages(submission: CoinSubmissionDetail): CoinSubmissionDetail {
  return {
    ...submission,
    images: {
      obverse: submission.images?.obverse ?? null,
      reverse: submission.images?.reverse ?? null,
      gallery: Array.isArray(submission.images?.gallery) ? submission.images.gallery : [],
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

  return normalizeSubmissionImages(mergeSubmissionWithAcf(submission, acf))
}

export async function getMySubmission(
  id: number,
  token: string,
): Promise<MySubmissionDetailResponse> {
  const response = await fetch(`${getApiBaseUrl()}/my-submissions/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load submission. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  const submission = normalizeSubmissionDetail(data)
  return {
    success: true,
    submission,
    acf: submission.acf,
  }
}

export type UpdateMySubmissionResponse = {
  success: boolean
  message?: string
  submission: CoinSubmissionDetail
  acf?: CoinAcfDetail
}

export async function updateMySubmission(
  id: number,
  formData: FormData,
  token: string,
): Promise<UpdateMySubmissionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/my-submissions/${id}/update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to update submission. Please try again.')
    throw new ApiError(message, response.status, code)
  }

  const record = data as Record<string, unknown>
  const submission = normalizeSubmissionDetail(data)

  return {
    success: Boolean(record.success),
    message: typeof record.message === 'string' ? record.message : undefined,
    submission,
    acf: submission.acf,
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
  const response = await fetch(`${getApiBaseUrl()}/my-submissions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

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
