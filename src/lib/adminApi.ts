import {
  ApiError,
  getMySubmission,
  getMySubmissions,
  type CoinSubmission,
  type CoinSubmissionDetail,
  type MySubmissionDetailResponse,
} from './api'
import { computeSubmissionStats } from './submissionStats'

export type AdminSubmissionListItem = CoinSubmission & {
  country?: string
  year?: number | string
  coin_code?: string
  contributor_id?: number
  contributor_name?: string
  contributor_email?: string
  modified_date?: string
}

export type AdminDashboardStats = {
  pending: number
  approved: number
  rejected: number
  contributors: number
  total?: number
  draft?: number
  needs_revision?: number
}

export type AdminSubmissionsResponse = {
  success: boolean
  submissions: AdminSubmissionListItem[]
  stats?: AdminDashboardStats
}

export type AdminDecisionResponse = {
  success: boolean
  message?: string
  submission?: CoinSubmissionDetail
}

export type AdminFetchMeta = {
  endpoint: string
  usedDevFallback: boolean
}

export type AdminSubmissionsFetchResult = {
  response: AdminSubmissionsResponse
  meta: AdminFetchMeta
}

export type AdminStatsFetchResult = {
  stats: AdminDashboardStats
  meta: AdminFetchMeta
}

const ADMIN_ENDPOINTS = {
  stats: '/admin/stats',
  submissions: '/admin/submissions',
  submissionDetail: (id: number) => `/admin/submissions/${id}`,
} as const

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

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }
}

function readStatValue(source: Record<string, unknown>, key: string): number {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function parseAdminStatsPayload(data: unknown): AdminDashboardStats {
  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const statsSource =
    typeof record.stats === 'object' && record.stats !== null
      ? (record.stats as Record<string, unknown>)
      : record

  return {
    pending: readStatValue(statsSource, 'pending'),
    approved: readStatValue(statsSource, 'approved'),
    rejected: readStatValue(statsSource, 'rejected'),
    contributors: readStatValue(statsSource, 'contributors'),
    total: readStatValue(statsSource, 'total') || undefined,
    draft: readStatValue(statsSource, 'draft') || undefined,
    needs_revision: readStatValue(statsSource, 'needs_revision') || undefined,
  }
}

function logAdminApiSuccess(endpoint: string, data: unknown): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.info(`[adminApi] ${endpoint} response`, data)
}

function logAdminApiFailure(endpoint: string, status: number, error: unknown): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.warn('[adminApi] admin endpoint failed', endpoint, status, error)
}

function shouldUseDevFallback(error: unknown): error is ApiError {
  return import.meta.env.DEV && error instanceof ApiError && error.status === 404
}

export function formatAdminEndpointError(endpoint: string, error: ApiError): string {
  if (error.status === 401 || error.status === 403) {
    return 'Admin session is not authorized. Please log out and log in again.'
  }

  if (error.status === 404) {
    if (endpoint === ADMIN_ENDPOINTS.stats) {
      return 'Admin stats endpoint is not available yet (GET /admin/stats returned 404).'
    }

    if (endpoint === ADMIN_ENDPOINTS.submissions) {
      return 'Admin submissions endpoint is not available yet (GET /admin/submissions returned 404). Showing limited preview data in development.'
    }

    return `Admin API endpoint not found: ${endpoint}.`
  }

  if (error.status >= 500) {
    return 'Admin API error. Check WordPress debug log.'
  }

  return error.message
}

function mapContributorSubmissionToAdminItem(submission: CoinSubmission): AdminSubmissionListItem {
  return {
    ...submission,
    modified_date: submission.date,
  }
}

function buildStatsFromSubmissions(submissions: AdminSubmissionListItem[]): AdminDashboardStats {
  const stats = computeSubmissionStats(submissions)

  return {
    pending: stats.pending,
    approved: stats.published,
    rejected: stats.rejected,
    contributors: 0,
    draft: stats.drafts,
  }
}

async function fetchAdminSubmissionsFromApi(token: string): Promise<AdminSubmissionsResponse> {
  const endpoint = ADMIN_ENDPOINTS.submissions
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: 'GET',
    headers: authHeaders(token),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load admin submissions.')
    const error = new ApiError(message, response.status, code)
    logAdminApiFailure(endpoint, response.status, error)
    throw error
  }

  logAdminApiSuccess(endpoint, data)

  const record = data as Record<string, unknown>
  const submissions = Array.isArray(record.submissions)
    ? (record.submissions as AdminSubmissionListItem[])
    : []

  return {
    success: Boolean(record.success ?? true),
    submissions,
    stats:
      typeof record.stats === 'object' && record.stats !== null
        ? parseAdminStatsPayload({ stats: record.stats })
        : buildStatsFromSubmissions(submissions),
  }
}

