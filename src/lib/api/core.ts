import { resolveCoinArchiveApiBaseUrl } from '../apiBaseUrl'
import {
  parseApiError,
  resolveHttpStatus,
  type ApiDuplicateBlockInfo,
} from '../apiErrors'

export type { ApiDuplicateBlockInfo } from '../apiErrors'

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

export function getAdminApiKey(): string {
  const apiKey = import.meta.env.VITE_ADMIN_API_KEY
  if (!apiKey) {
    throw new ApiError('Admin API key is not configured.', 0)
  }
  return apiKey
}

export function getApiBaseUrl(): string {
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
