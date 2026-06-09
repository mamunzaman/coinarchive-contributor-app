import type { AdminSubmissionListItem } from './adminApi'

export type AdminQueueStatusFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'draft'

export type AdminQueueSortOption =
  | 'newest'
  | 'oldest'
  | 'contributor-az'
  | 'country-az'
  | 'status'

export type AdminQueueCounts = Record<AdminQueueStatusFilter, number>

const NEEDS_REVISION_STATUSES = new Set([
  'needs_revision',
  'needs-revision',
  'needs_changes',
  'needs-changes',
])

const REJECTED_STATUSES = new Set(['rejected', 'declined', 'failed', 'trash'])

const APPROVED_STATUSES = new Set(['publish', 'published', 'approved'])

function parseSubmissionDate(date: string): number {
  const parsed = new Date(date.includes('T') ? date : date.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

export function getAdminSubmissionCountry(submission: AdminSubmissionListItem): string {
  return (submission.country ?? '').trim()
}

export function getSubmissionUpdatedAt(submission: AdminSubmissionListItem): string {
  return submission.modified_date ?? submission.date
}

export function getSubmissionCoinCode(submission: AdminSubmissionListItem): string {
  if (submission.coin_code?.trim()) {
    return submission.coin_code.trim()
  }

  return ''
}

export function getAdminQueueStatusCategory(
  status: string,
): Exclude<AdminQueueStatusFilter, 'all'> | 'other' {
  if (status === 'pending') {
    return 'pending'
  }

  if (status === 'draft') {
    return 'draft'
  }

  if (APPROVED_STATUSES.has(status)) {
    return 'approved'
  }

  if (NEEDS_REVISION_STATUSES.has(status)) {
    return 'needs_revision'
  }

  if (REJECTED_STATUSES.has(status)) {
    return 'rejected'
  }

  return 'other'
}

export function isPendingAdminSubmission(submission: AdminSubmissionListItem): boolean {
  return submission.status === 'pending'
}

export function matchesAdminQueueStatusFilter(
  submission: AdminSubmissionListItem,
  filter: AdminQueueStatusFilter,
): boolean {
  if (filter === 'all') {
    return true
  }

  return getAdminQueueStatusCategory(submission.status) === filter
}

export function computeAdminQueueCounts(submissions: AdminSubmissionListItem[]): AdminQueueCounts {
  const counts: AdminQueueCounts = {
    all: submissions.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    needs_revision: 0,
    draft: 0,
  }

  for (const submission of submissions) {
    const category = getAdminQueueStatusCategory(submission.status)
    if (category !== 'other') {
      counts[category] += 1
    }
  }

  return counts
}

export function getAdminQueueCountries(submissions: AdminSubmissionListItem[]): string[] {
  const countries = new Set<string>()

  for (const submission of submissions) {
    const country = getAdminSubmissionCountry(submission)
    if (country) {
      countries.add(country)
    }
  }

  return [...countries].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
}

export function matchesAdminQueueSearch(
  submission: AdminSubmissionListItem,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  const coinCode = getSubmissionCoinCode(submission).toLowerCase()
  const year = submission.year != null ? String(submission.year) : ''

  return (
    submission.title.toLowerCase().includes(normalizedQuery) ||
    submission.id.toString().includes(normalizedQuery) ||
    (submission.contributor_name ?? '').toLowerCase().includes(normalizedQuery) ||
    (submission.contributor_email ?? '').toLowerCase().includes(normalizedQuery) ||
    getAdminSubmissionCountry(submission).toLowerCase().includes(normalizedQuery) ||
    year.includes(normalizedQuery) ||
    coinCode.includes(normalizedQuery)
  )
}

export function filterAdminQueueSubmissions(
  submissions: AdminSubmissionListItem[],
  options: {
    query: string
    statusFilter: AdminQueueStatusFilter
    countryFilter: string
  },
): AdminSubmissionListItem[] {
  return submissions.filter((submission) => {
    if (!matchesAdminQueueStatusFilter(submission, options.statusFilter)) {
      return false
    }

    if (
      options.countryFilter &&
      getAdminSubmissionCountry(submission).toLowerCase() !== options.countryFilter.toLowerCase()
    ) {
      return false
    }

    return matchesAdminQueueSearch(submission, options.query)
  })
}

export function sortAdminQueueSubmissions(
  submissions: AdminSubmissionListItem[],
  sort: AdminQueueSortOption,
): AdminSubmissionListItem[] {
  return [...submissions].sort((left, right) => {
    switch (sort) {
      case 'oldest':
        return parseSubmissionDate(getSubmissionUpdatedAt(left)) - parseSubmissionDate(getSubmissionUpdatedAt(right))
      case 'contributor-az': {
        const leftName = (left.contributor_name ?? left.contributor_email ?? left.title).toLowerCase()
        const rightName = (right.contributor_name ?? right.contributor_email ?? right.title).toLowerCase()
        return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' })
      }
      case 'country-az': {
        const leftCountry = (left.country ?? '').toLowerCase()
        const rightCountry = (right.country ?? '').toLowerCase()
        return leftCountry.localeCompare(rightCountry, undefined, { sensitivity: 'base' })
      }
      case 'status':
        return left.status.localeCompare(right.status, undefined, { sensitivity: 'base' })
      case 'newest':
      default:
        return parseSubmissionDate(getSubmissionUpdatedAt(right)) - parseSubmissionDate(getSubmissionUpdatedAt(left))
    }
  })
}

export function getContributorLabel(submission: AdminSubmissionListItem): string {
  if (submission.contributor_name?.trim()) {
    return submission.contributor_name.trim()
  }

  if (submission.contributor_email?.trim()) {
    return submission.contributor_email.trim()
  }

  return '—'
}
