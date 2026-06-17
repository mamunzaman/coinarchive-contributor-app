import { ApiError, coinArchiveFetch, throwOnApiFailure } from '../lib/api'
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
