import {
  AlertTriangle,
  Check,
  Info,
  Lightbulb,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import {
  IS_ADMIN_SEO_SAVE_AVAILABLE,
  parseSubmissionSeo,
  submissionSeoToDraft,
  updateSubmissionSeo,
} from '../../lib/adminSeoApi'
import { ApiError } from '../../lib/api'
import type { CoinSubmissionDetail } from '../../lib/api'
import {
  analyzeFocusKeyphrase,
  analyzeMetaDescription,
  analyzeSeoTitle,
  analyzeSlug,
  buildSeoPreviewUrl,
  generateSeoMetadata,
  resolveSeoMetadataDraft,
  SEO_META_DESC_MAX,
  SEO_TITLE_MAX,
  type SeoAnalysisLevel,
  type SeoFieldAnalysis,
  type SeoMetadataDraft,
} from '../../lib/seoMetadata'
import type { ContentLanguage } from '../../types/coinForm'
import type { SubmissionSeoData } from '../../types/adminSeo'
import { SaveFeedbackBanner } from '../ui/SaveFeedbackBanner'
import { SaveFeedbackToast } from '../ui/SaveFeedbackToast'
import { Button } from '../ui/Button'

type AdminSeoYoastPreviewProps = {
  submission: CoinSubmissionDetail
  token: string | null
  onSeoSaved?: (seo: SubmissionSeoData) => void
}

type SeoFieldKey = keyof SeoMetadataDraft

function CounterPill({
  analysis,
  goodLabel,
  warningLabel,
}: {
  analysis: SeoFieldAnalysis
  goodLabel: string
  warningLabel: string
}) {
  const isGood = analysis.level === 'good'
  const statusText = isGood ? goodLabel : warningLabel

  return (
    <span
      className={[
        'admin-seo-yoast__counter-pill',
        isGood ? 'admin-seo-yoast__counter-pill--good' : 'admin-seo-yoast__counter-pill--warn',
      ].join(' ')}
      title={statusText}
    >
      {isGood ? (
        <Check className="admin-seo-yoast__counter-icon" aria-hidden />
      ) : (
        <AlertTriangle className="admin-seo-yoast__counter-icon" aria-hidden />
      )}
      <span>{analysis.counter}</span>
      <span className="sr-only">{statusText}</span>
    </span>
  )
}

function AnalysisRow({
  label,
  analysis,
  message,
}: {
  label: string
  analysis: SeoFieldAnalysis
  message: string
}) {
  return (
    <div className="admin-seo-yoast__analysis-row">
      {analysis.level === 'good' ? (
        <Check className="admin-seo-yoast__analysis-icon admin-seo-yoast__analysis-icon--good" aria-hidden />
      ) : (
        <AlertTriangle className="admin-seo-yoast__analysis-icon admin-seo-yoast__analysis-icon--warn" aria-hidden />
      )}
      <div className="admin-seo-yoast__analysis-copy">
        <p className="admin-seo-yoast__analysis-label">{label}</p>
        <p className="admin-seo-yoast__analysis-message">{message}</p>
      </div>
      <span className="admin-seo-yoast__analysis-counter">{analysis.counter}</span>
    </div>
  )
}

function SeoFieldBlock({
  fieldId,
  label,
  hint,
  helperText,
  required,
  optional,
  analysis,
  goodCounterLabel,
  warningCounterLabel,
  aiLabel,
  onGenerate,
  children,
}: {
  fieldId: string
  label: string
  hint: string
  helperText: string
  required?: boolean
  optional?: boolean
  analysis: SeoFieldAnalysis
  goodCounterLabel: string
  warningCounterLabel: string
  aiLabel: string
  onGenerate: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="admin-seo-yoast__field-block">
      <div className="admin-seo-yoast__field-head">
        <div className="admin-seo-yoast__field-label-wrap">
          <label htmlFor={fieldId} className="admin-seo-yoast__field-label">
            {label}
          </label>
          {required ? (
            <span className="admin-seo-yoast__badge admin-seo-yoast__badge--required">
              {t('adminSeo.required')}
            </span>
          ) : null}
          {optional ? (
            <span className="admin-seo-yoast__badge admin-seo-yoast__badge--optional">
              {t('adminSeo.optional')}
            </span>
          ) : null}
          <button
            type="button"
            className="admin-seo-yoast__info-btn"
            aria-label={hint}
            title={hint}
          >
            <Info className="h-3 w-3" aria-hidden />
          </button>
        </div>
        <CounterPill
          analysis={analysis}
          goodLabel={goodCounterLabel}
          warningLabel={warningCounterLabel}
        />
      </div>

      {children}

      <p className="admin-seo-yoast__field-helper">{helperText}</p>

      <div className="admin-seo-yoast__ai-row">
        <div className="admin-seo-yoast__ai-copy">
          <Sparkles className="admin-seo-yoast__ai-icon" aria-hidden />
          <span>{aiLabel}</span>
        </div>
        <button type="button" className="admin-seo-yoast__ai-btn" onClick={onGenerate}>
          {t('adminSeo.generate')}
        </button>
      </div>
    </div>
  )
}

function analysisMessageKey(
  field: 'title' | 'meta' | 'keyphrase' | 'slug',
  level: SeoAnalysisLevel,
  variant?: 'short' | 'long',
): string {
  if (field === 'title') {
    if (level === 'empty') return 'adminSeo.analysis.title.empty'
    if (level === 'warning') return 'adminSeo.analysis.title.tooLong'
    return 'adminSeo.analysis.title.perfect'
  }
  if (field === 'meta') {
    if (level === 'empty') return 'adminSeo.analysis.meta.empty'
    if (variant === 'long') return 'adminSeo.analysis.meta.tooLong'
    if (variant === 'short') return 'adminSeo.analysis.meta.tooShort'
    return 'adminSeo.analysis.meta.great'
  }
  if (field === 'keyphrase') {
    if (level === 'empty') return 'adminSeo.analysis.keyphrase.missing'
    return 'adminSeo.analysis.keyphrase.good'
  }
  if (level === 'empty') return 'adminSeo.analysis.slug.empty'
  if (level === 'warning') return 'adminSeo.analysis.slug.needsCleanup'
  return 'adminSeo.analysis.slug.clean'
}

export function AdminSeoYoastPreview({ submission, token, onSeoSaved }: AdminSeoYoastPreviewProps) {
  const { t } = useTranslation()
  const language = (submission.content_language === 'en' ? 'en' : 'de') as ContentLanguage
  const savedSeo = useMemo(() => parseSubmissionSeo(submission.seo), [submission.seo])
  const {
    inlineRef,
    inlineFeedback,
    inlineExiting,
    toast,
    showSuccess,
    showError,
    dismissToast,
    clearInlineFeedback,
  } = useSaveFeedback()

  const [seoFields, setSeoFields] = useState<SeoMetadataDraft>(() =>
    resolveSeoMetadataDraft(submission, language, savedSeo),
  )
  const [applySlug, setApplySlug] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    setSeoFields(resolveSeoMetadataDraft(submission, language, savedSeo))
    setApplySlug(false)
    setIsDirty(false)
    clearInlineFeedback()
  }, [submission.id, language, clearInlineFeedback])

  useEffect(() => {
    if (isDirty) {
      return
    }

    setSeoFields(resolveSeoMetadataDraft(submission, language, savedSeo))
  }, [savedSeo, submission, language, isDirty])

  const previewUrl = buildSeoPreviewUrl(seoFields.slug)
  const titleAnalysis = analyzeSeoTitle(seoFields.seoTitle)
  const metaAnalysis = analyzeMetaDescription(seoFields.metaDescription)
  const keyphraseAnalysis = analyzeFocusKeyphrase(seoFields.focusKeyphrase)
  const slugAnalysis = analyzeSlug(seoFields.slug)
  const keyphraseDisplay: SeoFieldAnalysis = {
    ...keyphraseAnalysis,
    counter: t('adminSeo.wordCount', { count: keyphraseAnalysis.wordCount ?? 0 }),
  }

  const metaVariant = useMemo(() => {
    const length = seoFields.metaDescription.trim().length
    if (length > SEO_META_DESC_MAX) return 'long' as const
    if (length > 0 && length < 120) return 'short' as const
    return undefined
  }, [seoFields.metaDescription])

  const canSaveSeo =
    IS_ADMIN_SEO_SAVE_AVAILABLE &&
    Boolean(token) &&
    Number.isFinite(submission.id) &&
    submission.id > 0 &&
    !isSaving

  function updateField<K extends SeoFieldKey>(key: K, value: SeoMetadataDraft[K]) {
    setSeoFields((current) => ({ ...current, [key]: value }))
    setIsDirty(true)
  }

  function handleRegenerateAll() {
    setSeoFields(generateSeoMetadata(submission, language))
    setIsDirty(true)
  }

  function regenerateField(field: SeoFieldKey) {
    const draft = generateSeoMetadata(submission, language)
    updateField(field, draft[field])
  }

  const handleSaveSeo = useCallback(async () => {
    if (!canSaveSeo || !token) {
      return
    }

    setIsSaving(true)
    clearInlineFeedback()

    try {
      const result = await updateSubmissionSeo(
        submission.id,
        {
          seoTitle: seoFields.seoTitle.trim(),
          metaDescription: seoFields.metaDescription.trim(),
          focusKeyphrase: seoFields.focusKeyphrase.trim(),
          slug: seoFields.slug.trim(),
          applySlug,
        },
        token,
      )

      setSeoFields(submissionSeoToDraft(result.seo))
      setIsDirty(false)
      onSeoSaved?.(result.seo)
      showSuccess(t('adminSeo.saveSuccess'))
    } catch (error) {
      if (import.meta.env.DEV && error instanceof ApiError) {
        console.warn('[AdminSeoYoastPreview] save failed', error.status, error.message)
      }
      showError(t('adminSeo.saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [
    applySlug,
    canSaveSeo,
    clearInlineFeedback,
    onSeoSaved,
    seoFields,
    showError,
    showSuccess,
    submission.id,
    t,
    token,
  ])

  return (
    <>
      <SaveFeedbackToast toast={toast} onDismiss={dismissToast} />
      <section className="admin-seo-yoast" aria-labelledby="admin-seo-yoast-heading">
      <header className="admin-seo-yoast__hero">
        <div className="admin-seo-yoast__hero-copy">
          <div className="admin-seo-yoast__hero-title-row">
            <span className="admin-seo-yoast__hero-icon" aria-hidden>
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 id="admin-seo-yoast-heading" className="admin-seo-yoast__hero-title">
              {t('adminSeo.sectionTitle')}
            </h2>
            <span className="admin-seo-yoast__hero-badge">{t('adminSeo.importantBadge')}</span>
          </div>
          <p className="admin-seo-yoast__hero-subtitle">{t('adminSeo.subtitle')}</p>
          <p className="admin-seo-yoast__hero-note">{t('adminSeo.adminOnlyNote')}</p>
        </div>
        <div className="admin-seo-yoast__hero-action">
          <Button
            type="button"
            variant="secondary"
            className="admin-seo-yoast__regenerate !min-h-9 w-full !px-3 !py-2 !text-xs sm:w-auto"
            onClick={handleRegenerateAll}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t('adminSeo.regenerate')}
          </Button>
          <p className="admin-seo-yoast__regenerate-hint">{t('adminSeo.regenerateHint')}</p>
          <Button
            type="button"
            variant="primary"
            className="admin-seo-yoast__save !min-h-9 w-full !px-3 !py-2 !text-xs sm:w-auto"
            disabled={!canSaveSeo}
            onClick={() => void handleSaveSeo()}
            aria-busy={isSaving}
            aria-disabled={!canSaveSeo}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                {t('adminSeo.savingSeo')}
              </>
            ) : (
              t('adminSeo.saveSeo')
            )}
          </Button>
          {isDirty ? (
            <p className="admin-seo-yoast__unsaved-hint">{t('adminSeo.unsavedChanges')}</p>
          ) : null}
        </div>
      </header>

      {inlineFeedback ? (
        <div className="admin-seo-yoast__feedback px-3 sm:px-4">
          <SaveFeedbackBanner
            ref={inlineRef}
            variant={inlineFeedback.variant}
            message={inlineFeedback.message}
            exiting={inlineExiting}
          />
        </div>
      ) : null}

      <div className="admin-seo-yoast__body">
        <div className="admin-seo-yoast__main">
          <div className="admin-seo-yoast__fields-panel">
            <SeoFieldBlock
              fieldId="admin-seo-title"
              label={t('adminSeo.seoTitle')}
              hint={t('adminSeo.seoTitleHint')}
              helperText={t('adminSeo.seoTitleHelper')}
              analysis={titleAnalysis}
              goodCounterLabel={t('adminSeo.counterGood')}
              warningCounterLabel={t('adminSeo.counterTitleTooLong')}
              aiLabel={t('adminSeo.aiTitle')}
              onGenerate={() => regenerateField('seoTitle')}
            >
              <input
                id="admin-seo-title"
                className="field-control admin-seo-yoast__input"
                value={seoFields.seoTitle}
                maxLength={SEO_TITLE_MAX + 24}
                onChange={(event) => updateField('seoTitle', event.target.value)}
              />
            </SeoFieldBlock>

            <SeoFieldBlock
              fieldId="admin-seo-meta"
              label={t('adminSeo.metaDescription')}
              hint={t('adminSeo.metaDescriptionHint')}
              helperText={t('adminSeo.metaDescriptionHelper')}
              analysis={metaAnalysis}
              goodCounterLabel={t('adminSeo.counterGood')}
              warningCounterLabel={
                metaVariant === 'short'
                  ? t('adminSeo.counterMetaTooShort')
                  : t('adminSeo.counterMetaTooLong')
              }
              aiLabel={t('adminSeo.aiMeta')}
              onGenerate={() => regenerateField('metaDescription')}
            >
              <textarea
                id="admin-seo-meta"
                className="field-control admin-seo-yoast__textarea"
                rows={3}
                value={seoFields.metaDescription}
                onChange={(event) => updateField('metaDescription', event.target.value)}
              />
            </SeoFieldBlock>

            <SeoFieldBlock
              fieldId="admin-seo-keyphrase"
              label={t('adminSeo.focusKeyphrase')}
              hint={t('adminSeo.focusKeyphraseHint')}
              helperText={t('adminSeo.focusKeyphraseHelper')}
              required
              analysis={keyphraseDisplay}
              goodCounterLabel={t('adminSeo.counterGood')}
              warningCounterLabel={t('adminSeo.counterKeyphraseMissing')}
              aiLabel={t('adminSeo.aiKeyphrase')}
              onGenerate={() => regenerateField('focusKeyphrase')}
            >
              <input
                id="admin-seo-keyphrase"
                className="field-control admin-seo-yoast__input"
                value={seoFields.focusKeyphrase}
                onChange={(event) => updateField('focusKeyphrase', event.target.value)}
              />
            </SeoFieldBlock>

            <SeoFieldBlock
              fieldId="admin-seo-slug"
              label={t('adminSeo.slugLabel')}
              hint={t('adminSeo.slugHint')}
              helperText={t('adminSeo.slugHelper')}
              optional
              analysis={slugAnalysis}
              goodCounterLabel={t('adminSeo.counterGood')}
              warningCounterLabel={t('adminSeo.counterSlugNeedsWork')}
              aiLabel={t('adminSeo.aiSlug')}
              onGenerate={() => regenerateField('slug')}
            >
              <input
                id="admin-seo-slug"
                className="field-control admin-seo-yoast__input"
                value={seoFields.slug}
                onChange={(event) => updateField('slug', event.target.value)}
              />
              <label className="admin-seo-yoast__apply-slug" htmlFor="admin-seo-apply-slug">
                <input
                  id="admin-seo-apply-slug"
                  type="checkbox"
                  className="admin-seo-yoast__apply-slug-input"
                  checked={applySlug}
                  disabled={isSaving}
                  aria-describedby="admin-seo-apply-slug-hint"
                  onChange={(event) => {
                    setApplySlug(event.target.checked)
                    setIsDirty(true)
                  }}
                />
                <span className="admin-seo-yoast__apply-slug-label">{t('adminSeo.applySlug')}</span>
              </label>
              <p id="admin-seo-apply-slug-hint" className="admin-seo-yoast__apply-slug-hint">
                {t('adminSeo.applySlugHint')}
              </p>
            </SeoFieldBlock>
          </div>

          <p className="admin-seo-yoast__phase-note" role="note">
            <Info className="admin-seo-yoast__phase-note-icon" aria-hidden />
            <span>{t('adminSeo.phaseNotice')}</span>
          </p>
        </div>

        <aside className="admin-seo-yoast__aside">
          <div className="admin-seo-yoast__preview-card">
            <div className="admin-seo-yoast__preview-head">
              <p className="admin-seo-yoast__preview-title">
                <span className="admin-seo-google-preview__brand" aria-hidden>
                  <span className="admin-seo-google-preview__g">G</span>
                  <span className="admin-seo-google-preview__o1">o</span>
                  <span className="admin-seo-google-preview__o2">o</span>
                  <span className="admin-seo-google-preview__g2">g</span>
                  <span className="admin-seo-google-preview__l">l</span>
                  <span className="admin-seo-google-preview__e">e</span>
                </span>
                {t('adminSeo.googlePreview')}
              </p>
              <div
                className="admin-seo-yoast__device-toggle"
                role="group"
                aria-label={t('adminSeo.deviceToggleLabel')}
              >
                <span className="admin-seo-yoast__device admin-seo-yoast__device--active">
                  <Monitor className="h-3.5 w-3.5" aria-hidden />
                  <span className="admin-seo-yoast__device-label">{t('adminSeo.desktop')}</span>
                </span>
                <span className="admin-seo-yoast__device admin-seo-yoast__device--inactive" aria-disabled="true">
                  <Smartphone className="h-3.5 w-3.5" aria-hidden />
                  <span className="admin-seo-yoast__device-label">{t('adminSeo.mobile')}</span>
                </span>
              </div>
            </div>
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

          <div className="admin-seo-yoast__analysis-card">
            <h3 className="admin-seo-yoast__card-heading">{t('adminSeo.previewAnalysis')}</h3>
            <AnalysisRow
              label={t('adminSeo.seoTitle')}
              analysis={titleAnalysis}
              message={t(analysisMessageKey('title', titleAnalysis.level))}
            />
            <AnalysisRow
              label={t('adminSeo.metaDescription')}
              analysis={metaAnalysis}
              message={t(analysisMessageKey('meta', metaAnalysis.level, metaVariant))}
            />
            <AnalysisRow
              label={t('adminSeo.focusKeyphrase')}
              analysis={keyphraseDisplay}
              message={t(analysisMessageKey('keyphrase', keyphraseAnalysis.level))}
            />
            <AnalysisRow
              label={t('adminSeo.slugShort')}
              analysis={slugAnalysis}
              message={t(analysisMessageKey('slug', slugAnalysis.level))}
            />
          </div>

          <div className="admin-seo-yoast__tips-card">
            <h3 className="admin-seo-yoast__card-heading">
              <Lightbulb className="admin-seo-yoast__tips-icon" aria-hidden />
              {t('adminSeo.seoTips')}
            </h3>
            <ul className="admin-seo-yoast__tips-list">
              <li>
                <Check className="admin-seo-yoast__tips-check" aria-hidden />
                {t('adminSeo.tips.title')}
              </li>
              <li>
                <Check className="admin-seo-yoast__tips-check" aria-hidden />
                {t('adminSeo.tips.meta')}
              </li>
              <li>
                <Check className="admin-seo-yoast__tips-check" aria-hidden />
                {t('adminSeo.tips.keyphrase')}
              </li>
              <li>
                <Check className="admin-seo-yoast__tips-check" aria-hidden />
                {t('adminSeo.tips.slug')}
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="admin-seo-yoast__admin-note" role="note">
        <p className="admin-seo-yoast__admin-note-title">{t('adminSeo.adminNoteTitle')}</p>
        <p className="admin-seo-yoast__admin-note-lead">{t('adminSeo.adminNoteLead')}</p>
        <div className="admin-seo-yoast__mapping-badges">
          <span className="admin-seo-yoast__mapping-badge">{t('adminSeo.mapping.title')}</span>
          <span className="admin-seo-yoast__mapping-badge">{t('adminSeo.mapping.meta')}</span>
          <span className="admin-seo-yoast__mapping-badge">{t('adminSeo.mapping.keyphrase')}</span>
          <span className="admin-seo-yoast__mapping-badge">{t('adminSeo.mapping.slug')}</span>
        </div>
      </div>
    </section>
    </>
  )
}
