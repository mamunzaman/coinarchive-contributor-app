import { parseSubmissionSeo } from './adminSeoApi'
import type { CoinSubmissionDetail } from './api'
import { getSubmissionDuplicateRisk } from './duplicateProtection'
import {
  getSubmissionObverseUrl,
  getSubmissionReverseUrl,
} from './submissionListUtils'
import type {
  AdminDataQualityAudit,
  AdminDataQualityGuidanceKey,
  AdminDataQualityStatus,
  AuditItem,
  AuditItemCategory,
  AuditItemSeverity,
} from '../types/adminDataQualityAudit'
import {
  coinFormValuesFromSubmission,
  MINT_MARK_CODES,
  normalizeMintMarkCode,
  type CoinAcfDetail,
  type CoinFormValues,
  type MintMarkCodeValue,
} from '../types/coinForm'
import { parseMintMarksAvailableFromStorage } from './coinFormNormalize'

type AdminAuditFieldSnapshot = {
  country: { value: string; sources: string[] }
  year: { value: string; sources: string[] }
  coinType: { value: string; sources: string[] }
  coinSeries: { value: string; sources: string[] }
  denomination: { value: string; sources: string[] }
  subjectTitle: { value: string; sources: string[] }
  releaseDate: { value: string; sources: string[] }
  coinCode: { value: string; sources: string[] }
  shortDescription: { value: string; sources: string[] }
  historicalBackground: { value: string; sources: string[] }
  obverseDescription: { value: string; sources: string[] }
  reverseDescription: { value: string; sources: string[] }
  obverseImage: { value: boolean; sources: string[] }
  reverseImage: { value: boolean; sources: string[] }
  galleryImages: { value: boolean; sources: string[] }
  mintInformation: { value: boolean; sources: string[] }
  mintMarkCodes: { value: MintMarkCodeValue[]; sources: string[] }
}

function firstText(...candidates: Array<string | number | undefined | null>): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

