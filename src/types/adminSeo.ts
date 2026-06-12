/** Admin-only SEO data returned on GET /admin/submissions/:id. */
export type SubmissionSeoData = {
  title: string
  metaDescription: string
  focusKeyphrase: string
  slug: string
}

export type SeoProviderActive = 'yoast' | 'rankmath' | 'none'

export type SeoProviderInfo = {
  active: SeoProviderActive
  label: string
  supported: boolean
}

export const DEFAULT_SEO_PROVIDER: SeoProviderInfo = {
  active: 'yoast',
  label: 'Yoast SEO',
  supported: true,
}

export type SeoPreviewMode = 'desktop' | 'tablet' | 'mobile'

export type SeoPreviewImageSource = 'obverse' | 'featured' | 'gallery' | 'reverse' | null

export type SeoPreviewImage = {
  url: string
  source: SeoPreviewImageSource
}

/** Payload for POST /admin/submissions/:id/seo. */
export type UpdateSubmissionSeoPayload = {
  seoTitle: string
  metaDescription: string
  focusKeyphrase: string
  slug: string
  applySlug: boolean
}

export type UpdateSubmissionSeoResponse = {
  success: boolean
  message?: string
  seo: SubmissionSeoData
  seoProvider?: SeoProviderInfo
}

export function parseSeoProvider(raw: unknown): SeoProviderInfo | null {
  if (typeof raw !== 'object' || raw === null) {
    return null
  }

  const record = raw as Record<string, unknown>
  const active = record.active

  if (active !== 'yoast' && active !== 'rankmath' && active !== 'none') {
    return null
  }

  const label = typeof record.label === 'string' ? record.label.trim() : ''
  if (!label) {
    return null
  }

  return {
    active,
    label,
    supported: record.supported === true,
  }
}

export function resolveSeoProvider(raw: unknown): SeoProviderInfo {
  return parseSeoProvider(raw) ?? DEFAULT_SEO_PROVIDER
}

export function isFallbackSeoProvider(provider: SeoProviderInfo): boolean {
  return provider.active === 'none' || !provider.supported
}
