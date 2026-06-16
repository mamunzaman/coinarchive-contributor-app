import type { CoinSubmission, CoinSubmissionDetail } from './api'

export type NormalizedSubmissionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'draft'
  | 'other'

const PENDING_STATUSES = new Set(['pending', 'pending_review'])
const APPROVED_STATUSES = new Set(['publish', 'published', 'approved'])
const REJECTED_STATUSES = new Set(['rejected', 'declined', 'failed', 'trash'])
const NEEDS_REVISION_STATUSES = new Set([
  'needs_revision',
  'needs_changes',
  'revision_requested',
])
const DRAFT_STATUSES = new Set(['draft', 'auto_draft'])

const ALLOWED_ACTION_ALIASES: Record<string, keyof AdminSubmissionAllowedActions> = {
  approve: 'approve',
  reject: 'reject',
  request_revision: 'requestRevision',
  requestrevision: 'requestRevision',
  reopen: 'reopenForReview',
  reopen_for_review: 'reopenForReview',
  reopenforreview: 'reopenForReview',
  update_rejection: 'updateRejectionFeedback',
  update_rejection_feedback: 'updateRejectionFeedback',
  updaterejectionfeedback: 'updateRejectionFeedback',
  can_edit: 'canEdit',
  canedit: 'canEdit',
}

export function normalizeSubmissionStatusRaw(status: string): string {
  return status.trim().toLowerCase().replace(/-/g, '_')
}

export function normalizeSubmissionStatus(status: string): NormalizedSubmissionStatus {
  const normalized = normalizeSubmissionStatusRaw(status)

  if (PENDING_STATUSES.has(normalized)) {
    return 'pending'
  }
  if (APPROVED_STATUSES.has(normalized)) {
    return 'approved'
  }
  if (REJECTED_STATUSES.has(normalized)) {
    return 'rejected'
  }
  if (NEEDS_REVISION_STATUSES.has(normalized)) {
    return 'needs_revision'
  }
  if (DRAFT_STATUSES.has(normalized)) {
    return 'draft'
  }

  return 'other'
}

export function isPendingSubmissionStatus(status: string): boolean {
  return normalizeSubmissionStatus(status) === 'pending'
}

export function isApprovedSubmissionStatus(status: string): boolean {
  return normalizeSubmissionStatus(status) === 'approved'
}

export function isRejectedSubmissionStatus(status: string): boolean {
  return normalizeSubmissionStatus(status) === 'rejected'
}

export function isNeedsRevisionSubmissionStatus(status: string): boolean {
  return normalizeSubmissionStatus(status) === 'needs_revision'
}

export function isDraftSubmissionStatus(status: string): boolean {
  return normalizeSubmissionStatus(status) === 'draft'
}

export function getSubmissionStatusLabelKey(status: string): string {
  switch (normalizeSubmissionStatus(status)) {
    case 'pending':
      return 'submissionStatus.pending'
    case 'approved':
      return 'submissionStatus.approved'
    case 'rejected':
      return 'submissionStatus.rejected'
    case 'needs_revision':
      return 'submissionStatus.needsRevision'
    case 'draft':
      return 'submissionStatus.draft'
    default:
      return 'submissionStatus.other'
  }
}

export type AdminReviewActionKey =
  | 'approve'
  | 'reject'
  | 'requestRevision'
  | 'reopenForReview'
  | 'updateRejectionFeedback'

export type AdminReviewActionState = {
  enabled: boolean
  reasonKey?: string
}

export type AdminReviewActionAvailability = Record<AdminReviewActionKey, AdminReviewActionState>

export type AdminSubmissionAllowedActions = {
  approve?: boolean
  reject?: boolean
  requestRevision?: boolean
  reopenForReview?: boolean
  updateRejectionFeedback?: boolean
  canEdit?: boolean
}

function normalizeAllowedActionKey(raw: string): keyof AdminSubmissionAllowedActions | null {
  const normalized = raw.trim().toLowerCase().replace(/-/g, '_')
  return ALLOWED_ACTION_ALIASES[normalized] ?? null
}

