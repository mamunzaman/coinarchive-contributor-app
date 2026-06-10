import { computeCompletenessScore } from './completenessScore'
import { loadFormDraft, listSavedDrafts } from './formDraftStorage'
import type { CoinSubmission } from './api'
import type { CoinFormValues } from '../types/coinForm'

export type QualityAlert = {
  id: string
  submissionId?: number
  draftKey?: string
  title: string
  message: string
  severity: 'warning' | 'critical'
  href: string
}

const SHORT_DESCRIPTION_MIN = 40
const NEEDS_ATTENTION_STATUSES = new Set([
  'needs_revision',
  'needs-revision',
  'needs_changes',
  'needs-changes',
  'rejected',
  'declined',
])

function hasGallery(submission: CoinSubmission): boolean {
  const gallery = submission.images?.gallery ?? []
  return gallery.length > 0
}

function hasObverse(submission: CoinSubmission): boolean {
  return Boolean(submission.images?.obverse?.url ?? submission.preview_image?.url)
}

function hasReverse(submission: CoinSubmission): boolean {
  return Boolean(submission.images?.reverse?.url)
}

function buildDraftAlerts(): QualityAlert[] {
  const alerts: QualityAlert[] = []

  for (const entry of listSavedDrafts()) {
    const draft = loadFormDraft(entry.key)
    if (!draft) {
      continue
    }

    const values = draft.values
    const hasObverseImage = Boolean(draft.obverseFile)
    const hasReverseImage = Boolean(draft.reverseFile)
    const hasGalleryImages = draft.galleryFiles.length > 0
    const completeness = computeCompletenessScore({
      values,
      hasObverse: hasObverseImage,
      hasReverse: hasReverseImage,
      hasGallery: hasGalleryImages,
    })

    const href =
      entry.kind === 'new' ? '/new-coin' : `/my-submissions/${entry.submissionId}/edit`
    const baseId = entry.key

    pushDraftAlert(alerts, baseId, 'reverse', href, entry.title, !hasReverseImage, 'Missing reverse image')
    pushDraftAlert(alerts, baseId, 'gallery', href, entry.title, !hasGalleryImages, 'Missing gallery images')
    pushDraftAlert(
      alerts,
      baseId,
      'mint',
      href,
      entry.title,
      !hasMintInfo(values),
      'Missing mint information',
    )
    pushDraftAlert(
      alerts,
      baseId,
      'description',
      href,
      entry.title,
      values.short_description.trim().length > 0 &&
        values.short_description.trim().length < SHORT_DESCRIPTION_MIN,
      'Short description too short',
    )
    pushDraftAlert(
      alerts,
      baseId,
      'completeness',
      href,
      entry.title,
      completeness.score < 60,
      `Low completeness score (${completeness.score}%)`,
    )
  }

  return alerts
}

function pushDraftAlert(
  alerts: QualityAlert[],
  baseId: string,
  suffix: string,
  href: string,
  title: string,
  condition: boolean,
  message: string,
) {
  if (!condition) {
    return
  }

  alerts.push({
    id: `${baseId}-${suffix}`,
    draftKey: baseId,
    title,
    message,
    severity: suffix === 'reverse' ? 'critical' : 'warning',
    href,
  })
}

function hasMintInfo(values: CoinFormValues): boolean {
  if (values.hasMintVariants) {
    return values.mintVariants.some(
      (row) => row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim(),
    )
  }

  return Boolean(values.singleMintMark.trim())
}

export function buildQualityAlerts(submissions: CoinSubmission[]): QualityAlert[] {
  const alerts: QualityAlert[] = [...buildDraftAlerts()]

  for (const submission of submissions) {
    const normalizedStatus = submission.status.trim().toLowerCase()
    if (NEEDS_ATTENTION_STATUSES.has(normalizedStatus)) {
      alerts.push({
        id: `submission-${submission.id}-review-decision`,
        submissionId: submission.id,
        title: submission.title,
        message: normalizedStatus === 'rejected' || normalizedStatus === 'declined'
          ? 'Submission was rejected'
          : 'Revision requested',
        severity: 'critical',
        href: `/my-submissions/${submission.id}/edit`,
      })
      continue
    }

    if (submission.status !== 'pending' && submission.status !== 'draft') {
      continue
    }

    const href = `/my-submissions/${submission.id}/edit`
    const baseId = `submission-${submission.id}`

    if (!hasReverse(submission)) {
      alerts.push({
        id: `${baseId}-reverse`,
        submissionId: submission.id,
        title: submission.title,
        message: 'Missing reverse image',
        severity: 'critical',
        href,
      })
    }

    if (!hasGallery(submission)) {
      alerts.push({
        id: `${baseId}-gallery`,
        submissionId: submission.id,
        title: submission.title,
        message: 'Missing gallery images',
        severity: 'warning',
        href,
      })
    }

    if (!hasObverse(submission)) {
      alerts.push({
        id: `${baseId}-obverse`,
        submissionId: submission.id,
        title: submission.title,
        message: 'Missing obverse image',
        severity: 'critical',
        href,
      })
    }
  }

  return alerts.slice(0, 12)
}
