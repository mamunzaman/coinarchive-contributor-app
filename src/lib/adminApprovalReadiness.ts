import type { AuditItem, AuditItemCategory, AdminDataQualityAudit } from '../types/adminDataQualityAudit'
import { getAdminDataQualityGuidanceKey } from './adminDataQualityAudit'

const CATEGORY_SCROLL_TARGETS: Record<AuditItemCategory, string> = {
  identity: 'review-info',
  language: 'review-info',
  images: 'review-images',
  mint: 'review-mint',
  content: 'review-data',
  duplicate: 'approval-duplicate-status',
  seo: 'admin-seo-preview',
}

const ITEM_SCROLL_TARGETS: Partial<Record<string, string>> = {
  galleryImage: 'review-gallery',
  seoSaved: 'admin-seo-preview',
  seoSlug: 'admin-seo-preview',
  duplicateStatus: 'approval-duplicate-status',
  similarDuplicate: 'approval-duplicate-status',
  reverseImage: 'review-images',
  obverseImage: 'review-images',
}

const HIGHLIGHT_CLASS = 'approval-readiness-target--highlight'

export function resolveAuditItemScrollTarget(item: AuditItem): string {
  return ITEM_SCROLL_TARGETS[item.id] ?? CATEGORY_SCROLL_TARGETS[item.category]
}

export function scrollToApprovalTarget(targetId: string): void {
  const element = document.getElementById(targetId)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1')
  }

  element.focus({ preventScroll: true })
  element.classList.add(HIGHLIGHT_CLASS)

  window.setTimeout(() => {
    element.classList.remove(HIGHLIGHT_CLASS)
  }, 1600)
}

export type ApprovalReadinessBadgeKey = 'ready' | 'needs_attention'

export function getApprovalReadinessBadgeKey(audit: AdminDataQualityAudit): ApprovalReadinessBadgeKey {
  if (audit.blockers.length > 0) return 'needs_attention'
  if (audit.status === 'critical' || audit.status === 'needs_review') return 'needs_attention'
  if (getAdminDataQualityGuidanceKey(audit) !== 'ready') return 'needs_attention'
  return 'ready'
}

export function collectPassedAuditItems(audit: AdminDataQualityAudit): AuditItem[] {
  return [...audit.required, ...audit.recommended, ...audit.warnings].filter((entry) => entry.passed)
}

export function collectRecommendedImprovements(audit: AdminDataQualityAudit): AuditItem[] {
  return [
    ...audit.recommended.filter((entry) => !entry.passed),
    ...audit.warnings.filter((entry) => !entry.passed),
  ]
}

export function collectCriticalIssues(audit: AdminDataQualityAudit): AuditItem[] {
  return audit.blockers
}
