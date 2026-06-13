import { parseSubmissionSeo } from './adminSeoApi'
import type { AdminSubmissionListItem } from './adminApi'
import {
  analyzeFocusKeyphrase,
  analyzeMetaDescription,
  analyzeSeoTitle,
  analyzeSlug,
} from './seoMetadata'
import type { SubmissionSeoData } from '../types/adminSeo'

export type AdminQueueSeoTone = 'neutral' | 'missing' | 'warn' | 'good'

export type AdminQueueSeoStatus = {
  tone: AdminQueueSeoTone
  score: number | null
  labelKey:
    | 'admin.queue.seoNotChecked'
    | 'admin.queue.seoMissing'
    | 'admin.queue.seoGood'
    | 'admin.queue.seoReady'
  labelParams?: { score: number }
}

function getRecordString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function hasRecordKey(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => key in record)
}

export function resolveListItemSeo(
  submission: AdminSubmissionListItem,
): { data: SubmissionSeoData | null; checked: boolean } {
  const record = submission as unknown as Record<string, unknown>
  const parsed =
    parseSubmissionSeo(submission.seo) ??
    parseSubmissionSeo(record.seo) ??
    parseSubmissionSeo(record.seo_data)

  if (parsed) {
    return { data: parsed, checked: true }
  }

  const fallbackKeys = [
    '_caes_seo_title',
    'caes_seo_title',
    'seo_title',
    '_caes_seo_description',
    'caes_seo_description',
    'seo_description',
    '_caes_seo_focus_keyword',
    'caes_seo_focus_keyword',
    'seo_focus_keyword',
    'seo_slug',
    'post_slug',
  ]

  if (!hasRecordKey(record, fallbackKeys)) {
    return { data: null, checked: false }
  }

  return {
    checked: true,
    data: {
      title: getRecordString(record, ['_caes_seo_title', 'caes_seo_title', 'seo_title']),
      metaDescription: getRecordString(record, [
        '_caes_seo_description',
        'caes_seo_description',
        'seo_description',
      ]),
      focusKeyphrase: getRecordString(record, [
        '_caes_seo_focus_keyword',
        'caes_seo_focus_keyword',
        'seo_focus_keyword',
      ]),
      slug: getRecordString(record, ['seo_slug', 'post_slug', 'slug']),
    },
  }
}

function computeSeoReadinessScore(seo: SubmissionSeoData): { score: number; hasContent: boolean } {
  const analyses = [
    analyzeSeoTitle(seo.title),
    analyzeMetaDescription(seo.metaDescription),
    analyzeFocusKeyphrase(seo.focusKeyphrase),
    analyzeSlug(seo.slug),
  ]

  let score = 0
  let hasContent = false

  for (const analysis of analyses) {
    if (analysis.level === 'empty') {
      continue
    }
    hasContent = true
    score += analysis.level === 'good' ? 25 : 15
  }

  return { score, hasContent }
}

export function getAdminQueueSeoStatus(submission: AdminSubmissionListItem): AdminQueueSeoStatus {
  const { data, checked } = resolveListItemSeo(submission)

  if (!checked || !data) {
    return {
      tone: 'neutral',
      score: null,
      labelKey: 'admin.queue.seoNotChecked',
    }
  }

  const { score, hasContent } = computeSeoReadinessScore(data)

  if (!hasContent) {
    return {
      tone: 'missing',
      score: 0,
      labelKey: 'admin.queue.seoMissing',
    }
  }

  if (score >= 85) {
    return {
      tone: 'good',
      score,
      labelKey: 'admin.queue.seoGood',
    }
  }

  return {
    tone: 'warn',
    score,
    labelKey: 'admin.queue.seoReady',
    labelParams: { score },
  }
}