async function fetchAdminStatsFromApi(token: string): Promise<AdminDashboardStats> {
  const endpoint = ADMIN_ENDPOINTS.stats
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: 'GET',
    headers: authHeaders(token),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to load admin stats.')
    const error = new ApiError(message, response.status, code)
    logAdminApiFailure(endpoint, response.status, error)
    throw error
  }

  logAdminApiSuccess(endpoint, data)
  return parseAdminStatsPayload(data)
}

async function loadDevFallbackSubmissions(token: string): Promise<AdminSubmissionsResponse> {
  const response = await getMySubmissions(token)
  const submissions = response.submissions.map(mapContributorSubmissionToAdminItem)
  const contributor = response.submissions.length > 0 ? 1 : 0

  return {
    success: true,
    submissions,
    stats: {
      ...buildStatsFromSubmissions(submissions),
      contributors: contributor,
    },
  }
}

export async function getAdminSubmissions(token: string): Promise<AdminSubmissionsFetchResult> {
  const endpoint = ADMIN_ENDPOINTS.submissions

  try {
    const response = await fetchAdminSubmissionsFromApi(token)
    return {
      response,
      meta: { endpoint, usedDevFallback: false },
    }
  } catch (error) {
    if (shouldUseDevFallback(error)) {
      const response = await loadDevFallbackSubmissions(token)
      if (import.meta.env.DEV) {
        console.info('[adminApi] using dev fallback for', endpoint)
      }
      return {
        response,
        meta: { endpoint, usedDevFallback: true },
      }
    }

    throw error
  }
}

export async function getAdminDashboardStats(token: string): Promise<AdminStatsFetchResult> {
  const endpoint = ADMIN_ENDPOINTS.stats

  try {
    const stats = await fetchAdminStatsFromApi(token)
    return {
      stats,
      meta: { endpoint, usedDevFallback: false },
    }
  } catch (error) {
    if (shouldUseDevFallback(error)) {
      const fallback = await loadDevFallbackSubmissions(token)
      const stats = fallback.stats ?? buildStatsFromSubmissions(fallback.submissions)
      if (import.meta.env.DEV) {
        console.info('[adminApi] using dev fallback for', endpoint)
      }
      return {
        stats,
        meta: { endpoint, usedDevFallback: true },
      }
    }

    throw error
  }
}

export async function getAdminSubmission(
  id: number,
  token: string,
): Promise<MySubmissionDetailResponse> {
  const endpoint = ADMIN_ENDPOINTS.submissionDetail(id)
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: 'GET',
    headers: authHeaders(token),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    if (import.meta.env.DEV && response.status === 404) {
      if (import.meta.env.DEV) {
        console.info('[adminApi] using dev fallback for', endpoint)
      }
      return getMySubmission(id, token)
    }

    const { message, code } = parseApiError(data, 'Unable to load submission for review.')
    const error = new ApiError(message, response.status, code)
    logAdminApiFailure(endpoint, response.status, error)
    throw error
  }

  logAdminApiSuccess(endpoint, data)
  return data as MySubmissionDetailResponse
}

export async function approveAdminSubmission(
  id: number,
  token: string,
): Promise<AdminDecisionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/admin/submissions/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to approve submission.')
    throw new ApiError(message, response.status, code)
  }

  return (data ?? { success: true }) as AdminDecisionResponse
}

export async function rejectAdminSubmission(
  id: number,
  reason: string,
  token: string,
): Promise<AdminDecisionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/admin/submissions/${id}/reject`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to reject submission.')
    throw new ApiError(message, response.status, code)
  }

  return (data ?? { success: true }) as AdminDecisionResponse
}

export async function requestAdminSubmissionRevision(
  id: number,
  notes: string,
  token: string,
): Promise<AdminDecisionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/admin/submissions/${id}/request-revision`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes }),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const { message, code } = parseApiError(data, 'Unable to request revision.')
    throw new ApiError(message, response.status, code)
  }

  return (data ?? { success: true }) as AdminDecisionResponse
}

export function sortAdminSubmissionsByUpdated(
  submissions: AdminSubmissionListItem[],
): AdminSubmissionListItem[] {
  return [...submissions].sort((left, right) => {
    const leftDate = left.modified_date ?? left.date
    const rightDate = right.modified_date ?? right.date
    const leftTime = new Date(leftDate.includes('T') ? leftDate : leftDate.replace(' ', 'T')).getTime()
    const rightTime = new Date(rightDate.includes('T') ? rightDate : rightDate.replace(' ', 'T')).getTime()
    return rightTime - leftTime
  })
}

