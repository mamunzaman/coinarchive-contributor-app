import { parseApiError, readJsonResponse } from '../apiErrors'
import { ApiError, coinArchiveFetch, getApiBaseUrl } from './core'

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

function getLoginErrorMessage(code: string | undefined, fallback: string): string {
  if (code && LOGIN_ERROR_MESSAGES[code]) {
    return LOGIN_ERROR_MESSAGES[code]
  }
  return fallback
}
