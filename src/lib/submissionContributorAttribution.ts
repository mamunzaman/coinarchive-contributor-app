import type { SubmissionContributorAttribution } from './api'

export type { SubmissionContributorAttribution } from './api'

export type ContributorAttributionSource = {
  contributor?: SubmissionContributorAttribution | null
  contributor_id?: number | null
  contributor_name?: string | null
  contributor_email?: string | null
  submitted_by?: {
    contributor_id?: number | null
    email?: string | null
  } | null
}

export const UNKNOWN_CONTRIBUTOR_LABEL = 'Unknown'

export function resolveSubmissionContributor(
  source: ContributorAttributionSource,
): SubmissionContributorAttribution {
  const nested = source.contributor
  const name = nested?.name?.trim() || source.contributor_name?.trim() || ''
  const email =
    nested?.email?.trim() ||
    source.contributor_email?.trim() ||
    source.submitted_by?.email?.trim() ||
    ''
  const id =
    nested?.id ??
    source.contributor_id ??
    source.submitted_by?.contributor_id ??
    undefined

  return {
    id: typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : undefined,
    name: name || undefined,
    email: email || undefined,
  }
}

export function getContributorDisplayName(
  attribution: SubmissionContributorAttribution,
): string {
  if (attribution.name?.trim()) {
    return attribution.name.trim()
  }

  const email = attribution.email?.trim()
  if (email) {
    const username = email.split('@')[0]?.trim()
    if (username) {
      return username
    }
  }

  return UNKNOWN_CONTRIBUTOR_LABEL
}

export function getContributorSearchText(source: ContributorAttributionSource): string {
  const attribution = resolveSubmissionContributor(source)
  return [attribution.name, attribution.email, source.contributor_name, source.contributor_email]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
    .toLowerCase()
}
