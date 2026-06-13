export type AdminQueueQualityMeta = {
  percent?: number
}

export type AdminQueueAuditMeta = {
  score?: number
}

export type AdminQueueReadinessFields = {
  completeness_score?: number
  readiness_score?: number
  quality_score?: number
  data_quality_score?: number
  review_readiness?: number
  required_missing?: boolean
  missing_required_fields?: string[]
  quality?: AdminQueueQualityMeta
  audit?: AdminQueueAuditMeta
}
