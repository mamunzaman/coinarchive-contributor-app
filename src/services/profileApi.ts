import { ApiError, coinArchiveFetch, throwOnApiFailure } from '../lib/api/core'
import { getCoinArchiveApiBaseUrl } from '../lib/apiBaseUrl'
import { readJsonResponse } from '../lib/apiErrors'
import type { ProfileUpdatePayload } from '../lib/profileFields'
import { normalizeAuthContributor } from './authApi'
import type { AuthContributor } from '../types/auth'

export type UpdateAuthProfileResponse = {
  success: boolean
  message?: string
  contributor?: AuthContributor
}

function readContributorFromProfileResponse(data: unknown): AuthContributor | null {
  if (typeof data !== 'object' || data === null) {
    return null
  }

  const record = data as Record<string, unknown>

  if (record.contributor) {
    return normalizeAuthContributor(record.contributor)
  }

  if (record.data && typeof record.data === 'object' && record.data !== null) {
    const nested = record.data as Record<string, unknown>
    if (nested.contributor) {
      return normalizeAuthContributor(nested.contributor)
    }
  }

  return normalizeAuthContributor(record)
}

export async function updateAuthProfile(
  token: string,
  payload: ProfileUpdatePayload,
): Promise<AuthContributor> {
  const baseUrl = getCoinArchiveApiBaseUrl()
  if (!baseUrl) {
    throw new Error('API base URL is not configured.')
  }

  const response = await coinArchiveFetch(`${baseUrl}/auth/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name: payload.first_name,
      last_name: payload.last_name,
      ...(payload.display_name ? { display_name: payload.display_name } : {}),
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    throwOnApiFailure(response, data, 'Unable to update profile.')
  }

  const contributor = readContributorFromProfileResponse(data)
  if (!contributor) {
    throw new Error('Profile updated but user data was missing from the response.')
  }

  return contributor
}

export type ChangeOwnPasswordPayload = {
  current_password: string
  new_password: string
}

export type ChangeOwnPasswordResponse = {
  success: boolean
  message?: string
}

export function mapChangePasswordError(
  error: unknown,
  translate: (key: string) => string,
): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return translate('profile.password.sessionExpired')
    }

    const code = (error.code ?? '').toUpperCase()
    if (
      code.includes('CURRENT_PASSWORD') ||
      code.includes('WRONG_PASSWORD') ||
      code.includes('INVALID_PASSWORD') ||
      code.includes('INVALID_CREDENTIALS')
    ) {
      return translate('profile.password.currentIncorrect')
    }

    if (
      code.includes('WEAK') ||
      code.includes('PASSWORD_TOO_SHORT') ||
      code.includes('PASSWORD_WEAK')
    ) {
      return translate('profile.password.tooWeak')
    }

    if (error.message?.trim()) {
      return error.message
    }
  }

  return translate('profile.password.saveFailed')
}

export async function changeOwnPassword(
  token: string,
  payload: ChangeOwnPasswordPayload,
): Promise<ChangeOwnPasswordResponse> {
  const baseUrl = getCoinArchiveApiBaseUrl()
  if (!baseUrl) {
    throw new Error('API base URL is not configured.')
  }

  const response = await coinArchiveFetch(`${baseUrl}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: payload.current_password,
      new_password: payload.new_password,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    throwOnApiFailure(response, data, 'Unable to change password.')
  }

  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}

  return {
    success: true,
    message: typeof record.message === 'string' ? record.message : undefined,
  }
}

export type AccountActivityEventSeverity = 'info' | 'success' | 'warning' | 'danger'

export type AccountActivitySummary = {
  active_sessions: number
  account_status: string
  role: string
  email_verified: boolean
}

export type AccountActivityEvent = {
  id: string
  type: string
  title: string
  description: string
  date: string
  severity: AccountActivityEventSeverity
}

export type AccountActivitySession = {
  id: string
  label: string
  created_at: string | null
  last_seen_at: string | null
  is_current: boolean
}

export type AccountActivityResponse = {
  summary: AccountActivitySummary
  events: AccountActivityEvent[]
  sessions: AccountActivitySession[]
}

const ACCOUNT_ACTIVITY_SEVERITIES = new Set<AccountActivityEventSeverity>([
  'info',
  'success',
  'warning',
  'danger',
])

function normalizeAccountActivitySeverity(value: unknown): AccountActivityEventSeverity {
  if (typeof value === 'string' && ACCOUNT_ACTIVITY_SEVERITIES.has(value as AccountActivityEventSeverity)) {
    return value as AccountActivityEventSeverity
  }
  return 'info'
}

function normalizeAccountActivitySummary(value: unknown): AccountActivitySummary {
  if (typeof value !== 'object' || value === null) {
    return {
      active_sessions: 0,
      account_status: '',
      role: '',
      email_verified: false,
    }
  }

  const record = value as Record<string, unknown>

  return {
    active_sessions:
      typeof record.active_sessions === 'number' && Number.isFinite(record.active_sessions)
        ? record.active_sessions
        : 0,
    account_status: typeof record.account_status === 'string' ? record.account_status : '',
    role: typeof record.role === 'string' ? record.role : '',
    email_verified: record.email_verified === true,
  }
}

function normalizeAccountActivityEvent(value: unknown, index: number): AccountActivityEvent | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const title = typeof record.title === 'string' ? record.title.trim() : ''
  if (!title) {
    return null
  }

  const id =
    typeof record.id === 'string' && record.id.trim()
      ? record.id.trim()
      : `event-${index}`

  return {
    id,
    type: typeof record.type === 'string' ? record.type : '',
    title,
    description: typeof record.description === 'string' ? record.description : '',
    date: typeof record.date === 'string' ? record.date : '',
    severity: normalizeAccountActivitySeverity(record.severity),
  }
}

function normalizeAccountActivitySession(value: unknown, index: number): AccountActivitySession | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const label = typeof record.label === 'string' ? record.label.trim() : ''
  if (!label) {
    return null
  }

  const id =
    typeof record.id === 'string' && record.id.trim()
      ? record.id.trim()
      : `session-${index}`

  return {
    id,
    label,
    created_at: typeof record.created_at === 'string' ? record.created_at : null,
    last_seen_at: typeof record.last_seen_at === 'string' ? record.last_seen_at : null,
    is_current: record.is_current === true,
  }
}

function normalizeAccountActivityResponse(data: unknown): AccountActivityResponse {
  if (typeof data !== 'object' || data === null) {
    return {
      summary: normalizeAccountActivitySummary(null),
      events: [],
      sessions: [],
    }
  }

  const record = data as Record<string, unknown>
  const eventsRaw = Array.isArray(record.events) ? record.events : []
  const sessionsRaw = Array.isArray(record.sessions) ? record.sessions : []

  return {
    summary: normalizeAccountActivitySummary(record.summary),
    events: eventsRaw
      .map((item, index) => normalizeAccountActivityEvent(item, index))
      .filter((item): item is AccountActivityEvent => item !== null),
    sessions: sessionsRaw
      .map((item, index) => normalizeAccountActivitySession(item, index))
      .filter((item): item is AccountActivitySession => item !== null),
  }
}

export async function getAccountActivity(token: string): Promise<AccountActivityResponse> {
  const baseUrl = getCoinArchiveApiBaseUrl()
  if (!baseUrl) {
    throw new ApiError('API base URL is not configured.', 0)
  }

  const response = await coinArchiveFetch(`${baseUrl}/auth/account-activity`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    throwOnApiFailure(response, data, 'Unable to load account activity. Please try again.')
  }

  return normalizeAccountActivityResponse(data)
}
