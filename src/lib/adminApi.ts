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
  }
}

async function fetchAdminSubmissionsFromApi(token: string): Promise<AdminSubmissionsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/admin/submissions`, {
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
    throw new ApiError(message, response.status, code)
  }

  const record = data as Record<string, unknown>
  const submissions = Array.isArray(record.submissions)
    ? (record.submissions as AdminSubmissionListItem[])
    : []

  return {
    success: Boolean(record.success ?? true),
    submissions,
    stats: typeof record.stats === 'object' && record.stats !== null
      ? (record.stats as AdminDashboardStats)
      : buildStatsFromSubmissions(submissions),
  }
}

async function fetchAdminStatsFromApi(token: string): Promise<AdminDashboardStats> {
  const response = await fetch(`${getApiBaseUrl()}/admin/stats`, {
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
    throw new ApiError(message, response.status, code)
  }

  const record = data as Record<string, unknown>

  return {
    pending: typeof record.pending === 'number' ? record.pending : 0,
    approved: typeof record.approved === 'number' ? record.approved : 0,
    rejected: typeof record.rejected === 'number' ? record.rejected : 0,
    contributors: typeof record.contributors === 'number' ? record.contributors : 0,
  }
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

export async function getAdminSubmissions(token: string): Promise<AdminSubmissionsResponse> {
  try {
    return await fetchAdminSubmissionsFromApi(token)
  } catch (error) {
    if (import.meta.env.DEV && error instanceof ApiError && (error.status === 404 || error.status === 501)) {
      // TODO: Remove dev fallback when WordPress GET /admin/submissions is live.
      return loadDevFallbackSubmissions(token)
    }

    throw error
  }
}

export async function getAdminDashboardStats(token: string): Promise<AdminDashboardStats> {
  try {
    return await fetchAdminStatsFromApi(token)
  } catch (error) {
    if (import.meta.env.DEV && error instanceof ApiError && (error.status === 404 || error.status === 501)) {
      const fallback = await loadDevFallbackSubmissions(token)
      return fallback.stats ?? buildStatsFromSubmissions(fallback.submissions)
    }

    throw error
  }
}

export async function getAdminSubmission(
  id: number,
  token: string,
): Promise<MySubmissionDetailResponse> {
  const response = await fetch(`${getApiBaseUrl()}/admin/submissions/${id}`, {
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
      // TODO: Remove dev fallback when WordPress GET /admin/submissions/:id is live.
      return getMySubmission(id, token)
    }

    const { message, code } = parseApiError(data, 'Unable to load submission for review.')
    throw new ApiError(message, response.status, code)
  }

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
