export type AuditItemSeverity = 'required' | 'recommended' | 'warning' | 'critical'

export type AuditItemCategory =
  | 'identity'
  | 'language'
  | 'images'
  | 'mint'
  | 'content'
  | 'duplicate'
  | 'seo'

export type AuditItem = {
  id: string
  labelKey: string
  descriptionKey?: string
  passed: boolean
  severity: AuditItemSeverity
  category: AuditItemCategory
}

export type AdminDataQualityStatus = 'excellent' | 'good' | 'needs_review' | 'critical'

export type AdminDataQualityAudit = {
  score: number
  status: AdminDataQualityStatus
  required: AuditItem[]
  recommended: AuditItem[]
  warnings: AuditItem[]
  blockers: AuditItem[]
  summary: {
    passedRequired: number
    totalRequired: number
    passedRecommended: number
    totalRecommended: number
  }
}

export type AdminDataQualityGuidanceKey = 'blockers' | 'warnings' | 'ready'
