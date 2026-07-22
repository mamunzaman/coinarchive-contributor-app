import type { CoinFormValues, CoinIssueStatus, ContentLanguage } from '../types/coinForm'
import { COIN_ISSUE_STATUS_OPTIONS } from '../types/coinForm'
import type { FormOptions } from '../types/formOptions'
import {
  findCoinTypeOptionFromImport,
  findCountryOptionFromImport,
  findTaxonomyOption,
  findTaxonomyOptionFromImport,
  normalizeTaxonomyLookupText,
  resolveCoinSeriesFormValue,
} from '../types/formOptions'
import {
  normalizeImportedCoinMaterial,
  normalizeImportedCoinQuality,
  normalizeReleaseDateForForm,
} from './coinFormNormalize'
import { resolveCountryIsoFromImportText } from './countryCodeResolver'
import type { CoinImportFormFieldKey, CoinLinkImportExtracted, CoinLinkImportResult } from './coinImport'
import { resolveImportDenominationValue } from './coinImportCoinValue'
import {
  isLikelyPageChrome,
  normalizeImportMintage,
  normalizeKnownSourceName,
  pickFirstNonEmptyString,
  resolveOfficialSourceNameFromUrl,
  sanitizeImportSourceUrl,
} from './coinImportFieldUtils'

export type CoinImportDerivedNoteKey =
  | 'country'
  | 'released_date'
  | 'coin_issue_status'
  | 'coin_mintage'
  | 'coin_source_name'
  | 'coin_source_url'

export type CoinImportMapResult = {
  values: Partial<Record<CoinImportFormFieldKey, string>>
  coin_issue_status: CoinIssueStatus
  derivedNotes: Partial<Record<CoinImportDerivedNoteKey, true>>
}

const GERMAN_MONTHS: Record<string, string> = {
  januar: '01',
  january: '01',
  februar: '02',
  february: '02',
  marz: '03',
  maerz: '03',
  march: '03',
  april: '04',
  mai: '05',
  may: '05',
  juni: '06',
  june: '06',
  juli: '07',
  july: '07',
  august: '08',
  september: '09',
  oktober: '10',
  october: '10',
  november: '11',
  dezember: '12',
  december: '12',
}

const ISSUE_STATUS_RELEASED = /\b(issued|released|ausgegeben|erschienen|in\s+circulation|im\s+umlauf)\b/i
const ISSUE_STATUS_SCHEDULED =
  /\b(not\s+yet\s+issued|scheduled|upcoming|planned|geplant|noch\s+nicht\s+ausgegeben|demnächst|demnaechst)\b/i

const MINTAGE_LABEL_PATTERN =
  /(?:total\s+mintage|mintage|auflage|prägeauflage|prageauflage|gesamtauflage|circulation(?:\s+quantity)?|auflagezahl)[:\s]+([\d][\d.,\s]*)/i

function pickFirstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return ''
}

function sanitizeShortImportValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || isLikelyPageChrome(trimmed)) {
    return ''
  }
  return trimmed
}

function sanitizeLongImportValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || isLikelyPageChrome(trimmed)) {
    return ''
  }
  return trimmed
}

function resolveThemeImportValue(extracted: CoinLinkImportExtracted): string {
  const theme = sanitizeShortImportValue(extracted.theme)
  const title = sanitizeShortImportValue(extracted.title)
  if (theme && title && theme.toLowerCase() === title.toLowerCase()) {
    return theme
  }
  return pickFirstNonEmpty(theme, title)
}

export function parseImportReleaseDate(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  const normalizedDirect = normalizeReleaseDateForForm(trimmed)
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDirect)) {
    return normalizedDirect
  }

  const germanMatch = trimmed.match(/(\d{1,2})\.?\s+([A-Za-zäöüÄÖÜß]+)\s+(\d{4})/)
  if (germanMatch) {
    const monthKey = normalizeTaxonomyLookupText(germanMatch[2])
    const month = GERMAN_MONTHS[monthKey]
    if (month) {
      const day = germanMatch[1].padStart(2, '0')
      const candidate = `${germanMatch[3]}-${month}-${day}`
      const normalized = normalizeReleaseDateForForm(candidate)
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return normalized
      }
    }
  }

  return normalizedDirect
}

function normalizeExplicitIssueStatus(raw: string | undefined): CoinIssueStatus {
  const trimmed = raw?.trim().toLowerCase() ?? ''
  if (!trimmed) {
    return ''
  }

  if (ISSUE_STATUS_RELEASED.test(trimmed)) {
    return 'released'
  }

  if (ISSUE_STATUS_SCHEDULED.test(trimmed)) {
    return 'scheduled'
  }

  for (const option of COIN_ISSUE_STATUS_OPTIONS) {
    if (trimmed === option || trimmed.includes(option)) {
      return option
    }
  }

  return ''
}

function localDateFromIso(isoDate: string): Date | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return null
  }

  const year = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10)
  const day = Number.parseInt(match[3], 10)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}

