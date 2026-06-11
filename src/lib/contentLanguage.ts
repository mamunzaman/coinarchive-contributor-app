import i18n from '../i18n'
import { CONTENT_LANGUAGE_OPTIONS, type ContentLanguage } from '../types/coinForm'

export function isContentLanguage(value: string): value is ContentLanguage {
  return CONTENT_LANGUAGE_OPTIONS.includes(value as ContentLanguage)
}

export function contentLanguageFromAcf(value: string | undefined): ContentLanguage {
  return value === 'en' ? 'en' : 'de'
}

export function getContentLanguageSelectOptions(): Array<{ value: ContentLanguage; label: string }> {
  return CONTENT_LANGUAGE_OPTIONS.map((language) => ({
    value: language,
    label: i18n.t(`contentLanguage.options.${language}`),
  }))
}

export function getContentLanguageReviewLabel(language: ContentLanguage): string {
  return i18n.t(`contentLanguage.names.${language}`)
}
