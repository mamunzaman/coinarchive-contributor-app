import { coinArchiveFetch, throwOnApiFailure } from '../lib/api'
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
