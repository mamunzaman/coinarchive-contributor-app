import type { CoinSubmissionDetail } from './api'
import type { CoinFormValues } from '../types/coinForm'

export type DuplicateMatchTier = 'published' | 'pending' | 'rejected' | 'draft'

export type DuplicateMatch = {
  id: number
  title: string
  year: number | string
  country: string
  status?: string
  mintMark?: string
  tier: DuplicateMatchTier
}

export type DuplicateIdentityValues = Pick<
  CoinFormValues,
  'country' | 'year' | 'denomination' | 'coin_type' | 'singleMintMark' | 'hasMintVariants'
>

export type CategorizedDuplicateMatches = {
  warningMatches: DuplicateMatch[]
  draftMatches: DuplicateMatch[]
  referenceMatches: DuplicateMatch[]
  allMatches: DuplicateMatch[]
}

const PUBLISHED_STATUSES = new Set(['publish', 'published', 'approved'])
const PENDING_STATUSES = new Set(['pending', 'submitted'])
const REJECTED_STATUSES = new Set([
  'rejected',
  'declined',
  'failed',
  'trash',
  'needs_revision',
  'needs-revision',
  'needs_changes',
  'needs-changes',
])

const TIER_PRIORITY: Record<DuplicateMatchTier, number> = {
  published: 0,
  pending: 1,
  rejected: 2,
  draft: 3,
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeStatus(status: string | undefined): string {
  return (status ?? '').trim().toLowerCase().replace(/-/g, '_')
}

export function getDuplicateMatchTier(status: string | undefined): DuplicateMatchTier {
  const normalized = normalizeStatus(status)

  if (normalized === 'draft') {
    return 'draft'
  }

  if (PUBLISHED_STATUSES.has(normalized)) {
    return 'published'
  }

  if (PENDING_STATUSES.has(normalized)) {
    return 'pending'
  }

  if (REJECTED_STATUSES.has(normalized)) {
    return 'rejected'
  }

  return 'pending'
}

export function isWarningDuplicateMatch(match: DuplicateMatch): boolean {
  return match.tier === 'published' || match.tier === 'pending'
}

export function isDraftDuplicateMatch(match: DuplicateMatch): boolean {
  return match.tier === 'draft'
}

export function isReferenceDuplicateMatch(match: DuplicateMatch): boolean {
  return match.tier === 'rejected'
}

export function sortDuplicateMatchesByPriority(matches: DuplicateMatch[]): DuplicateMatch[] {
  return [...matches].sort((left, right) => TIER_PRIORITY[left.tier] - TIER_PRIORITY[right.tier])
}

export function categorizeDuplicateMatches(matches: DuplicateMatch[]): CategorizedDuplicateMatches {
  const warningMatches: DuplicateMatch[] = []
  const draftMatches: DuplicateMatch[] = []
  const referenceMatches: DuplicateMatch[] = []

  for (const match of sortDuplicateMatchesByPriority(matches)) {
    if (isWarningDuplicateMatch(match)) {
      warningMatches.push(match)
    } else if (isDraftDuplicateMatch(match)) {
      draftMatches.push(match)
    } else if (isReferenceDuplicateMatch(match)) {
      referenceMatches.push(match)
    }
  }

  return {
    warningMatches,
    draftMatches,
    referenceMatches,
    allMatches: sortDuplicateMatchesByPriority(matches),
  }
}

export function getDuplicateMatchHref(match: DuplicateMatch): string {
  return `/my-submissions/${match.id}/edit`
}

export function getFormMintMark(values: DuplicateIdentityValues): string {
  if (values.hasMintVariants) {
    return ''
  }

  return normalize(values.singleMintMark)
}

export function getSubmissionMintMark(submission: CoinSubmissionDetail): string {
  const acf = submission.acf
  return normalize(acf?.single_mint_mark ?? acf?.coin_single_mint_mark ?? '')
}

export function isDuplicateMatchForm(
  values: DuplicateIdentityValues,
  submission: CoinSubmissionDetail,
): boolean {
  if (
    !values.country.trim() ||
    !values.year.trim() ||
    !values.denomination.trim() ||
    !values.coin_type.trim()
  ) {
    return false
  }

  const yearValue = Number.parseInt(values.year, 10)
  if (Number.isNaN(yearValue) || yearValue <= 0) {
    return false
  }

  if (
    normalize(values.country) !== normalize(submission.country) ||
    yearValue !== Number(submission.year) ||
    normalize(values.denomination) !== normalize(submission.denomination) ||
    normalize(values.coin_type) !== normalize(submission.coin_type)
  ) {
    return false
  }

  const formMint = getFormMintMark(values)
  const submissionMint = getSubmissionMintMark(submission)

  if (formMint && submissionMint && formMint !== submissionMint) {
    return false
  }

  return true
}

export function findDuplicateMatches(
  values: DuplicateIdentityValues,
  submissions: CoinSubmissionDetail[],
  excludeSubmissionId?: number,
): DuplicateMatch[] {
  return submissions
    .filter((submission) => submission.id !== excludeSubmissionId)
    .filter((submission) => isDuplicateMatchForm(values, submission))
    .map((submission) => {
      const submissionMint = getSubmissionMintMark(submission)

      return {
        id: submission.id,
        title: submission.title,
        year: submission.year,
        country: submission.country,
        status: submission.status,
        mintMark: submissionMint || undefined,
        tier: getDuplicateMatchTier(submission.status),
      }
    })
}
