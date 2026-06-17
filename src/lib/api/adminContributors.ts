import { parseApiError, readJsonResponse } from '../apiErrors'
import { ApiError, coinArchiveFetch, getAdminApiKey, getApiBaseUrl } from './core'
import type { ContributorRole } from './auth'

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
