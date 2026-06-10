import type { DuplicateCheckStatus } from './duplicateCheck'
import {
  isExactDuplicateMatch,
  isSimilarDuplicateMatch,
  type DuplicateMatch,
} from './duplicateDetection'

export type DuplicateProtectionState =
  | 'EXACT_DUPLICATE'
  | 'SIMILAR_MATCH'
  | 'NO_MATCH'

export const DUPLICATE_PROTECTION_MESSAGES: Record<DuplicateProtectionState, string> = {
  EXACT_DUPLICATE: 'This coin already exists in CoinArchive and cannot be submitted again.',
  SIMILAR_MATCH: 'Similar coins were found. Please review before submitting.',
  NO_MATCH: 'No duplicate matches found.',
}

export const EXACT_DUPLICATE_SUBMIT_BLOCK_MESSAGE = DUPLICATE_PROTECTION_MESSAGES.EXACT_DUPLICATE

type ResolveDuplicateProtectionOptions = {
  canCheck?: boolean
  isChecking?: boolean
  hasError?: boolean
  checkStatus?: DuplicateCheckStatus
  exactUniqueCode?: boolean
  exactCoinCode?: boolean
}

export function resolveDuplicateProtectionState(
  matches: DuplicateMatch[],
  options: ResolveDuplicateProtectionOptions = {},
): DuplicateProtectionState | null {
  const { isChecking = false, hasError = false, canCheck = true } = options

  if (!canCheck || isChecking || hasError) {
    return null
  }

  if (
    options.exactUniqueCode ||
    options.exactCoinCode ||
    matches.some(isExactDuplicateMatch)
  ) {
    return 'EXACT_DUPLICATE'
  }

  if (matches.some(isSimilarDuplicateMatch)) {
    return 'SIMILAR_MATCH'
  }

  return 'NO_MATCH'
}

export function isSubmitBlockedByDuplicateProtection(
  state: DuplicateProtectionState | null,
): boolean {
  return state === 'EXACT_DUPLICATE'
}

export function getOwnSubmissionDetailHref(submissionId: number): string {
  return `/my-submissions/${submissionId}`
}