export function resolveImportIssueStatus(
  releaseDate: string,
  explicitStatus: string | undefined,
  currentStatus?: CoinIssueStatus,
): { status: CoinIssueStatus; derived: boolean } {
  const explicit = normalizeExplicitIssueStatus(explicitStatus)
  if (explicit) {
    return { status: explicit, derived: false }
  }

  if (currentStatus?.trim()) {
    return { status: currentStatus, derived: false }
  }

  const normalizedRelease = parseImportReleaseDate(releaseDate)
  const release = localDateFromIso(normalizedRelease)
  if (!release) {
    return { status: '', derived: false }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  release.setHours(0, 0, 0, 0)

  if (release.getTime() <= today.getTime()) {
    return { status: 'released', derived: true }
  }

  return { status: 'scheduled', derived: true }
}

export function resolveImportMintageValue(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  const labeled = trimmed.match(MINTAGE_LABEL_PATTERN)
  if (labeled?.[1]) {
    return normalizeImportMintage(labeled[1])
  }

  if (/^[\d][\d.,\s]+$/.test(trimmed)) {
    return normalizeImportMintage(trimmed)
  }

  const inline = trimmed.match(/([\d]{1,3}(?:[.,]\d{3})+|\d{4,})/)
  if (inline?.[1]) {
    return normalizeImportMintage(inline[1])
  }

  return normalizeImportMintage(trimmed)
}

function extractCountryHintFromText(text: string | undefined): string {
  const trimmed = sanitizeShortImportValue(text)
  if (!trimmed) {
    return ''
  }

  const normalized = normalizeTaxonomyLookupText(trimmed)
  const iso = resolveCountryIsoFromImportText(normalized)
  if (iso) {
    return normalized
  }

  for (const token of normalized.split(/\s+/)) {
    if (resolveCountryIsoFromImportText(token)) {
      return token
    }
  }

  if (normalized.includes('deutschland') || normalized.includes('germany')) {
    return 'Germany'
  }

  return trimmed
}

export function resolveImportCountryName(
  country: string | undefined,
  countryCode: string | undefined,
  options: FormOptions['countries'],
  sourceText?: string,
): { name: string; derived: boolean } {
  const cleanCountry = extractCountryHintFromText(country)
  const cleanCode = countryCode?.trim()

  const direct = findCountryOptionFromImport(cleanCountry, cleanCode, options)
  if (direct?.name) {
    return { name: direct.name, derived: Boolean(cleanCode || cleanCountry !== country?.trim()) }
  }

  const hintFromSource = extractCountryHintFromText(sourceText)
  if (hintFromSource) {
    const fromSource = findCountryOptionFromImport(hintFromSource, undefined, options)
    if (fromSource?.name) {
      return { name: fromSource.name, derived: true }
    }

    const iso = resolveCountryIsoFromImportText(hintFromSource)
    if (iso) {
      const fromIso = findCountryOptionFromImport(undefined, iso, options)
      if (fromIso?.name) {
        return { name: fromIso.name, derived: true }
      }
    }
  }

  const isoFromCountry = resolveCountryIsoFromImportText(cleanCountry || country || '')
  if (isoFromCountry) {
    const fromIso = findCountryOptionFromImport(undefined, isoFromCountry, options)
    if (fromIso?.name) {
      return { name: fromIso.name, derived: true }
    }
  }

  return { name: '', derived: false }
}

function resolveDenominationFromImport(
  result: CoinLinkImportResult,
  options: FormOptions['values'],
): string {
  return resolveImportDenominationValue({
    denomination: result.extracted.denomination,
    coinValue: result.extracted.coinValue,
    coinValueRejected: result.extracted.coinValueRejected,
    missing: result.missing,
    unmatched: result.unmatched,
    conflicts: result.conflicts,
    options,
  })
}

function resolveCoinTypeFromImport(value: string | undefined, options: FormOptions['types']): string {
  if (!value?.trim()) {
    return ''
  }
  return findCoinTypeOptionFromImport(value, options)?.name ?? ''
}

export function resolveImportSourceUrl(
  extracted: CoinLinkImportExtracted,
  result: CoinLinkImportResult,
): { url: string; derived: boolean } {
  const explicit = sanitizeImportSourceUrl(
    pickFirstNonEmptyString(
      extracted.sourceUrl,
      result.extracted.sourceUrl,
    ),
  )
  if (explicit) {
    return { url: explicit, derived: false }
  }

  const fromResult = sanitizeImportSourceUrl(result.sourceUrl)
  if (fromResult) {
    return { url: fromResult, derived: true }
  }

  const fromSources = result.sources?.map((entry) => sanitizeImportSourceUrl(entry.url)).find(Boolean)
  if (fromSources) {
    return { url: fromSources, derived: true }
  }

  return { url: '', derived: false }
}

export function resolveImportSourceName(
  extracted: CoinLinkImportExtracted,
  result: CoinLinkImportResult,
  sourceUrl: string,
): { name: string; derived: boolean } {
  const explicit = normalizeKnownSourceName(
    pickFirstNonEmptyString(extracted.sourceName, result.extracted.sourceName, result.sourceName),
  )
  if (explicit) {
    return { name: explicit, derived: false }
  }

  const fromSourceEntry = result.sources
    ?.map((entry) => normalizeKnownSourceName(entry.label))
    .find(Boolean)
  if (fromSourceEntry) {
    return { name: fromSourceEntry, derived: true }
  }

  const fromUrl = resolveOfficialSourceNameFromUrl(sourceUrl)
  if (fromUrl) {
    return { name: fromUrl, derived: true }
  }

  return { name: '', derived: false }
}

function resolveSeriesFromImport(
  value: string | undefined,
  formOptions: FormOptions,
  contentLanguage: ContentLanguage,
): string {
  if (!value?.trim()) {
    return ''
  }

  const resolved = resolveCoinSeriesFormValue(value, formOptions.series, contentLanguage)
  if (findTaxonomyOption(resolved, formOptions.series)) {
    return resolved
  }

  const matched = findTaxonomyOptionFromImport(resolved, formOptions.series)
  if (matched) {
    return matched.name
  }

  const direct = findTaxonomyOptionFromImport(value, formOptions.series)
  return direct?.name ?? ''
}

export function mapCoinImportToFormValues(
  result: CoinLinkImportResult,
  formOptions: FormOptions,
  contentLanguage: ContentLanguage,
  currentValues?: CoinFormValues,
): CoinImportMapResult {
  const extracted = result.extracted
  const derivedNotes: Partial<Record<CoinImportDerivedNoteKey, true>> = {}

  const sourceHint = pickFirstNonEmpty(
    extracted.country,
    extracted.title,
    extracted.shortDescription,
    extracted.historicalBackground,
  )

  const countryResolution = resolveImportCountryName(
    extracted.country,
    extracted.countryCode,
    formOptions.countries,
    sourceHint,
  )
  if (countryResolution.derived && countryResolution.name) {
    derivedNotes.country = true
  }

  const releaseRaw = pickFirstNonEmpty(extracted.releaseDate)
  const released_date = parseImportReleaseDate(releaseRaw)
  if (released_date && releaseRaw && released_date !== releaseRaw.trim()) {
    derivedNotes.released_date = true
  }

  const mintageRaw = pickFirstNonEmpty(extracted.mintage)
  const coin_mintage = resolveImportMintageValue(mintageRaw)
  if (coin_mintage && coin_mintage !== mintageRaw.trim()) {
    derivedNotes.coin_mintage = true
  }

  const issueResolution = resolveImportIssueStatus(
    released_date,
    extracted.issueStatus,
    currentValues?.coin_issue_status,
  )
  if (issueResolution.derived && issueResolution.status) {
    derivedNotes.coin_issue_status = true
  }

  const sourceUrlResolution = resolveImportSourceUrl(extracted, result)
  const sourceNameResolution = resolveImportSourceName(extracted, result, sourceUrlResolution.url)
  if (sourceUrlResolution.derived && sourceUrlResolution.url) {
    derivedNotes.coin_source_url = true
  }
  if (sourceNameResolution.derived && sourceNameResolution.name) {
    derivedNotes.coin_source_name = true
  }

  const mapped: Partial<Record<CoinImportFormFieldKey, string>> = {
    coin_theme: resolveThemeImportValue(extracted),
    country: countryResolution.name,
    year: sanitizeShortImportValue(extracted.year),
    denomination: resolveDenominationFromImport(result, formOptions.values),
    coin_type: resolveCoinTypeFromImport(
      sanitizeShortImportValue(extracted.coinType) || extracted.coinType,
      formOptions.types,
    ),
    coin_series: resolveSeriesFromImport(
      sanitizeShortImportValue(extracted.series) || extracted.series,
      formOptions,
      contentLanguage,
    ),
    released_date,
    coin_mintage,
    coin_designer: sanitizeShortImportValue(extracted.designer),
    coin_material: normalizeImportedCoinMaterial(sanitizeShortImportValue(extracted.material)),
    coin_quality: normalizeImportedCoinQuality(sanitizeShortImportValue(extracted.quality)),
    coin_obverse_description: sanitizeLongImportValue(extracted.obverseDescription),
    coin_reverse_description: sanitizeLongImportValue(extracted.reverseDescription),
    coin_historical_background: sanitizeLongImportValue(extracted.historicalBackground),
    short_description: sanitizeLongImportValue(extracted.shortDescription),
    coin_source_name: sourceNameResolution.name,
    coin_source_url: sourceUrlResolution.url,
  }

  for (const key of Object.keys(mapped) as CoinImportFormFieldKey[]) {
    if (!mapped[key]?.trim()) {
      delete mapped[key]
    }
  }

  return {
    values: mapped,
    coin_issue_status: issueResolution.status,
    derivedNotes,
  }
}
