import type { CoinSubmission, CoinSubmissionDetail } from './api'
import {
  isApprovedSubmissionStatus,
  isNeedsRevisionSubmissionStatus,
  isRejectedSubmissionStatus,
} from './submissionStatus'

export type SubmissionRevisionInfo = {
  needsRevision: boolean
  notes: string[]
}

export type SubmissionRejectionInfo = {
  rejected: boolean
  notes: string[]
}

function collectStringNotes(candidates: unknown[]): string[] {
  const notes: string[] = []

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      notes.push(candidate.trim())
    }

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === 'string' && item.trim()) {
          notes.push(item.trim())
        }
      }
    }
  }

  return [...new Set(notes)]
}

function collectRevisionNotes(record: Record<string, unknown>): string[] {
  return collectStringNotes([
    record.admin_notes,
    record.revision_notes,
    record.review_notes,
    record.admin_feedback,
    record.contributor_feedback,
  ])
}

function collectRejectionNotes(record: Record<string, unknown>): string[] {
  return collectStringNotes([
    record.rejection_note,
    record.admin_feedback,
    record.admin_notes,
    record.review_notes,
  ])
}

export function getSubmissionRevisionInfo(
  submission: CoinSubmission | CoinSubmissionDetail,
): SubmissionRevisionInfo {
  const record = submission as CoinSubmission & Record<string, unknown>
  const notes = collectRevisionNotes(record)
  const needsRevision =
    isNeedsRevisionSubmissionStatus(submission.status) ||
    (notes.length > 0 &&
      !isRejectedSubmissionStatus(submission.status) &&
      !isApprovedSubmissionStatus(submission.status))

  return { needsRevision, notes }
}

export function getSubmissionRejectionInfo(
  submission: CoinSubmission | CoinSubmissionDetail,
): SubmissionRejectionInfo {
  const record = submission as CoinSubmission & Record<string, unknown>
  const notes = collectRejectionNotes(record)

  return {
    rejected: isRejectedSubmissionStatus(submission.status),
    notes,
  }
}

export type SubmissionStatusFeedbackType = 'needs_revision' | 'rejected'

export type SubmissionStatusFeedback = {
  type: SubmissionStatusFeedbackType
  notes: string[]
}

export function getSubmissionStatusFeedback(
  submission: CoinSubmission | CoinSubmissionDetail,
): SubmissionStatusFeedback | null {
  if (isNeedsRevisionSubmissionStatus(submission.status)) {
    return {
      type: 'needs_revision',
      notes: getSubmissionRevisionInfo(submission).notes,
    }
  }

  if (isRejectedSubmissionStatus(submission.status)) {
    return {
      type: 'rejected',
      notes: getSubmissionRejectionInfo(submission).notes,
    }
  }

  return null
}

export function formatSubmissionFeedbackNotes(notes: string[]): string {
  return notes.join('\n\n').trim()
}
