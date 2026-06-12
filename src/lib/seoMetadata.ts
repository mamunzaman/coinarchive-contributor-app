import type { ContentLanguage } from '../types/coinForm'
import { coinFormValuesFromSubmission } from '../types/coinForm'
import type {
  SeoPreviewImage,
  SeoPreviewImageSource,
  SeoPreviewMode,
  SubmissionSeoData,
} from '../types/adminSeo'
import type { CoinSubmissionDetail } from './api'
import { getCountryDisplayLabel } from './countryLabels'
import { generateCoinPostSlug, resolveCoinPostTitle } from './coinTitle'

export const SEO_TITLE_MAX = 60
export const SEO_META_DESC_MIN = 120
export const SEO_META_DESC_MAX = 155
export const SEO_PREVIEW_BASE_URL = 'https://coinarchive.eu'

export type SeoMetadataDraft = {
  seoTitle: string
  metaDescription: string
  focusKeyphrase: string
  slug: string
}

export type CharacterLimitStatus = 'ok' | 'short' | 'long'
export type SeoAnalysisLevel = 'good' | 'warning' | 'empty'

export type SeoFieldAnalysis = {
  level: SeoAnalysisLevel
  counter: string
  wordCount?: number
}

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ')
}

function truncateAtWord(value: string, maxLength: number): string {
  const cleaned = collapseSpaces(value)
  if (cleaned.length <= maxLength) {
    return cleaned
  }

  let truncated = cleaned.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace >= Math.floor(maxLength * 0.6)) {
    truncated = truncated.slice(0, lastSpace)
  }

  return truncated.trimEnd()
}

export function clampSeoTitle(title: string): string {
  return truncateAtWord(title, SEO_TITLE_MAX)
}

export function generateSeoSlug(text: string): string {
  return generateCoinPostSlug(text)
}

export function getSeoTitleStatus(length: number): CharacterLimitStatus {
  return length > SEO_TITLE_MAX ? 'long' : 'ok'
}

export function getMetaDescriptionStatus(length: number): CharacterLimitStatus {
  if (length > SEO_META_DESC_MAX) {
    return 'long'
  }
  if (length > 0 && length < SEO_META_DESC_MIN) {
    return 'short'
  }
  return 'ok'
}

export function buildSeoPreviewUrl(slug: string): string {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '')
  return clean ? `${SEO_PREVIEW_BASE_URL}/${clean}/` : `${SEO_PREVIEW_BASE_URL}/`
}

function pickImageUrl(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function pickRefUrl(ref?: { url?: string } | null): string | null {
  return pickImageUrl(ref?.url)
}

/** Best coin image for SEO/social preview — uses existing submission detail fields only. */
export function resolveSeoPreviewImage(submission: CoinSubmissionDetail): SeoPreviewImage | null {
  const record = submission as CoinSubmissionDetail & {
    preview_image?: { url?: string } | null
  }

  const obverse =
    pickRefUrl(record.images?.obverse) ??
    pickImageUrl(record.obverse_url) ??
    pickImageUrl(record.default_obverse_url)

  if (obverse) {
    return { url: obverse, source: 'obverse' }
  }

  const featured =
    pickRefUrl(record.preview_image) ??
    pickImageUrl(record.thumbnail_url) ??
    pickImageUrl(record.image_url) ??
    pickImageUrl(record.default_image_url)

  if (featured) {
    return { url: featured, source: 'featured' }
  }

  const galleryFirst = Array.isArray(record.images?.gallery)
    ? record.images.gallery.find((item) => pickRefUrl(item))?.url
    : null
  const gallery = pickImageUrl(galleryFirst ?? null)

  if (gallery) {
    return { url: gallery, source: 'gallery' }
  }

  const reverse =
    pickRefUrl(record.images?.reverse) ??
    pickImageUrl(record.reverse_url) ??
    pickImageUrl(record.default_reverse_url)

  if (reverse) {
    return { url: reverse, source: 'reverse' }
  }

  return null
}

export function formatSeoPreviewDescription(description: string, mode: SeoPreviewMode): string {
  const trimmed = description.trim()
  if (!trimmed) {
    return ''
  }

  if (mode === 'mobile') {
    return truncateAtWord(trimmed, 96)
  }

  if (mode === 'tablet') {
    return truncateAtWord(trimmed, 132)
  }

  return trimmed
}

export type { SeoPreviewImageSource, SeoPreviewMode }

export function analyzeSeoTitle(title: string): SeoFieldAnalysis {
  const length = title.trim().length
  if (length === 0) {
    return { level: 'empty', counter: `0 / ${SEO_TITLE_MAX}` }
  }
  return {
    level: length > SEO_TITLE_MAX ? 'warning' : 'good',
    counter: `${length} / ${SEO_TITLE_MAX}`,
  }
}

export function analyzeMetaDescription(description: string): SeoFieldAnalysis {
  const length = description.trim().length
  if (length === 0) {
    return { level: 'empty', counter: `0 / ${SEO_META_DESC_MAX}` }
  }
  if (length > SEO_META_DESC_MAX) {
    return { level: 'warning', counter: `${length} / ${SEO_META_DESC_MAX}` }
  }
  if (length < SEO_META_DESC_MIN) {
    return { level: 'warning', counter: `${length} / ${SEO_META_DESC_MAX}` }
  }
  return { level: 'good', counter: `${length} / ${SEO_META_DESC_MAX}` }
}

export function analyzeFocusKeyphrase(keyphrase: string): SeoFieldAnalysis {
  const trimmed = keyphrase.trim()
  if (!trimmed) {
    return { level: 'empty', counter: '0', wordCount: 0 }
  }
  const wordCount = trimmed.split(/\s+/).length
  return { level: 'good', counter: String(wordCount), wordCount }
}

export function analyzeSlug(slug: string): SeoFieldAnalysis {
  const trimmed = slug.trim()
  if (!trimmed) {
    return { level: 'warning', counter: '—' }
  }
  const isClean = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)
  return {
    level: isClean ? 'good' : 'warning',
    counter: `${trimmed.length} chars`,
  }
}