export function getPendingAdminSubmissions(
  submissions: AdminSubmissionListItem[],
  limit?: number,
): AdminSubmissionListItem[] {
  const pending = sortAdminSubmissionsByUpdated(submissions).filter(
    (submission) => submission.status === 'pending',
  )

  return typeof limit === 'number' ? pending.slice(0, limit) : pending
}

// ── Contributor management ──────────────────────────────────────────────────

export type AdminContributorListItem = {
  id: number
  display_name?: string
  email?: string
  status: string          // 'pending' | 'approved' | 'rejected' | 'suspended'
  role?: string           // 'contributor' | 'admin'
  email_verified?: boolean
  registered_date?: string
  submission_count?: number
}

export type AdminContributorsResponse = {
  success: boolean
  contributors: AdminContributorListItem[]
  total?: number
}

export type AdminContributorsFetchResult = {
  contributors: AdminContributorListItem[]
  meta: AdminFetchMeta
}

export async function getAdminContributors(
  token: string,
): Promise<AdminContributorsFetchResult> {
  const endpoint = '/admin/contributors'
  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      headers: authHeaders(token),
    })

    let data: unknown = null
    try { data = await response.json() } catch { data = null }

    if (!response.ok) {
      const err = new ApiError(
        parseApiError(data, 'Unable to load contributors.').message,
        response.status,
      )
      if (shouldUseDevFallback(err)) {
        logAdminApiFailure(endpoint, response.status, 'No contributors list endpoint — returning empty list.')
        return { contributors: [], meta: { endpoint, usedDevFallback: true } }
      }
      throw err
    }

    const payload = data as AdminContributorsResponse
    logAdminApiSuccess(endpoint, payload.contributors?.length ?? 0)
    return {
      contributors: payload.contributors ?? [],
      meta: { endpoint, usedDevFallback: false },
    }
  } catch (err) {
    if (err instanceof ApiError && shouldUseDevFallback(err)) {
      return { contributors: [], meta: { endpoint, usedDevFallback: true } }
    }
    throw err
  }
}

export type AdminRejectContributorResponse = {
  success: boolean
  message?: string
}

export async function rejectAdminContributor(
  contributorId: number,
  token: string,
): Promise<AdminRejectContributorResponse> {
  const response = await fetch(`${getApiBaseUrl()}/admin/reject-contributor`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ contributor_id: contributorId }),
  })

  let data: unknown = null
  try { data = await response.json() } catch { data = null }

  if (!response.ok) {
    const { message } = parseApiError(data, 'Unable to reject contributor.')
    throw new ApiError(message, response.status)
  }

  return data as AdminRejectContributorResponse
}

export async function setAdminContributorRole(
  contributorId: number,
  role: 'contributor' | 'admin',
  token: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${getApiBaseUrl()}/admin/set-contributor-role`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ contributor_id: contributorId, role }),
  })

  let data: unknown = null
  try { data = await response.json() } catch { data = null }

  if (!response.ok) {
    const { message } = parseApiError(data, 'Unable to update contributor role.')
    throw new ApiError(message, response.status)
  }

  return data as { success: boolean; message?: string }
}

export async function approveAdminContributor(
  contributorId: number,
  token: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${getApiBaseUrl()}/admin/approve-contributor`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ contributor_id: contributorId }),
  })

  let data: unknown = null
  try { data = await response.json() } catch { data = null }

  if (!response.ok) {
    const { message } = parseApiError(data, 'Unable to approve contributor.')
    throw new ApiError(message, response.status)
  }

  return data as { success: boolean; message?: string }
}

export type BulkAdminActionResult = {
  succeeded: number[]
  failed: Array<{ id: number; message: string }>
}

export async function bulkApproveAdminSubmissions(
  ids: number[],
  token: string,
): Promise<BulkAdminActionResult> {
  const succeeded: number[] = []
  const failed: Array<{ id: number; message: string }> = []

  for (const id of ids) {
    try {
      await approveAdminSubmission(id, token)
      succeeded.push(id)
    } catch (error) {
      failed.push({
        id,
        message: error instanceof ApiError ? error.message : 'Approval failed.',
      })
    }
  }

  return { succeeded, failed }
}

export async function bulkRejectAdminSubmissions(
  ids: number[],
  reason: string,
  token: string,
): Promise<BulkAdminActionResult> {
  const succeeded: number[] = []
  const failed: Array<{ id: number; message: string }> = []

  for (const id of ids) {
    try {
      await rejectAdminSubmission(id, reason, token)
      succeeded.push(id)
    } catch (error) {
      failed.push({
        id,
        message: error instanceof ApiError ? error.message : 'Rejection failed.',
      })
    }
  }

  return { succeeded, failed }
}
