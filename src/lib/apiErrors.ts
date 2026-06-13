export type ApiDuplicateBlockInfo = {
  postId: number
  title: string
  reason: string
}

export type ParsedApiError = {
  message: string
  code?: string
  status?: number
  duplicate?: ApiDuplicateBlockInfo
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function readRecordString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return stripHtml(value)
    }
  }
  return undefined
}

export function readApiDuplicateBlockInfo(data: unknown): ApiDuplicateBlockInfo | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined
  }

  const record = data as Record<string, unknown>
  const nested =
    typeof record.data === 'object' && record.data !== null
      ? (record.data as Record<string, unknown>)
      : record
  const postId = nested.duplicate_post_id

  if (typeof postId !== 'number' || postId <= 0) {
    return undefined
  }

  return {
    postId,
    title: typeof nested.duplicate_title === 'string' ? nested.duplicate_title : '',
    reason: typeof nested.duplicate_reason === 'string' ? nested.duplicate_reason : '',
  }
}

export function resolveHttpStatus(responseStatus: number, data: unknown): number {
  if (typeof data !== 'object' || data === null) {
    return responseStatus
  }

  const record = data as Record<string, unknown>
  const nested =
    typeof record.data === 'object' && record.data !== null
      ? (record.data as Record<string, unknown>)
      : null

  for (const source of [nested, record]) {
    if (!source) continue
    const status = source.status
    if (typeof status === 'number' && Number.isFinite(status) && status >= 400) {
      return status
    }
  }

  return responseStatus
}

export function parseApiError(data: unknown, fallback: string): ParsedApiError {
  if (typeof data !== 'object' || data === null) {
    return { message: fallback }
  }

  const record = data as Record<string, unknown>
  const nested =
    typeof record.data === 'object' && record.data !== null
      ? (record.data as Record<string, unknown>)
      : null

  const code =
    readRecordString(record, ['code']) ??
    (nested ? readRecordString(nested, ['code']) : undefined)
  const duplicate = readApiDuplicateBlockInfo(record)
  const status = resolveHttpStatus(0, record)

  const message =
    readRecordString(record, ['message']) ??
    (nested ? readRecordString(nested, ['message']) : undefined) ??
    readRecordString(record, ['error'])

  if (message) {
    return {
      message,
      code,
      status: status || undefined,
      duplicate,
    }
  }

  return {
    message: fallback,
    code,
    status: status || undefined,
    duplicate,
  }
}

export async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('failed to fetch') || message.includes('network')
  }

  return false
}

export function getErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null
  }

  const status = (error as { status: unknown }).status
  return typeof status === 'number' && Number.isFinite(status) ? status : null
}

export function isAuthSessionError(error: unknown): boolean {
  const status = getErrorStatus(error)
  return status === 401 || status === 403
}

export function formatApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isNetworkError(error)) {
    return 'Cannot reach the server. Check your connection and try again.'
  }

  const status = getErrorStatus(error)

  if (status === 401 || status === 403) {
    return 'Your session expired or you are not authorized. Please log in again.'
  }

  if (status === 409) {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }
    return 'This action conflicts with the current server state.'
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  if (status === 0) {
    return 'Cannot reach the server. Check your connection and try again.'
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