function buildMetaDescription(submission: CoinSubmissionDetail, language: ContentLanguage): string {
  const short = collapseSpaces(submission.short_description ?? '')
  if (short.length >= 80) {
    return truncateAtWord(short, SEO_META_DESC_MAX)
  }

  const country =
    getCountryDisplayLabel(submission.country, language) || collapseSpaces(submission.country)
  const parts = [
    country,
    submission.year ? String(submission.year) : '',
    submission.denomination,
    submission.coin_type,
  ].filter(Boolean)

  const theme = collapseSpaces(submission.acf?.coin_theme ?? '')
  let description = parts.join(' · ')

  if (theme) {
    description = description ? `${description}. ${theme}` : theme
  } else if (short) {
    description = description ? `${description}. ${short}` : short
  } else {
    const obverse = collapseSpaces(stripHtml(submission.acf?.coin_obverse_description ?? ''))
    if (obverse) {
      description = description
        ? `${description}. ${truncateAtWord(obverse, 90)}`
        : truncateAtWord(obverse, SEO_META_DESC_MAX)
    }
  }

  if (!description) {
    description = collapseSpaces(submission.title)
  }

  return truncateAtWord(description, SEO_META_DESC_MAX)
}

function buildFocusKeyphrase(submission: CoinSubmissionDetail, language: ContentLanguage): string {
  const theme = collapseSpaces(submission.acf?.coin_theme ?? '')
  if (theme && theme.split(/\s+/).length <= 5) {
    return theme
  }

  const country =
    getCountryDisplayLabel(submission.country, language) || collapseSpaces(submission.country)
  return [country, submission.year ? String(submission.year) : '', submission.denomination]
    .filter(Boolean)
    .join(' ')
    .trim()
}

export function generateSeoMetadata(
  submission: CoinSubmissionDetail,
  language: ContentLanguage = submission.content_language === 'en' ? 'en' : 'de',
): SeoMetadataDraft {
  const values = coinFormValuesFromSubmission(submission)
  const resolvedTitle = collapseSpaces(submission.title) || resolveCoinPostTitle(values)
  const seoTitle = clampSeoTitle(resolvedTitle)
  const metaDescription = buildMetaDescription(submission, language)
  const focusKeyphrase = buildFocusKeyphrase(submission, language)
  const slug = generateSeoSlug(seoTitle || resolvedTitle)

  return {
    seoTitle,
    metaDescription,
    focusKeyphrase,
    slug,
  }
}

/** Prefer saved admin SEO from API when present; otherwise use generated draft. */
export function resolveSeoMetadataDraft(
  submission: CoinSubmissionDetail,
  language: ContentLanguage = submission.content_language === 'en' ? 'en' : 'de',
  savedSeo?: SubmissionSeoData | null,
): SeoMetadataDraft {
  const generated = generateSeoMetadata(submission, language)

  if (!savedSeo) {
    return generated
  }

  return {
    seoTitle: savedSeo.title.trim() || generated.seoTitle,
    metaDescription: savedSeo.metaDescription.trim() || generated.metaDescription,
    focusKeyphrase: savedSeo.focusKeyphrase.trim() || generated.focusKeyphrase,
    slug: savedSeo.slug.trim() || generated.slug,
  }
}
