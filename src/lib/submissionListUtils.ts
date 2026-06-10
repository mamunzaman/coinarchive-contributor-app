import type { CoinSubmission } from '../lib/api'

export type SubmissionViewMode = 'gallery' | 'table'

export type SubmissionStatusFilter = 'all' | 'pending' | 'needs_revision' | 'published' | 'drafts'

export type SubmissionSortOption = 'recent' | 'oldest' | 'title-asc' | 'title-desc'

function normalizeSubmissionStatus(status: string): string {
  return status.trim().toLowerCase().replace(/-/g, '_')
}

export function isNeedsRevisionStatus(status: string): boolean {
  return normalizeSubmissionStatus(status) === 'needs_revision'
}

export function isEditableSubmissionStatus(status: string): boolean {
  const normalized = normalizeSubmissionStatus(status)
  return normalized === 'pending' || normalized === 'needs_revision'
}

export function canEditSubmission(submission: CoinSubmission): boolean {
  return isEditableSubmissionStatus(submission.status)
}

export function getSubmissionEditLabel(submission: Pick<CoinSubmission, 'status'>): string {
  return isNeedsRevisionStatus(submission.status) ? 'Update submission' : 'Edit submission'
}

export function canDeleteSubmission(submission: Pick<CoinSubmission, 'status'>): boolean {
  return submission.status === 'pending'
}

export function getSubmissionPreviewUrl(submission: CoinSubmission): string | null {
  if (submission.preview_image?.url) {
    return submission.preview_image.url
  }

  if (submission.images?.obverse?.url) {
    return submission.images.obverse.url
  }

  if (submission.images?.reverse?.url) {
    return submission.images.reverse.url
  }

  if (submission.images?.gallery?.[0]?.url) {
    return submission.images.gallery[0].url
  }

  const record = submission as CoinSubmission & {
    thumbnail_url?: string | null
    obverse_url?: string | null
    image_url?: string | null
  }

  return record.thumbnail_url ?? record.obverse_url ?? record.image_url ?? null
}

export function matchesStatusFilter(submission: CoinSubmission, filter: SubmissionStatusFilter): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'pending') {
    return submission.status === 'pending'
  }

  if (filter === 'needs_revision') {
    return isNeedsRevisionStatus(submission.status)
  }

  if (filter === 'drafts') {
    return submission.status === 'draft'
  }

  return submission.status === 'publish' || submission.status === 'published'
}

export function matchesSearchQuery(submission: CoinSubmission, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return (
    submission.title.toLowerCase().includes(normalized) ||
    submission.id.toString().includes(normalized)
  )
}

function parseSubmissionDate(date: string): number {
  const parsed = new Date(date.includes('T') ? date : date.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

export function filterAndSortSubmissions(
  submissions: CoinSubmission[],
  options: {
    query: string
    statusFilter: SubmissionStatusFilter
    sort: SubmissionSortOption
  },
): CoinSubmission[] {
  const filtered = submissions.filter(
    (submission) =>
      matchesSearchQuery(submission, options.query) &&
      matchesStatusFilter(submission, options.statusFilter),
  )

  return [...filtered].sort((left, right) => {
    switch (options.sort) {
      case 'oldest':
        return parseSubmissionDate(left.date) - parseSubmissionDate(right.date)
      case 'title-asc':
        return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
      case 'title-desc':
        return right.title.localeCompare(left.title, undefined, { sensitivity: 'base' })
      case 'recent':
      default:
        return parseSubmissionDate(right.date) - parseSubmissionDate(left.date)
    }
  })
}
