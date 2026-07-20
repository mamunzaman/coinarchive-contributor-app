import type { AdminSubmissionListItem, AdminSubmissionsResponse } from './adminApi'

export class AdminSubmissionsResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminSubmissionsResponseError'
  }
}

export type NormalizeAdminSubmissionsResult = {
  response: AdminSubmissionsResponse & { total?: number }
  skippedCount: number
  rawStats: unknown
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readOptionalString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return ''
}

function readOptionalFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function readStatus(record: Record<string, unknown>): string {
  const candidates = [record.status, record.submission_status, record.post_status]
  for (const candidate of candidates) {
    const value = readOptionalString(candidate).trim()
    if (value) {
      return value
    }
  }
  return 'unknown'
}

function readContributorFields(record: Record<string, unknown>): Partial<AdminSubmissionListItem> {
  const nested = asRecord(record.contributor)
  const contributorId =
    readOptionalFiniteNumber(record.contributor_id) ??
    readOptionalFiniteNumber(nested?.id)
  const contributorName =
    readOptionalString(record.contributor_name) ||
    readOptionalString(nested?.name) ||
    readOptionalString(nested?.display_name)
  const contributorEmail =
    readOptionalString(record.contributor_email) || readOptionalString(nested?.email)

  const fields: Partial<AdminSubmissionListItem> = {}
  if (contributorId !== undefined) {
    fields.contributor_id = contributorId
  }
  if (contributorName) {
    fields.contributor_name = contributorName
  }
  if (contributorEmail) {
    fields.contributor_email = contributorEmail
  }
  if (nested) {
    fields.contributor = {
      id: contributorId,
      name: contributorName || undefined,
      email: contributorEmail || undefined,
    }
  }
  return fields
}

/** Normalize one admin list item. Returns null when the record cannot be shown safely. */
export function normalizeAdminSubmissionListItem(raw: unknown): AdminSubmissionListItem | null {
  const record = asRecord(raw)
  if (!record) {
    return null
  }

  const id = readOptionalFiniteNumber(record.id)
  if (id === undefined || id <= 0) {
    return null
  }

  const title = readOptionalString(record.title)
  const date = readOptionalString(record.date)
  const modifiedDate = readOptionalString(record.modified_date)
  const status = readStatus(record)

  const normalized: AdminSubmissionListItem = {
    ...(record as AdminSubmissionListItem),
    id,
    title,
    status,
    date,
    ...readContributorFields(record),
  }

  if (modifiedDate) {
    normalized.modified_date = modifiedDate
  }

  return normalized
}

export function normalizeAdminSubmissionsResponse(data: unknown): NormalizeAdminSubmissionsResult {
  if (data === null || data === undefined) {
    throw new AdminSubmissionsResponseError(
      'Admin submissions returned an empty or non-JSON response.',
    )
  }

  const record = asRecord(data)
  if (!record) {
    throw new AdminSubmissionsResponseError(
      'Admin submissions returned an invalid response shape.',
    )
  }

  const rawSubmissions = record.submissions
  if (rawSubmissions !== undefined && rawSubmissions !== null && !Array.isArray(rawSubmissions)) {
    throw new AdminSubmissionsResponseError(
      'Admin submissions response is missing a valid submissions list.',
    )
  }

  const list = Array.isArray(rawSubmissions) ? rawSubmissions : []
  const submissions: AdminSubmissionListItem[] = []
  let skippedCount = 0

  for (const entry of list) {
    try {
      const item = normalizeAdminSubmissionListItem(entry)
      if (item) {
        submissions.push(item)
      } else {
        skippedCount += 1
      }
    } catch {
      skippedCount += 1
    }
  }

  const total = readOptionalFiniteNumber(record.total)

  return {
    response: {
      success: record.success === undefined ? true : Boolean(record.success),
      submissions,
      ...(total !== undefined ? { total } : {}),
    },
    skippedCount,
    rawStats: record.stats,
  }
}
