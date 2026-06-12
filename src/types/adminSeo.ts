/** Admin-only SEO data returned on GET /admin/submissions/:id (future plugin support). */
export type SubmissionSeoData = {
  title: string
  metaDescription: string
  focusKeyphrase: string
  slug: string
}

export type SeoPreviewMode = 'desktop' | 'tablet' | 'mobile'

export type SeoPreviewImageSource = 'obverse' | 'featured' | 'gallery' | 'reverse' | null

export type SeoPreviewImage = {
  url: string
  source: SeoPreviewImageSource
}

/** Payload for POST /admin/submissions/:id/seo (future plugin support). */
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
}