function submissionRecord(submission: CoinSubmissionDetail): Record<string, unknown> {
  return submission as unknown as Record<string, unknown>
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function isGermanyCountry(country: string): boolean {
  const normalized = country.trim().toLowerCase()
  return (
    normalized === 'germany' ||
    normalized === 'deutschland' ||
    normalized === 'de' ||
    normalized.includes('germany') ||
    normalized.includes('deutschland')
  )
}

function item(
  id: string,
  labelKey: string,
  passed: boolean,
  severity: AuditItemSeverity,
  category: AuditItemCategory,
  descriptionKey?: string,
): AuditItem {
  return { id, labelKey, descriptionKey, passed, severity, category }
}

function pickField(
  sources: Array<{ key: string; value: string | number | undefined | null }>,
): { value: string; sources: string[] } {
  const usedSources: string[] = []
  for (const source of sources) {
    const text = String(source.value ?? '').trim()
    if (text) {
      usedSources.push(source.key)
      return { value: text, sources: usedSources }
    }
  }
  return { value: '', sources: sources.map((source) => source.key) }
}

function pickBoolean(
  sources: Array<{ key: string; value: boolean }>,
): { value: boolean; sources: string[] } {
  for (const source of sources) {
    if (source.value) {
      return { value: true, sources: [source.key] }
    }
  }
  return { value: false, sources: sources.map((source) => source.key) }
}

function hasMintVariantsAcf(acf?: CoinAcfDetail): boolean {
  if (!acf) return false
  if (acf.has_mint_variants !== undefined) {
    return Number(acf.has_mint_variants) === 1 || acf.has_mint_variants === true
  }
  if (acf.coin_has_mint_variants !== undefined) {
    return Number(acf.coin_has_mint_variants) === 1 || acf.coin_has_mint_variants === true
  }
  const variants = acf.mint_variants ?? acf.coin_mint_variants
  return Array.isArray(variants) && variants.length > 0
}

function hasMintInformation(values: CoinFormValues, acf?: CoinAcfDetail): boolean {
  if (values.hasMintVariants) {
    return values.mintVariants.some(
      (row) => row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim(),
    )
  }

  const singleMintMark = firstText(
    values.singleMintMark,
    acf?.single_mint_mark,
    acf?.coin_single_mint_mark,
  )
  const mintMarksAvailable = firstText(
    values.mintMarksAvailable,
    parseMintMarksAvailableFromStorage(acf?.mint_marks_available),
    parseMintMarksAvailableFromStorage(acf?.coin_mint_marks_available),
  )

  return Boolean(singleMintMark || mintMarksAvailable || hasMintVariantsAcf(acf))
}

function collectMintMarkCodes(values: CoinFormValues, acf?: CoinAcfDetail): MintMarkCodeValue[] {
  const codes = new Set<MintMarkCodeValue>()

  for (const row of values.mintVariants) {
    const code = normalizeMintMarkCode(row.mintMarkCode)
    if (MINT_MARK_CODES.includes(code as MintMarkCodeValue)) {
      codes.add(code as MintMarkCodeValue)
    }
  }

  const rawVariants = acf?.mint_variants ?? acf?.coin_mint_variants
  if (Array.isArray(rawVariants)) {
    for (const row of rawVariants) {
      const code = normalizeMintMarkCode(row.mint_mark_code ?? '')
      if (MINT_MARK_CODES.includes(code as MintMarkCodeValue)) {
        codes.add(code as MintMarkCodeValue)
      }
    }
  }

  const available = firstText(
    values.mintMarksAvailable,
    parseMintMarksAvailableFromStorage(acf?.mint_marks_available),
    parseMintMarksAvailableFromStorage(acf?.coin_mint_marks_available),
  ).toUpperCase()
  for (const mark of MINT_MARK_CODES) {
    if (available.includes(mark)) {
      codes.add(mark)
    }
  }

  const single = normalizeMintMarkCode(
    firstText(values.singleMintMark, acf?.single_mint_mark, acf?.coin_single_mint_mark),
  )
  if (MINT_MARK_CODES.includes(single as MintMarkCodeValue)) {
    codes.add(single as MintMarkCodeValue)
  }

  return [...codes]
}

function hasGermanMintMarksPresent(values: CoinFormValues, acf?: CoinAcfDetail): boolean {
  return collectMintMarkCodes(values, acf).length > 0
}

function hasDuplicateMintMarks(values: CoinFormValues, acf?: CoinAcfDetail): boolean {
  const seen = new Set<string>()
  const variantRows =
    values.hasMintVariants && values.mintVariants.length > 0
      ? values.mintVariants.map((row) => row.mintMarkCode)
      : (acf?.mint_variants ?? acf?.coin_mint_variants ?? []).map((row) => row.mint_mark_code ?? '')

  for (const mintMarkCode of variantRows) {
    const code = normalizeMintMarkCode(mintMarkCode)
    if (!code) continue
    if (seen.has(code)) return true
    seen.add(code)
  }
  return false
}

function mintMintageIsNumericWhenProvided(values: CoinFormValues, acf?: CoinAcfDetail): boolean {
  const rows =
    values.hasMintVariants && values.mintVariants.length > 0
      ? values.mintVariants.map((row) => row.mintMintage)
      : (acf?.mint_variants ?? acf?.coin_mint_variants ?? []).map((row) =>
          row.mint_mintage != null ? String(row.mint_mintage) : '',
        )

  for (const mintage of rows) {
    const trimmed = mintage.trim()
    if (!trimmed) continue
    const normalized = trimmed.replace(/[.\s,]/g, '')
    if (!/^\d+$/.test(normalized)) {
      return false
    }
  }
  return true
}

function hasSavedSeo(submission: CoinSubmissionDetail): boolean {
  const seo = parseSubmissionSeo(submission.seo)
  if (!seo) return false
  return Boolean(seo.title.trim() || seo.metaDescription.trim() || seo.focusKeyphrase.trim())
}

function hasSeoSlug(submission: CoinSubmissionDetail): boolean {
  const seo = parseSubmissionSeo(submission.seo)
  return Boolean(seo?.slug.trim())
}

function resolveStatus(score: number, hasBlockers: boolean): AdminDataQualityStatus {
  if (hasBlockers || score < 50) return 'critical'
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  return 'needs_review'
}

function computeScore(
  required: AuditItem[],
  recommended: AuditItem[],
  warnings: AuditItem[],
): number {
  const passedRequired = required.filter((entry) => entry.passed).length
  const totalRequired = required.length
  const passedRecommended = recommended.filter((entry) => entry.passed).length
  const totalRecommended = recommended.length
  const failedWarnings = warnings.filter((entry) => !entry.passed).length

  const requiredScore = totalRequired > 0 ? (passedRequired / totalRequired) * 70 : 70
  const recommendedScore =
    totalRecommended > 0 ? (passedRecommended / totalRecommended) * 25 : 25
  const warningPenalty = Math.min(5, failedWarnings)

  return Math.max(0, Math.min(100, Math.round(requiredScore + recommendedScore - warningPenalty)))
}

export function resolveAdminAuditFieldSnapshot(
  submission: CoinSubmissionDetail,
): AdminAuditFieldSnapshot {
  const acf = submission.acf
  const record = submissionRecord(submission)
  const values = coinFormValuesFromSubmission(submission)
  const obverseUrl = getSubmissionObverseUrl(submission)
  const reverseUrl = getSubmissionReverseUrl(submission)
  const galleryCount = submission.images?.gallery?.length ?? 0

  return {
    country: pickField([
      { key: 'submission.country', value: submission.country },
      { key: 'acf.coin_country_code', value: acf?.coin_country_code },
      { key: 'record.country', value: record.country as string | undefined },
    ]),
    year: pickField([
      { key: 'submission.year', value: submission.year },
      { key: 'acf.coin_year', value: acf?.coin_year },
      { key: 'record.year', value: record.year as string | number | undefined },
    ]),
    coinType: pickField([
      { key: 'submission.coin_type', value: submission.coin_type },
      { key: 'record.coin_type', value: record.coin_type as string | undefined },
    ]),
    coinSeries: pickField([
      { key: 'submission.coin_series', value: submission.coin_series },
      { key: 'record.coin_series', value: record.coin_series as string | undefined },
    ]),
    denomination: pickField([
      { key: 'submission.denomination', value: submission.denomination },
      { key: 'record.denomination', value: record.denomination as string | undefined },
    ]),
    subjectTitle: pickField([
      { key: 'submission.title', value: submission.title },
      { key: 'acf.coin_theme', value: acf?.coin_theme },
      { key: 'values.coin_theme', value: values.coin_theme },
      { key: 'record.coin_theme', value: record.coin_theme as string | undefined },
    ]),
    releaseDate: pickField([
      { key: 'acf.released_date', value: acf?.released_date },
      { key: 'values.released_date', value: values.released_date },
      { key: 'record.released_date', value: record.released_date as string | undefined },
      { key: 'record.release_date', value: record.release_date as string | undefined },
    ]),
    coinCode: pickField([
      { key: 'acf.coin_code', value: acf?.coin_code },
      { key: 'acf.unique_code', value: acf?.unique_code },
      { key: 'record.coin_code', value: record.coin_code as string | undefined },
      { key: 'record.unique_code', value: record.unique_code as string | undefined },
    ]),
    shortDescription: pickField([
      { key: 'submission.short_description', value: submission.short_description },
      { key: 'acf.coin_short_description', value: acf?.coin_short_description },
      { key: 'values.short_description', value: values.short_description },
      { key: 'record.short_description', value: record.short_description as string | undefined },
    ]),
    historicalBackground: pickField([
      { key: 'acf.coin_historical_background', value: acf?.coin_historical_background },
      { key: 'values.coin_historical_background', value: values.coin_historical_background },
    ]),
    obverseDescription: pickField([
      { key: 'acf.coin_obverse_description', value: acf?.coin_obverse_description },
      { key: 'values.coin_obverse_description', value: values.coin_obverse_description },
    ]),
    reverseDescription: pickField([
      { key: 'acf.coin_reverse_description', value: acf?.coin_reverse_description },
      { key: 'values.coin_reverse_description', value: values.coin_reverse_description },
    ]),
    obverseImage: pickBoolean([
      { key: 'images.obverse.url', value: Boolean(submission.images?.obverse?.url) },
      { key: 'getSubmissionObverseUrl', value: Boolean(obverseUrl) },
      { key: 'record.obverse_url', value: Boolean(record.obverse_url) },
      { key: 'record.default_obverse_url', value: Boolean(record.default_obverse_url) },
    ]),
    reverseImage: pickBoolean([
      { key: 'images.reverse.url', value: Boolean(submission.images?.reverse?.url) },
      { key: 'getSubmissionReverseUrl', value: Boolean(reverseUrl) },
      { key: 'record.reverse_url', value: Boolean(record.reverse_url) },
      { key: 'record.default_reverse_url', value: Boolean(record.default_reverse_url) },
    ]),
    galleryImages: pickBoolean([
      { key: 'images.gallery.length', value: galleryCount > 0 },
    ]),
    mintInformation: pickBoolean([
      { key: 'mintInformation', value: hasMintInformation(values, acf) },
    ]),
    mintMarkCodes: {
      value: collectMintMarkCodes(values, acf),
      sources: ['values.mintVariants', 'acf.mint_variants', 'single_mint_mark', 'mint_marks_available'],
    },
  }
}

export function getAdminDataQualityGuidanceKey(
  audit: AdminDataQualityAudit,
): AdminDataQualityGuidanceKey {
  if (audit.blockers.length > 0) return 'blockers'
  if (audit.warnings.some((entry) => !entry.passed)) return 'warnings'
  return 'ready'
}

export function buildAdminDataQualityAudit(
  submission: CoinSubmissionDetail,
): AdminDataQualityAudit {
  const acf = submission.acf
  const values = coinFormValuesFromSubmission(submission)
  const fields = resolveAdminAuditFieldSnapshot(submission)
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const isGermany = isGermanyCountry(fields.country.value)
  const mintCodes = fields.mintMarkCodes.value

  const required: AuditItem[] = [
    item('country', 'adminDataQuality.items.country.label', Boolean(fields.country.value), 'required', 'identity'),
    item('year', 'adminDataQuality.items.year.label', Boolean(fields.year.value), 'required', 'identity'),
    item(
      'coinType',
      'adminDataQuality.items.coinType.label',
      Boolean(fields.coinType.value),
      'required',
      'identity',
    ),
    item(
      'subjectTitle',
      'adminDataQuality.items.subjectTitle.label',
      Boolean(fields.subjectTitle.value),
      'required',
      'identity',
    ),
    item(
      'releaseDate',
      'adminDataQuality.items.releaseDate.label',
      Boolean(fields.releaseDate.value),
      'required',
      'identity',
    ),
    item(
      'coinCode',
      'adminDataQuality.items.coinCode.label',
      Boolean(fields.coinCode.value),
      'required',
      'identity',
    ),
    item(
      'obverseImage',
      'adminDataQuality.items.obverseImage.label',
      fields.obverseImage.value,
      'required',
      'images',
    ),
    item(
      'duplicateStatus',
      'adminDataQuality.items.duplicateStatus.label',
      duplicateRisk.level !== 'exact',
      duplicateRisk.level === 'exact' ? 'critical' : 'required',
      'duplicate',
      duplicateRisk.level === 'exact'
        ? 'adminDataQuality.items.duplicateStatus.descExact'
        : undefined,
    ),
  ]

  const recommended: AuditItem[] = [
    item(
      'reverseImage',
      'adminDataQuality.items.reverseImage.label',
      fields.reverseImage.value,
      'recommended',
      'images',
    ),
    item(
      'galleryImage',
      'adminDataQuality.items.galleryImage.label',
      fields.galleryImages.value,
      'recommended',
      'images',
    ),
    item(
      'shortDescription',
      'adminDataQuality.items.shortDescription.label',
      Boolean(stripHtml(fields.shortDescription.value)),
      'recommended',
      'content',
    ),
    item(
      'historicalBackground',
      'adminDataQuality.items.historicalBackground.label',
      Boolean(stripHtml(fields.historicalBackground.value)),
      'recommended',
      'content',
    ),
    item(
      'obverseDescription',
      'adminDataQuality.items.obverseDescription.label',
      Boolean(stripHtml(fields.obverseDescription.value)),
      'recommended',
      'content',
    ),
    item(
      'reverseDescription',
      'adminDataQuality.items.reverseDescription.label',
      Boolean(stripHtml(fields.reverseDescription.value)),
      'recommended',
      'content',
    ),
    item(
      'mintInformation',
      'adminDataQuality.items.mintInformation.label',
      fields.mintInformation.value,
      'recommended',
      'mint',
    ),
    item(
      'seoSaved',
      'adminDataQuality.items.seoSaved.label',
      hasSavedSeo(submission),
      'recommended',
      'seo',
    ),
    item(
      'seoSlug',
      'adminDataQuality.items.seoSlug.label',
      hasSeoSlug(submission),
      'recommended',
      'seo',
    ),
  ]

  const warnings: AuditItem[] = []

  if (!values.content_language) {
    warnings.push(
      item(
        'contentLanguageMissing',
        'adminDataQuality.items.contentLanguageMissing.label',
        false,
        'warning',
        'language',
        'adminDataQuality.items.contentLanguageMissing.desc',
      ),
    )
  } else if (values.content_language !== 'en' && values.content_language !== 'de') {
    warnings.push(
      item(
        'contentLanguageInvalid',
        'adminDataQuality.items.contentLanguageInvalid.label',
        false,
        'warning',
        'language',
        'adminDataQuality.items.contentLanguageInvalid.desc',
      ),
    )
  } else {
    warnings.push(
      item(
        'contentLanguage',
        'adminDataQuality.items.contentLanguage.label',
        true,
        'warning',
        'language',
      ),
    )
  }

  if (duplicateRisk.level === 'similar') {
    warnings.push(
      item(
        'similarDuplicate',
        'adminDataQuality.items.similarDuplicate.label',
        false,
        'warning',
        'duplicate',
        'adminDataQuality.items.similarDuplicate.desc',
      ),
    )
  }

  if (!isGermany && hasGermanMintMarksPresent(values, acf)) {
    warnings.push(
      item(
        'germanMintOnNonGermany',
        'adminDataQuality.items.germanMintOnNonGermany.label',
        false,
        'warning',
        'mint',
        'adminDataQuality.items.germanMintOnNonGermany.desc',
      ),
    )
  }

  if (isGermany && hasDuplicateMintMarks(values, acf)) {
    warnings.push(
      item(
        'duplicateMintMarks',
        'adminDataQuality.items.duplicateMintMarks.label',
        false,
        'warning',
        'mint',
        'adminDataQuality.items.duplicateMintMarks.desc',
      ),
    )
  }

  if (isGermany && !mintMintageIsNumericWhenProvided(values, acf)) {
    warnings.push(
      item(
        'mintMintageNumeric',
        'adminDataQuality.items.mintMintageNumeric.label',
        false,
        'warning',
        'mint',
        'adminDataQuality.items.mintMintageNumeric.desc',
      ),
    )
  } else if (isGermany && (values.hasMintVariants || hasMintVariantsAcf(acf))) {
    warnings.push(
      item(
        'mintMintageNumeric',
        'adminDataQuality.items.mintMintageNumeric.label',
        true,
        'warning',
        'mint',
      ),
    )
  }

  if (isGermany && values.hasMintVariants && mintCodes.length > 0 && mintCodes.length < MINT_MARK_CODES.length) {
    warnings.push(
      item(
        'germanMintMarkSetIncomplete',
        'adminDataQuality.items.germanMintMarkSetIncomplete.label',
        false,
        'warning',
        'mint',
        'adminDataQuality.items.germanMintMarkSetIncomplete.desc',
      ),
    )
  }

  const blockers = required.filter((entry) => !entry.passed)
  const passedRequired = required.filter((entry) => entry.passed).length
  const passedRecommended = recommended.filter((entry) => entry.passed).length
  const score = computeScore(required, recommended, warnings)
  const status = resolveStatus(score, blockers.length > 0)

  return {
    score,
    status,
    required,
    recommended,
    warnings,
    blockers,
    summary: {
      passedRequired,
      totalRequired: required.length,
      passedRecommended,
      totalRecommended: recommended.length,
    },
  }
}
