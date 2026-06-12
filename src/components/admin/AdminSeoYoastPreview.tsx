import { RefreshCw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CoinSubmissionDetail } from '../../lib/api'
import {
  buildSeoPreviewUrl,
  generateSeoMetadata,
  getMetaDescriptionStatus,
  getSeoTitleStatus,
  SEO_META_DESC_MAX,
  SEO_META_DESC_MIN,
  SEO_TITLE_MAX,
  type SeoMetadataDraft,
} from '../../lib/seoMetadata'
import type { ContentLanguage } from '../../types/coinForm'
import { Button } from '../ui/Button'
import { TextAreaField } from '../ui/TextAreaField'
import { TextField } from '../ui/TextField'

type AdminSeoYoastPreviewProps = {
  submission: CoinSubmissionDetail
}

function CharacterCount({
  status,
  maxLabel,
  rangeLabel,
  mode,
}: {
  status: 'ok' | 'short' | 'long'
  maxLabel: string
  rangeLabel: string
  mode: 'title' | 'description'
}) {
  const statusClass =
    status === 'long'
      ? 'admin-seo-yoast__count--long'
      : status === 'short'
        ? 'admin-seo-yoast__count--short'
        : 'admin-seo-yoast__count--ok'

  return (
    <p className={['admin-seo-yoast__count', statusClass].join(' ')}>
      {mode === 'title' ? maxLabel : rangeLabel}
    </p>
  )
}

export function AdminSeoYoastPreview({ submission }: AdminSeoYoastPreviewProps) {
  const { t } = useTranslation()
  const language = (submission.content_language === 'en' ? 'en' : 'de') as ContentLanguage

  const [seoFields, setSeoFields] = useState<SeoMetadataDraft>(() =>
    generateSeoMetadata(submission, language),
  )

  useEffect(() => {
    setSeoFields(generateSeoMetadata(submission, language))
  }, [submission.id, language])

  const previewUrl = buildSeoPreviewUrl(seoFields.slug)
  const titleStatus = getSeoTitleStatus(seoFields.seoTitle.length)
  const descriptionStatus = getMetaDescriptionStatus(seoFields.metaDescription.length)

  function updateField<K extends keyof SeoMetadataDraft>(key: K, value: SeoMetadataDraft[K]) {
    setSeoFields((current) => ({ ...current, [key]: value }))
  }

  function handleRegenerate() {
    setSeoFields(generateSeoMetadata(submission, language))
  }

  return (
    <section className="admin-seo-yoast" aria-labelledby="admin-seo-yoast-heading">
      <div className="admin-seo-yoast__header">
        <div>
          <h2 id="admin-seo-yoast-heading" className="admin-seo-yoast__title">
            {t('adminSeo.sectionTitle')}
          </h2>
          <p className="admin-seo-yoast__notice">{t('adminSeo.phaseNotice')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="admin-seo-yoast__regenerate !min-h-10 shrink-0"
          onClick={handleRegenerate}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          {t('adminSeo.regenerate')}
        </Button>
      </div>

      <div className="admin-seo-yoast__grid">
        <div className="admin-seo-yoast__fields">
          <div>
            <TextField
              label={t('adminSeo.seoTitle')}
              hint={t('adminSeo.seoTitleHint')}
              value={seoFields.seoTitle}
              onChange={(event) => updateField('seoTitle', event.target.value)}
              maxLength={SEO_TITLE_MAX + 20}
            />
            <CharacterCount
              status={titleStatus}
              mode="title"
              maxLabel={t('adminSeo.charactersMax', {
                count: seoFields.seoTitle.length,
                max: SEO_TITLE_MAX,
              })}
              rangeLabel={t('adminSeo.charactersRange', {
                count: seoFields.seoTitle.length,
                min: SEO_META_DESC_MIN,
                max: SEO_META_DESC_MAX,
              })}
            />
          </div>

          <div>
            <TextAreaField
              label={t('adminSeo.metaDescription')}
              hint={t('adminSeo.metaDescriptionHint')}
              rows={4}
              value={seoFields.metaDescription}
              onChange={(event) => updateField('metaDescription', event.target.value)}
            />
            <CharacterCount
              status={descriptionStatus}
              mode="description"
              maxLabel={t('adminSeo.charactersMax', {
                count: seoFields.metaDescription.length,
                max: SEO_META_DESC_MAX,
              })}
              rangeLabel={t('adminSeo.charactersRange', {
                count: seoFields.metaDescription.length,
                min: SEO_META_DESC_MIN,
                max: SEO_META_DESC_MAX,
              })}
            />
          </div>

          <TextField
            label={t('adminSeo.focusKeyphrase')}
            hint={t('adminSeo.focusKeyphraseHint')}
            value={seoFields.focusKeyphrase}
            onChange={(event) => updateField('focusKeyphrase', event.target.value)}
          />

          <TextField
            label={t('adminSeo.slug')}
            hint={t('adminSeo.slugHint')}
            value={seoFields.slug}
            onChange={(event) => updateField('slug', event.target.value)}
          />
        </div>

        <div className="admin-seo-yoast__preview-wrap">
          <p className="admin-seo-yoast__preview-label">
            <Search className="h-4 w-4" aria-hidden />
            {t('adminSeo.googlePreview')}
          </p>
          <div className="admin-seo-google-preview">
            <p className="admin-seo-google-preview__url">{previewUrl}</p>
            <p className="admin-seo-google-preview__title">
              {seoFields.seoTitle.trim() || t('adminSeo.previewTitleFallback')}
            </p>
            <p className="admin-seo-google-preview__description">
              {seoFields.metaDescription.trim() || t('adminSeo.previewDescriptionFallback')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