export function getSubmissionAllowedActions(
  submission: CoinSubmission | CoinSubmissionDetail,
): AdminSubmissionAllowedActions | null {
  const record = submission as CoinSubmission & Record<string, unknown>
  const raw = record.allowed_actions

  if (!raw) {
    return null
  }

  const parsed: AdminSubmissionAllowedActions = {}

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== 'string') continue
      const key = normalizeAllowedActionKey(item)
      if (key) parsed[key] = true
    }
    return Object.keys(parsed).length > 0 ? parsed : null
  }

  if (typeof raw === 'object' && raw !== null) {
    for (const [key, value] of Object.entries(raw)) {
      const mapped = normalizeAllowedActionKey(key)
      if (mapped && typeof value === 'boolean') {
        parsed[mapped] = value
      }
    }
    return Object.keys(parsed).length > 0 ? parsed : null
  }

  return null
}

function applyAllowedActionOverride(
  fallback: AdminReviewActionState,
  override: boolean | undefined,
): AdminReviewActionState {
  if (override === undefined) {
    return fallback
  }

  return override
    ? { enabled: true }
    : { enabled: false, reasonKey: fallback.reasonKey }
}

export function getAdminReviewActionAvailability(
  status: string,
  allowedActions?: AdminSubmissionAllowedActions | null,
): AdminReviewActionAvailability {
  const normalized = normalizeSubmissionStatus(status)
  let base: AdminReviewActionAvailability

  switch (normalized) {
    case 'approved':
      base = {
        approve: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.alreadyApproved' },
        reject: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.alreadyApproved' },
        requestRevision: { enabled: true },
        reopenForReview: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.alreadyApproved' },
        updateRejectionFeedback: {
          enabled: false,
          reasonKey: 'admin.reviewDesk.disabled.alreadyApproved',
        },
      }
      break
    case 'rejected':
      base = {
        approve: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.rejected' },
        reject: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.alreadyRejected' },
        requestRevision: { enabled: true },
        reopenForReview: { enabled: true },
        updateRejectionFeedback: { enabled: true },
      }
      break
    case 'needs_revision':
      base = {
        approve: { enabled: true },
        reject: { enabled: true },
        requestRevision: { enabled: true },
        reopenForReview: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus' },
        updateRejectionFeedback: {
          enabled: false,
          reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus',
        },
      }
      break
    case 'pending':
      base = {
        approve: { enabled: true },
        reject: { enabled: true },
        requestRevision: { enabled: true },
        reopenForReview: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus' },
        updateRejectionFeedback: {
          enabled: false,
          reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus',
        },
      }
      break
    default:
      base = {
        approve: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus' },
        reject: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus' },
        requestRevision: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus' },
        reopenForReview: { enabled: false, reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus' },
        updateRejectionFeedback: {
          enabled: false,
          reasonKey: 'admin.reviewDesk.disabled.unsupportedStatus',
        },
      }
  }

  if (!allowedActions) {
    return base
  }

  return {
    approve: applyAllowedActionOverride(base.approve, allowedActions.approve),
    reject: applyAllowedActionOverride(base.reject, allowedActions.reject),
    requestRevision: applyAllowedActionOverride(
      base.requestRevision,
      allowedActions.requestRevision,
    ),
    reopenForReview: applyAllowedActionOverride(
      base.reopenForReview,
      allowedActions.reopenForReview,
    ),
    updateRejectionFeedback: applyAllowedActionOverride(
      base.updateRejectionFeedback,
      allowedActions.updateRejectionFeedback,
    ),
  }
}

export function getPublishedCoinUrl(
  submission: CoinSubmission | CoinSubmissionDetail,
): string | null {
  const record = submission as CoinSubmission & Record<string, unknown>
  const candidates = [
    record.view_url,
    record.permalink,
    record.published_url,
    record.public_url,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

export function submissionCanEdit(
  submission: CoinSubmission | CoinSubmissionDetail,
): boolean {
  const record = submission as CoinSubmission & Record<string, unknown>

  if (typeof record.can_edit === 'boolean') {
    return record.can_edit
  }

  const allowedActions = getSubmissionAllowedActions(submission)
  if (typeof allowedActions?.canEdit === 'boolean') {
    return allowedActions.canEdit
  }

  return (
    isPendingSubmissionStatus(submission.status) ||
    isNeedsRevisionSubmissionStatus(submission.status)
  )
}
