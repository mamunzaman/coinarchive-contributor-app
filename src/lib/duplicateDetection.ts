import type { CoinSubmissionDetail } from './api'
import type { CoinFormValues } from '../types/coinForm'

export type DuplicateMatch = {
  id: number
  title: string
  year: number | string
  country: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function isDuplicateMatchForm(
  values: Pick<CoinFormValues, 'country' | 'year' | 'denomination' | 'coin_type'>,
  submission: Pick<CoinSubmissionDetail, 'country' | 'year' | 'denomination' | 'coin_type'>,
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

  return (
    normalize(values.country) === normalize(submission.country) &&
    yearValue === Number(submission.year) &&
    normalize(values.denomination) === normalize(submission.denomination) &&
    normalize(values.coin_type) === normalize(submission.coin_type)
  )
}

export function findDuplicateMatches(
  values: Pick<CoinFormValues, 'country' | 'year' | 'denomination' | 'coin_type'>,
  submissions: CoinSubmissionDetail[],
  excludeSubmissionId?: number,
): DuplicateMatch[] {
  return submissions
    .filter((submission) => submission.id !== excludeSubmissionId)
    .filter((submission) => isDuplicateMatchForm(values, submission))
    .map((submission) => ({
      id: submission.id,
      title: submission.title,
      year: submission.year,
      country: submission.country,
    }))
}
