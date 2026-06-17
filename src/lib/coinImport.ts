import { LEGACY_COIN_SOURCE_NAME_ACF_KEY } from './coinSourceFields'
import type { CoinFormValues, CoinIssueStatus, ContentLanguage } from '../types/coinForm'
import {
  ensureMintVariantClientIds,
  getMintMarkLabel,
  isKnownMintMarkCode,
  isMintVariantRowFilled,
  normalizeMintMarkCode,
  type MintVariantRow,
} from '../types/coinForm'
import type { CoinFormStepId } from '../types/coinFormSteps'
import {
  findCoinTypeOptionFromImport,
  findDenominationOptionFromImport,
  findTaxonomyOption,
  findTaxonomyOptionFromImport,
  resolveCoinSeriesFormValue,
  type FormOptions,
} from '../types/formOptions'
import {
  containsPageChromeContent,
  isLikelyPageChrome,
  normalizeImportMintage,
  normalizeKnownSourceName,
  pickFirstNonEmptyString,
  resolveOfficialSourceNameFromUrl,
  sanitizeImportSourceUrl,
} from './coinImportFieldUtils'
import {
  mapCoinImportToFormValues,
  resolveImportCountryName,
  resolveImportMintageValue,
  type CoinImportDerivedNoteKey,
} from './mapCoinImportToFormValues'

export { isLikelyPageChrome, containsPageChromeContent, normalizeImportMintage } from './coinImportFieldUtils'
export type { CoinImportDerivedNoteKey } from './mapCoinImportToFormValues'

export type CoinImportMissingFieldKey =
  | 'mint_variants'
  | 'mint_mark'
  | 'mint_mintage_by_mint'
  | 'edge_inscription'
  | 'technical_specifications'
  | 'coin_quality'
  | 'reverse_image'
  | 'short_description'
  | 'historical_background'
  | 'reverse_description'

export type CoinImportMissingFieldTarget = {
  key: CoinImportMissingFieldKey
  stepId: CoinFormStepId
  importTarget: string
  fieldId?: string
  labelKey: string
  helperKey: string
}

export const COIN_IMPORT_MISSING_FIELD_ORDER: readonly CoinImportMissingFieldKey[] = [
  'mint_variants',
  'mint_mark',
  'mint_mintage_by_mint',
  'edge_inscription',
  'technical_specifications',
  'coin_quality',
  'reverse_image',
  'short_description',
  'reverse_description',
  'historical_background',
]

export const COIN_IMPORT_MISSING_FIELD_TARGETS: Record<
  CoinImportMissingFieldKey,
  Omit<CoinImportMissingFieldTarget, 'key'>
> = {
  mint_variants: {
    stepId: 'mint-information',
    importTarget: 'mint-variants',
    labelKey: 'coinImport.missing.mintVariants.label',
    helperKey: 'coinImport.missing.mintVariants.helper',
  },
  mint_mark: {
    stepId: 'mint-information',
    importTarget: 'mint-mark',
    fieldId: 'single_mint_mark',
    labelKey: 'coinImport.missing.mintMark.label',
    helperKey: 'coinImport.missing.mintMark.helper',
  },
  mint_mintage_by_mint: {
    stepId: 'mint-information',
    importTarget: 'mint-variants',
    labelKey: 'coinImport.missing.mintMintageByMint.label',
    helperKey: 'coinImport.missing.mintMintageByMint.helper',
  },
  edge_inscription: {
    stepId: 'specifications',
    importTarget: 'edge-inscription',
    fieldId: 'coin_edge_inscription',
    labelKey: 'coinImport.missing.edgeInscription.label',
    helperKey: 'coinImport.missing.edgeInscription.helper',
  },
  technical_specifications: {
    stepId: 'specifications',
    importTarget: 'technical-specifications',
    fieldId: 'coin_weight_g',
    labelKey: 'coinImport.missing.technicalSpecifications.label',
    helperKey: 'coinImport.missing.technicalSpecifications.helper',
  },
  coin_quality: {
    stepId: 'specifications',
    importTarget: 'coin-quality',
    fieldId: 'coin_quality',
    labelKey: 'coinImport.missing.quality.label',
    helperKey: 'coinImport.missing.quality.helper',
  },
  reverse_image: {
    stepId: 'images',
    importTarget: 'reverse-image',
    labelKey: 'coinImport.missing.reverseImage.label',
    helperKey: 'coinImport.missing.reverseImage.helper',
  },
  short_description: {
    stepId: 'core-identity',
    importTarget: 'short-description',
    fieldId: 'short_description',
    labelKey: 'coinImport.missing.shortDescription.label',
    helperKey: 'coinImport.missing.shortDescription.helper',
  },
  historical_background: {
    stepId: 'descriptions',
    importTarget: 'historical-background',
    labelKey: 'coinImport.missing.historicalBackground.label',
    helperKey: 'coinImport.missing.historicalBackground.helper',
  },
  reverse_description: {
    stepId: 'descriptions',
    importTarget: 'reverse-description',
    fieldId: 'coin_reverse_description',
    labelKey: 'coinImport.missing.reverseDescription.label',
    helperKey: 'coinImport.missing.reverseDescription.helper',
  },
}

const MISSING_TEXT_TO_KEY: Array<{ pattern: RegExp; key: CoinImportMissingFieldKey }> = [
  { pattern: /mint\s*variant|mint\s*mark/i, key: 'mint_variants' },
  { pattern: /mint\s*mark/i, key: 'mint_mark' },
  { pattern: /mintage\s*by\s*mint|exact\s*mintage/i, key: 'mint_mintage_by_mint' },
  { pattern: /edge/i, key: 'edge_inscription' },
  { pattern: /weight|diameter|thickness|technical/i, key: 'technical_specifications' },
  { pattern: /quality/i, key: 'coin_quality' },
  { pattern: /reverse\s*image|reverse\s*photo|rückseite/i, key: 'reverse_image' },
  { pattern: /short\s*description|kurzbeschreibung/i, key: 'short_description' },
  { pattern: /historical|hintergrund/i, key: 'historical_background' },
  { pattern: /reverse\s*description|rückseitenbeschreibung/i, key: 'reverse_description' },
]

const STANDARD_MISSING_KEYS: CoinImportMissingFieldKey[] = [
  'mint_variants',
  'mint_mintage_by_mint',
  'edge_inscription',
  'technical_specifications',
  'coin_quality',
  'reverse_image',
]

export type CoinImportNavigateOptions = {
  onStepChange: (stepId: CoinFormStepId) => void
  onAnnounce?: (message: string) => void
  announceMessage?: string
}

export type ResolveMissingImportOptions = {
  hasReverseImage?: boolean
}

export function getMissingTargetsForStep(
  targets: CoinImportMissingFieldTarget[],
  stepId: CoinFormStepId,
): CoinImportMissingFieldTarget[] {
  return targets.filter((target) => target.stepId === stepId)
}

export function getCoinImportMissingFieldTarget(
  key: CoinImportMissingFieldKey,
): CoinImportMissingFieldTarget {
  return { key, ...COIN_IMPORT_MISSING_FIELD_TARGETS[key] }
}

export function mapMissingTextToImportKey(text: string): CoinImportMissingFieldKey | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }

  for (const entry of MISSING_TEXT_TO_KEY) {
    if (entry.pattern.test(trimmed)) {
      return entry.key
    }
  }

  return null
}

export function resolveMissingImportTargets(
  result: CoinLinkImportResult,
  values?: CoinFormValues,
  options?: ResolveMissingImportOptions,
): CoinImportMissingFieldTarget[] {
  const keys = new Set<CoinImportMissingFieldKey>()
  const extractedMintVariants = result.extracted.mintVariants ?? []
  const totalMintageFromExtract = resolveImportMintageValue(result.extracted.mintage)

  for (const key of STANDARD_MISSING_KEYS) {
    keys.add(key)
  }

  for (const item of result.missing) {
    const mapped = mapMissingTextToImportKey(item)
    if (!mapped) {
      continue
    }
    if (mapped === 'mint_mintage_by_mint' && totalMintageFromExtract && extractedMintVariants.length === 0) {
      continue
    }
    if (mapped === 'mint_variants' && extractedMintVariants.some((row) => row.mintMarkCode.trim())) {
      continue
    }
    keys.add(mapped)
  }

  if (!result.extracted.quality?.trim()) {
    keys.add('coin_quality')
  }

  const images = result.extracted.images ?? []
  if (images.length <= 1) {
    keys.add('reverse_image')
  }

  if (!result.extracted.shortDescription?.trim()) {
    keys.add('short_description')
  }

  if (!result.extracted.historicalBackground?.trim()) {
    keys.add('historical_background')
  }

  if (!result.extracted.reverseDescription?.trim()) {
    keys.add('reverse_description')
  }

  if (extractedMintVariants.some((row) => row.mintMarkCode.trim())) {
    keys.delete('mint_variants')
  }
  if (extractedMintVariants.some((row) => row.mintMintage.trim())) {
    keys.delete('mint_mintage_by_mint')
  }
  if (totalMintageFromExtract && extractedMintVariants.length === 0) {
    keys.delete('mint_mintage_by_mint')
  }
  if (result.extracted.edgeInscription?.trim()) {
    keys.delete('edge_inscription')
  }
  if (result.extracted.weightG?.trim() && result.extracted.diameterMm?.trim()) {
    keys.delete('technical_specifications')
  }

  if (values) {
    if (values.coin_quality.trim()) {
      keys.delete('coin_quality')
    }
    if (values.coin_edge_inscription.trim()) {
      keys.delete('edge_inscription')
    }
    if (values.coin_weight_g.trim() && values.coin_diameter_mm.trim() && values.coin_thickness_mm.trim()) {
      keys.delete('technical_specifications')
    }
    if (values.short_description.trim()) {
      keys.delete('short_description')
    }
    if (values.coin_historical_background.trim()) {
      keys.delete('historical_background')
    }
    if (values.coin_reverse_description.trim()) {
      keys.delete('reverse_description')
    }
    if (values.hasMintVariants && values.mintVariants.some((row) => row.mintMarkCode.trim())) {
      keys.delete('mint_variants')
    }
    if (!values.hasMintVariants && values.singleMintMark.trim()) {
      keys.delete('mint_mark')
    }
    if (
      values.hasMintVariants &&
      values.mintVariants.some((row) => row.mintMintage.trim())
    ) {
      keys.delete('mint_mintage_by_mint')
    }
    if (values.coin_mintage.trim() && !values.hasMintVariants) {
      keys.delete('mint_mintage_by_mint')
    }
  }

  if (options?.hasReverseImage) {
    keys.delete('reverse_image')
  }

  return COIN_IMPORT_MISSING_FIELD_ORDER.filter((key) => keys.has(key)).map((key) =>
    getCoinImportMissingFieldTarget(key),
  )
}

export function navigateToImportTarget(
  key: CoinImportMissingFieldKey,
  options: CoinImportNavigateOptions,
): void {
  const target = getCoinImportMissingFieldTarget(key)
  options.onStepChange(target.stepId)

  if (options.onAnnounce && options.announceMessage) {
    options.onAnnounce(options.announceMessage)
  }

  window.setTimeout(() => {
    focusImportTarget(target.importTarget, target.fieldId)
  }, 120)
}

function focusImportTarget(importTarget: string, fieldId?: string, attempt = 0): void {
  const container = document.querySelector(`[data-import-target="${importTarget}"]`)
  if (!container) {
    if (attempt < 24) {
      window.setTimeout(() => focusImportTarget(importTarget, fieldId, attempt + 1), 80)
    }
    return
  }

  container.scrollIntoView({ behavior: 'smooth', block: 'center' })
  container.classList.add('coin-import-target-highlight')
  window.setTimeout(() => {
    container.classList.remove('coin-import-target-highlight')
  }, 2200)

  const focusCandidate =
    (fieldId ? document.getElementById(fieldId) : null) ??
    container.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
    )

  if (focusCandidate instanceof HTMLElement) {
    focusCandidate.focus({ preventScroll: true })
  }
}


export type CoinLinkImportSourceName = 'Deutsche Bundesbank' | 'European Central Bank'

export type CoinLinkImportConfidence = 'high' | 'medium' | 'low'

export type CoinImportMintVariant = {
  mintMarkCode: string
  mintMintage: string
  mintNotes: string
}

export type CoinImportExtendedData = {
  hasMintVariants?: boolean
  mintMarksAvailable?: string
  mintVariants?: CoinImportMintVariant[]
  coin_weight_g?: string
  coin_diameter_mm?: string
  coin_thickness_mm?: string
  coin_edge_inscription?: string
}

export type CoinLinkImportExtracted = {
  title?: string
  country?: string
  countryCode?: string
  year?: string
  denomination?: string
  coinType?: string
  series?: string
  theme?: string
  releaseDate?: string
  mintage?: string
  designer?: string
  material?: string
  quality?: string
  obverseDescription?: string
  reverseDescription?: string
  historicalBackground?: string
  shortDescription?: string
  sourceUrl?: string
  sourceName?: string
  images?: string[]
  hasMintVariants?: boolean
  mintMarksAvailable?: string
  mintVariants?: CoinImportMintVariant[]
  weightG?: string
  diameterMm?: string
  thicknessMm?: string
  edgeInscription?: string
  issueStatus?: string
  fieldSources?: Record<string, string>
}

export type CoinLinkImportSourceStatus = 'success' | 'blocked' | 'failed'

export type CoinLinkImportSourceEntry = {
  url: string
  label?: string
  status: CoinLinkImportSourceStatus
  blockedReason?: string
}

export type CoinLinkImportResult = {
  sourceUrl: string
  sourceName: CoinLinkImportSourceName
  confidence: CoinLinkImportConfidence
  extracted: CoinLinkImportExtracted
  missing: string[]
  warnings: string[]
  fieldSources?: Record<string, string>
  catalogueTextRequired?: boolean
  blockedSources?: string[]
  sources?: CoinLinkImportSourceEntry[]
}

export type CoinImportMintPreviewRow = {
  mintMarkCode: string
  mintNotes: string
  mintMintage: string
}

export type CoinImportSpecsPreview = {
  weightG?: string
  diameterMm?: string
  material?: string
  edgeInscription?: string
}

export type CoinImportMintSpecPreview = {
  mintVariants: CoinImportMintPreviewRow[]
  mintSourceBadge: 'catalog' | 'imported'
  specs: CoinImportSpecsPreview
  specsSourceBadge: 'catalog' | 'imported'
}

export const SUPPORTED_COIN_IMPORT_HOSTS = new Set([
  'bundesbank.de',
  'www.bundesbank.de',
  'ecb.europa.eu',
  'www.ecb.europa.eu',
])

export const COIN_IMPORT_UNSUPPORTED_URL_MESSAGE =
  'Only official Bundesbank and ECB coin pages are supported.'

export type CoinImportFormFieldKey =
  | 'coin_theme'
  | 'country'
  | 'year'
  | 'denomination'
  | 'coin_type'
  | 'coin_series'
  | 'released_date'
  | 'coin_mintage'
  | 'coin_designer'
  | 'coin_material'
  | 'coin_quality'
  | 'coin_obverse_description'
  | 'coin_reverse_description'
  | 'coin_historical_background'
  | 'short_description'
  | 'coin_source_name'
  | 'coin_source_url'

export const COIN_IMPORT_FORM_FIELD_KEYS: readonly CoinImportFormFieldKey[] = [
  'coin_theme',
  'country',
  'year',
  'denomination',
  'coin_type',
  'coin_series',
  'released_date',
  'coin_mintage',
  'coin_designer',
  'coin_material',
  'coin_quality',
  'coin_obverse_description',
  'coin_reverse_description',
  'coin_historical_background',
  'short_description',
  'coin_source_name',
  'coin_source_url',
]

export type CoinImportFieldConflict = {
  field: CoinImportFormFieldKey
  currentValue: string
  importedValue: string
}

export type CoinImportConflictResolution = 'keep' | 'replace'

export type CoinImportApplyMode = 'empty-only' | 'replace-all'

export type CoinImportSkippedTaxonomyField = {
  field: 'country' | 'denomination' | 'coin_type' | 'coin_series'
  imported: string
}

export type CoinImportApplyReport = {
  appliedCountry?: string
  appliedDenomination?: string
  appliedCoinType?: string
  appliedCoinSeries?: string
  skippedTaxonomy: CoinImportSkippedTaxonomyField[]
  appliedMintRows: number
  skippedMintReason?: 'existing_data' | 'no_variants'
}

export type CoinImportApplyResult = {
  values: CoinFormValues
  report: CoinImportApplyReport
}

function buildSkippedTaxonomyFields(
  result: CoinLinkImportResult,
  mapped: Partial<Record<CoinImportFormFieldKey, string>>,
): CoinImportSkippedTaxonomyField[] {
  const extracted = result.extracted
  const skipped: CoinImportSkippedTaxonomyField[] = []
  const checks: Array<{
    field: CoinImportSkippedTaxonomyField['field']
    imported: string | undefined
  }> = [
    {
      field: 'country',
      imported: pickFirstNonEmpty(extracted.country, extracted.countryCode),
    },
    { field: 'denomination', imported: extracted.denomination },
    { field: 'coin_type', imported: extracted.coinType },
    { field: 'coin_series', imported: extracted.series },
  ]

  for (const check of checks) {
    const imported = check.imported?.trim()
    if (!imported) {
      continue
    }
    if (!mapped[check.field]?.trim()) {
      skipped.push({ field: check.field, imported })
    }
  }

  return skipped
}

const EXTRACTED_TO_FORM_FIELD: Partial<Record<keyof CoinLinkImportExtracted, CoinImportFormFieldKey>> =
  {
    theme: 'coin_theme',
    title: 'coin_theme',
    country: 'country',
    year: 'year',
    denomination: 'denomination',
    coinType: 'coin_type',
    series: 'coin_series',
    releaseDate: 'released_date',
    mintage: 'coin_mintage',
    designer: 'coin_designer',
    material: 'coin_material',
    quality: 'coin_quality',
    obverseDescription: 'coin_obverse_description',
    reverseDescription: 'coin_reverse_description',
    historicalBackground: 'coin_historical_background',
    shortDescription: 'short_description',
    sourceName: 'coin_source_name',
    sourceUrl: 'coin_source_url',
  }

export function isSupportedCoinImportHost(hostname: string): boolean {
  return SUPPORTED_COIN_IMPORT_HOSTS.has(hostname.trim().toLowerCase())
}

export function validateCoinImportUrl(rawUrl: string): {
  valid: boolean
  normalizedUrl?: string
  hostname?: string
} {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return { valid: false }
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false }
    }

    const hostname = parsed.hostname.toLowerCase()
    if (!isSupportedCoinImportHost(hostname)) {
      return { valid: false, hostname }
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      hostname,
    }
  } catch {
    return { valid: false }
  }
}

export const COIN_LINK_IMPORT_MAX_URLS = 2

export const COIN_LINK_IMPORT_URL_SLOTS = ['primary', 'extra'] as const

export type CoinLinkImportUrlSlot = (typeof COIN_LINK_IMPORT_URL_SLOTS)[number]

export type CoinLinkImportUrlFields = Record<CoinLinkImportUrlSlot, string>

export const EMPTY_COIN_LINK_IMPORT_URL_FIELDS: CoinLinkImportUrlFields = {
  primary: '',
  extra: '',
}

export type CoinLinkImportUrlFieldErrorKey = 'required' | 'invalidUrl' | 'unsupportedHost'

export type CoinLinkImportUrlsValidation = {
  valid: boolean
  source_urls: string[]
  fieldErrors: Partial<Record<CoinLinkImportUrlSlot, CoinLinkImportUrlFieldErrorKey>>
  generalError?: 'no_urls' | 'duplicate_urls'
}

function normalizeCoinLinkImportUrl(rawUrl: string): string | undefined {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined
    }
    return parsed.toString()
  } catch {
    return undefined
  }
}

export function buildCoinLinkImportSourceUrls(fields: CoinLinkImportUrlFields): string[] {
  const urls: string[] = []

  for (const slot of COIN_LINK_IMPORT_URL_SLOTS) {
    const normalized = normalizeCoinLinkImportUrl(fields[slot])
    if (!normalized) {
      continue
    }
    if (!urls.includes(normalized)) {
      urls.push(normalized)
    }
  }

  return urls.slice(0, COIN_LINK_IMPORT_MAX_URLS)
}

export function validateCoinImportUrlFields(fields: CoinLinkImportUrlFields): CoinLinkImportUrlsValidation {
  const fieldErrors: Partial<Record<CoinLinkImportUrlSlot, CoinLinkImportUrlFieldErrorKey>> = {}
  const source_urls: string[] = []
  const seen = new Set<string>()

  for (const slot of COIN_LINK_IMPORT_URL_SLOTS) {
    const raw = fields[slot].trim()
    if (!raw) {
      continue
    }

    const normalized = normalizeCoinLinkImportUrl(raw)
    if (!normalized) {
      fieldErrors[slot] = 'invalidUrl'
      continue
    }

    const hostCheck = validateCoinImportUrl(raw)
    if (!hostCheck.valid) {
      fieldErrors[slot] = hostCheck.hostname ? 'unsupportedHost' : 'invalidUrl'
      continue
    }

    if (seen.has(normalized)) {
      return {
        valid: false,
        source_urls: [],
        fieldErrors,
        generalError: 'duplicate_urls',
      }
    }

    seen.add(normalized)
    source_urls.push(normalized)
  }

  if (source_urls.length === 0) {
    return {
      valid: false,
      source_urls: [],
      fieldErrors: { primary: 'required' },
      generalError: 'no_urls',
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { valid: false, source_urls, fieldErrors }
  }

  return { valid: true, source_urls, fieldErrors }
}

function pickFirstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return ''
}

function normalizeComparableText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
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
  if (!trimmed || isLikelyPageChrome(trimmed) || containsPageChromeContent(trimmed)) {
    return ''
  }
  return trimmed
}

function resolveThemeImportValue(extracted: CoinLinkImportExtracted): string {
  const theme = sanitizeShortImportValue(extracted.theme)
  const title = sanitizeShortImportValue(extracted.title)

  if (theme && title && normalizeComparableText(theme) === normalizeComparableText(title)) {
    return theme
  }

  return pickFirstNonEmpty(theme, title)
}

export function mapImportResultToFormValues(
  result: CoinLinkImportResult,
  formOptions: FormOptions,
  contentLanguage: ContentLanguage,
  currentValues?: CoinFormValues,
): Partial<Record<CoinImportFormFieldKey, string>> {
  return mapCoinImportToFormValues(result, formOptions, contentLanguage, currentValues).values
}

export function isCoinImportFormFieldEmpty(values: CoinFormValues, field: CoinImportFormFieldKey): boolean {
  return !String(values[field] ?? '').trim()
}

export function detectImportConflicts(
  current: CoinFormValues,
  imported: Partial<Record<CoinImportFormFieldKey, string>>,
): CoinImportFieldConflict[] {
  const conflicts: CoinImportFieldConflict[] = []

  for (const field of COIN_IMPORT_FORM_FIELD_KEYS) {
    const importedValue = imported[field]?.trim()
    if (!importedValue) {
      continue
    }

    const currentValue = String(current[field] ?? '').trim()
    if (!currentValue || currentValue === importedValue) {
      continue
    }

    conflicts.push({
      field,
      currentValue,
      importedValue,
    })
  }

  return conflicts
}

function setImportedFormField(
  target: CoinFormValues,
  field: CoinImportFormFieldKey,
  value: string,
): void {
  if (field === 'coin_quality') {
    target.coin_quality = value as CoinFormValues['coin_quality']
    return
  }

  target[field] = value
}

export function applyImportToFormValues(
  current: CoinFormValues,
  imported: Partial<Record<CoinImportFormFieldKey, string>>,
  mode: CoinImportApplyMode,
  conflictResolutions: Partial<Record<CoinImportFormFieldKey, CoinImportConflictResolution>> = {},
  extended?: CoinImportExtendedData,
  importResult?: CoinLinkImportResult,
): CoinImportApplyResult {
  const next: CoinFormValues = {
    ...current,
    mintVariants: current.mintVariants.map((row) => ({ ...row })),
  }

  for (const field of COIN_IMPORT_FORM_FIELD_KEYS) {
    const importedValue = imported[field]?.trim()
    if (!importedValue) {
      continue
    }

    const currentValue = String(next[field] ?? '').trim()
    const isEmpty = !currentValue

    if (mode === 'empty-only') {
      if (isEmpty) {
        setImportedFormField(next, field, importedValue)
      }
      continue
    }

    if (isEmpty) {
      setImportedFormField(next, field, importedValue)
      continue
    }

    if (currentValue === importedValue) {
      continue
    }

    if (conflictResolutions[field] === 'replace') {
      setImportedFormField(next, field, importedValue)
    }
  }

  const mintReport = extended
    ? applyImportExtendedToFormValues(next, extended, mode)
    : { appliedMintRows: 0, skippedMintReason: undefined as CoinImportApplyReport['skippedMintReason'] }

  const report: CoinImportApplyReport = {
    skippedTaxonomy: importResult ? buildSkippedTaxonomyFields(importResult, imported) : [],
    appliedMintRows: mintReport.appliedMintRows,
    skippedMintReason: mintReport.skippedMintReason,
  }

  if (imported.country?.trim() && next.country.trim()) {
    report.appliedCountry = next.country.trim()
  }
  if (imported.denomination?.trim() && next.denomination.trim()) {
    report.appliedDenomination = next.denomination.trim()
  }
  if (imported.coin_type?.trim() && next.coin_type.trim()) {
    report.appliedCoinType = next.coin_type.trim()
  }
  if (imported.coin_series?.trim() && next.coin_series.trim()) {
    report.appliedCoinSeries = next.coin_series.trim()
  }

  return { values: next, report }
}

export function mergeMissingImportFields(result: CoinLinkImportResult): string[] {
  return resolveMissingImportTargets(result).map((target) => target.key)
}

const LONG_EXTRACTED_KEYS = new Set<keyof CoinLinkImportExtracted>([
  'obverseDescription',
  'reverseDescription',
  'historicalBackground',
  'shortDescription',
])

export type CoinImportPreviewFieldEntry = {
  key: string
  labelKey: string
  value: string
  kind: 'short' | 'long'
}

export type CoinImportExtractedPreview = {
  core: CoinImportPreviewFieldEntry[]
  descriptions: CoinImportPreviewFieldEntry[]
  source: CoinImportPreviewFieldEntry[]
  pageChromeFiltered: boolean
}

export function getSanitizedExtractedPreview(result: CoinLinkImportResult): CoinImportExtractedPreview {
  const extracted = result.extracted
  const core: CoinImportPreviewFieldEntry[] = []
  const descriptions: CoinImportPreviewFieldEntry[] = []
  const source: CoinImportPreviewFieldEntry[] = []
  const seenValues = new Set<string>()
  let pageChromeFiltered = false

  function pushEntry(
    bucket: CoinImportPreviewFieldEntry[],
    key: string,
    labelKey: string,
    rawValue: string | undefined,
    kind: 'short' | 'long',
  ) {
    const value =
      kind === 'long' ? sanitizeLongImportValue(rawValue) : sanitizeShortImportValue(rawValue)
    if (!value) {
      if (rawValue?.trim()) {
        pageChromeFiltered = true
      }
      return
    }

    const comparable = normalizeComparableText(value)
    if (seenValues.has(comparable)) {
      pageChromeFiltered = true
      return
    }

    seenValues.add(comparable)
    bucket.push({ key, labelKey, value, kind })
  }

  pushEntry(core, 'coin_theme', 'coinImport.fields.coin_theme', resolveThemeImportValue(extracted), 'short')

  const coreFieldMap: Array<[keyof CoinLinkImportExtracted, CoinImportFormFieldKey]> = [
    ['country', 'country'],
    ['year', 'year'],
    ['denomination', 'denomination'],
    ['coinType', 'coin_type'],
    ['series', 'coin_series'],
    ['releaseDate', 'released_date'],
    ['mintage', 'coin_mintage'],
    ['designer', 'coin_designer'],
    ['material', 'coin_material'],
    ['quality', 'coin_quality'],
  ]

  for (const [extractedKey, formField] of coreFieldMap) {
    const raw = extracted[extractedKey]
    if (typeof raw !== 'string') {
      continue
    }
    pushEntry(core, extractedKey, `coinImport.fields.${formField}`, raw, 'short')
  }

  if (extracted.countryCode?.trim() && !isLikelyPageChrome(extracted.countryCode)) {
    pushEntry(core, 'countryCode', 'coinImport.fields.countryCode', extracted.countryCode, 'short')
  }

  for (const extractedKey of LONG_EXTRACTED_KEYS) {
    const raw = extracted[extractedKey]
    if (typeof raw !== 'string') {
      continue
    }
    const formField = EXTRACTED_TO_FORM_FIELD[extractedKey]
    if (!formField) {
      continue
    }
    pushEntry(descriptions, extractedKey, `coinImport.fields.${formField}`, raw, 'long')
  }

  pushEntry(
    source,
    'sourceName',
    'coinImport.fields.coin_source_name',
    pickFirstNonEmpty(extracted.sourceName, result.sourceName),
    'short',
  )
  pushEntry(
    source,
    'sourceUrl',
    'coinImport.fields.coin_source_url',
    pickFirstNonEmpty(extracted.sourceUrl, result.sourceUrl),
    'short',
  )

  return { core, descriptions, source, pageChromeFiltered }
}

export function getExtractedFieldEntries(
  result: CoinLinkImportResult,
): Array<{ key: keyof CoinLinkImportExtracted | string; labelKey: string; value: string }> {
  const preview = getSanitizedExtractedPreview(result)
  return [...preview.core, ...preview.descriptions, ...preview.source].map((entry) => ({
    key: entry.key,
    labelKey: entry.labelKey,
    value: entry.value,
  }))
}

export function countSanitizedExtractedFields(result: CoinLinkImportResult): number {
  const preview = getSanitizedExtractedPreview(result)
  const mintSpec = getImportMintSpecPreview(result)
  const specCount = Object.values(mintSpec.specs).filter(Boolean).length
  return (
    preview.core.length +
    preview.descriptions.length +
    preview.source.length +
    mintSpec.mintVariants.length +
    specCount
  )
}

function readOptionalNumberish(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return readOptionalString(value)
}

function readMintMarkCodeFromRaw(record: Record<string, unknown>): string {
  const raw =
    readOptionalString(record.mint_mark_code) ??
    readOptionalString(record.mintMarkCode) ??
    readOptionalString(record.code) ??
    readOptionalString(record.mint)

  if (!raw) {
    return ''
  }

  const direct = normalizeMintMarkCode(raw)
  if (isKnownMintMarkCode(direct)) {
    return direct
  }

  const firstToken = raw.split(/[\s,;/]+/)[0] ?? ''
  return normalizeMintMarkCode(firstToken)
}

function readMintMintageFromRaw(record: Record<string, unknown>): string {
  const raw =
    readOptionalNumberish(record.mint_mintage) ??
    readOptionalNumberish(record.mintMintage) ??
    readOptionalNumberish(record.mintage)

  return raw ? normalizeImportMintage(raw) : ''
}

function readMintNotesFromRaw(record: Record<string, unknown>, mintMarkCode: string): string {
  const raw =
    readOptionalString(record.mint_notes) ??
    readOptionalString(record.mintNotes) ??
    readOptionalString(record.notes) ??
    readOptionalString(record.location)

  if (raw) {
    return raw
  }

  return mintMarkCode ? getMintMarkLabel(mintMarkCode) ?? '' : ''
}

export function normalizeImportMintVariantRow(value: unknown): CoinImportMintVariant | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const mintMarkCode = readMintMarkCodeFromRaw(record)
  if (!mintMarkCode) {
    return null
  }

  return {
    mintMarkCode,
    mintMintage: readMintMintageFromRaw(record),
    mintNotes: readMintNotesFromRaw(record, mintMarkCode),
  }
}

export function readImportMintVariants(value: unknown): CoinImportMintVariant[] {
  if (!Array.isArray(value)) {
    return []
  }

  const rows: CoinImportMintVariant[] = []
  const seen = new Set<string>()

  for (const item of value) {
    const normalized = normalizeImportMintVariantRow(item)
    if (!normalized || seen.has(normalized.mintMarkCode)) {
      continue
    }
    seen.add(normalized.mintMarkCode)
    rows.push(normalized)
  }

  return rows
}

function readMintMarksAvailable(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const codes = value
      .map((entry) => {
        if (typeof entry === 'string') {
          return normalizeMintMarkCode(entry)
        }
        return ''
      })
      .filter(Boolean)
    if (codes.length > 0) {
      return codes.join(', ')
    }
  }

  const asString = readOptionalString(value)
  if (!asString) {
    return undefined
  }

  return asString
    .split(/[,;/\s]+/)
    .map((part) => normalizeMintMarkCode(part))
    .filter(Boolean)
    .join(', ')
}

function readOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1') {
    return true
  }
  if (value === false || value === 0 || value === '0') {
    return false
  }
  return undefined
}

function readFieldSources(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }

  const sources: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const normalized = readOptionalString(raw)
    if (normalized) {
      sources[key] = normalized
    }
  }

  return Object.keys(sources).length > 0 ? sources : undefined
}

function readFirstOptionalString(raw: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readOptionalNumberish(raw[key])
    if (value) {
      return value
    }
  }
  return undefined
}

function readNestedImportSource(raw: Record<string, unknown>): { url?: string; name?: string } {
  const source = raw.source
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    return {}
  }

  const record = source as Record<string, unknown>
  return {
    url: readFirstOptionalString(record, [
      'url',
      'source_url',
      'sourceUrl',
      'page_url',
      'pageUrl',
      'canonical_url',
      'canonicalUrl',
      'original_url',
      'originalUrl',
      'import_url',
      'importUrl',
    ]),
    name: readFirstOptionalString(record, [
      'name',
      'title',
      'source_name',
      'sourceName',
      'official_source_name',
      'officialSourceName',
      'provider',
      'publisher',
      'site_name',
      'siteName',
    ]),
  }
}

export function normalizeExtractedFromRaw(raw: Record<string, unknown>): CoinLinkImportExtracted {
  const nestedSource = readNestedImportSource(raw)
  const mintVariants = readImportMintVariants(
    raw.mintVariants ?? raw.mint_variants ?? raw.coin_mint_variants,
  )
  const hasMintVariants =
    readOptionalBoolean(raw.hasMintVariants) ??
    readOptionalBoolean(raw.coin_has_mint_variants) ??
    (mintVariants.length > 0 ? true : undefined)

  const mintMarksAvailable = readMintMarksAvailable(
    raw.mintMarksAvailable ?? raw.mint_marks_available ?? raw.coin_mint_marks_available,
  )

  return {
    title: readOptionalString(raw.title),
    country:
      readFirstOptionalString(raw, ['country', 'coin_country']) ??
      readOptionalString(raw.country),
    countryCode:
      readFirstOptionalString(raw, ['countryCode', 'country_code', 'coin_country_code']) ??
      readOptionalString(raw.countryCode),
    year: readOptionalString(raw.year),
    denomination:
      readFirstOptionalString(raw, ['denomination', 'coin_value']) ??
      readOptionalString(raw.denomination),
    coinType:
      readFirstOptionalString(raw, ['coinType', 'coin_type']) ?? readOptionalString(raw.coinType),
    series:
      readFirstOptionalString(raw, ['series', 'coin_series']) ?? readOptionalString(raw.series),
    theme: readOptionalString(raw.theme),
    releaseDate:
      readFirstOptionalString(raw, [
        'releaseDate',
        'release_date',
        'released_date',
        'issueDate',
        'issue_date',
        'dateOfIssue',
        'date_of_issue',
      ]) ?? readOptionalString(raw.releaseDate),
    mintage:
      readFirstOptionalString(raw, [
        'mintage',
        'coin_mintage',
        'totalMintage',
        'total_mintage',
        'auflage',
        'prägeauflage',
        'prageauflage',
        'gesamtauflage',
        'circulationQuantity',
        'circulation_quantity',
      ]) ?? readOptionalString(raw.mintage),
    issueStatus:
      readFirstOptionalString(raw, [
        'issueStatus',
        'issue_status',
        'coin_issue_status',
        'releasedStatus',
        'released_status',
        'issueState',
        'issue_state',
      ]) ?? readOptionalString(raw.issueStatus),
    designer: readOptionalString(raw.designer) ?? readOptionalString(raw.coin_designer),
    material: readOptionalString(raw.material) ?? readOptionalString(raw.coin_material),
    quality: readOptionalString(raw.quality) ?? readOptionalString(raw.coin_quality),
    obverseDescription:
      readOptionalString(raw.obverseDescription) ?? readOptionalString(raw.coin_obverse_description),
    reverseDescription:
      readOptionalString(raw.reverseDescription) ?? readOptionalString(raw.coin_reverse_description),
    historicalBackground:
      readOptionalString(raw.historicalBackground) ??
      readOptionalString(raw.coin_historical_background),
    shortDescription:
      readOptionalString(raw.shortDescription) ?? readOptionalString(raw.short_description),
    sourceUrl:
      readFirstOptionalString(raw, [
        'sourceUrl',
        'source_url',
        'coin_source_url',
        'url',
        'page_url',
        'pageUrl',
        'canonical_url',
        'canonicalUrl',
        'original_url',
        'originalUrl',
        'import_url',
        'importUrl',
      ]) ??
      nestedSource.url ??
      readOptionalString(raw.sourceUrl),
    sourceName:
      readFirstOptionalString(raw, [
        'sourceName',
        'source_name',
        'coin_source_name',
        'official_source_name',
        'officialSourceName',
        LEGACY_COIN_SOURCE_NAME_ACF_KEY,
        'provider',
        'publisher',
        'site_name',
        'siteName',
      ]) ??
      nestedSource.name ??
      readOptionalString(raw.sourceName),
    images: Array.isArray(raw.images)
      ? raw.images.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : undefined,
    hasMintVariants,
    mintMarksAvailable,
    mintVariants: mintVariants.length > 0 ? mintVariants : undefined,
    weightG: readFirstOptionalString(raw, ['weightG', 'weight_g', 'weight', 'coin_weight_g']),
    diameterMm: readFirstOptionalString(raw, [
      'diameterMm',
      'diameter_mm',
      'diameter',
      'coin_diameter_mm',
    ]),
    thicknessMm: readFirstOptionalString(raw, [
      'thicknessMm',
      'thickness_mm',
      'thickness',
      'coin_thickness_mm',
    ]),
    edgeInscription:
      readOptionalString(raw.edgeInscription) ??
      readOptionalString(raw.edge_inscription) ??
      readOptionalString(raw.coin_edge_inscription),
    fieldSources: readFieldSources(raw.fieldSources ?? raw.field_sources),
  }
}

export function resolveImportSourceBadgeKey(fieldSource?: string): 'catalog' | 'imported' {
  if (!fieldSource) {
    return 'imported'
  }

  const lower = fieldSource.toLowerCase()
  if (lower.includes('foronum') || lower.includes('catalog')) {
    return 'catalog'
  }

  return 'imported'
}

export function mapImportExtendedFromResult(result: CoinLinkImportResult): CoinImportExtendedData {
  const extracted = result.extracted
  const extended: CoinImportExtendedData = {}

  if (extracted.weightG?.trim()) {
    extended.coin_weight_g = extracted.weightG.trim()
  }
  if (extracted.diameterMm?.trim()) {
    extended.coin_diameter_mm = extracted.diameterMm.trim()
  }
  if (extracted.thicknessMm?.trim()) {
    extended.coin_thickness_mm = extracted.thicknessMm.trim()
  }
  if (extracted.edgeInscription?.trim()) {
    extended.coin_edge_inscription = extracted.edgeInscription.trim()
  }

  const mintVariants = extracted.mintVariants ?? []
  if (extracted.hasMintVariants || mintVariants.length > 0) {
    extended.hasMintVariants = true
    extended.mintVariants = mintVariants
    extended.mintMarksAvailable =
      extracted.mintMarksAvailable?.trim() ||
      mintVariants.map((row) => row.mintMarkCode).join(', ')
  }

  return extended
}

export function getImportMintSpecPreview(result: CoinLinkImportResult): CoinImportMintSpecPreview {
  const extracted = result.extracted
  const fieldSources = { ...result.fieldSources, ...extracted.fieldSources }

  const mintVariants = (extracted.mintVariants ?? []).map((row) => ({
    mintMarkCode: row.mintMarkCode,
    mintNotes: row.mintNotes,
    mintMintage: row.mintMintage,
  }))

  const specs: CoinImportSpecsPreview = {}
  if (extracted.weightG?.trim()) {
    specs.weightG = extracted.weightG.trim()
  }
  if (extracted.diameterMm?.trim()) {
    specs.diameterMm = extracted.diameterMm.trim()
  }
  if (extracted.material?.trim()) {
    specs.material = extracted.material.trim()
  }
  if (extracted.edgeInscription?.trim()) {
    specs.edgeInscription = extracted.edgeInscription.trim()
  }

  const mintSource = fieldSources.mintVariants ?? fieldSources.mint_variants ?? fieldSources.mint
  const specsSource =
    fieldSources.weightG ??
    fieldSources.weight ??
    fieldSources.diameterMm ??
    fieldSources.diameter ??
    fieldSources.material ??
    fieldSources.edgeInscription ??
    fieldSources.specifications

  return {
    mintVariants,
    mintSourceBadge: resolveImportSourceBadgeKey(mintSource),
    specs,
    specsSourceBadge: resolveImportSourceBadgeKey(specsSource),
  }
}

export type CoinImportReviewFieldStatus = 'ready' | 'needs_review' | 'existing_value' | 'missing'

export type CoinImportReviewSourceBadge = 'official' | 'catalog' | 'combined' | 'pasted_catalogue'

export type CoinImportReviewExtendedFormKey =
  | 'coin_weight_g'
  | 'coin_diameter_mm'
  | 'coin_thickness_mm'
  | 'coin_edge_inscription'
  | 'coin_issue_status'

export type CoinImportReviewFieldRow = {
  key: string
  labelKey: string
  formField?: CoinImportFormFieldKey | CoinImportReviewExtendedFormKey
  displayOnly?: boolean
  isTaxonomy?: boolean
  aiValue: string
  matchedValue?: string
  applyValue?: string
  source: CoinImportReviewSourceBadge
  confidence: CoinLinkImportConfidence
  status: CoinImportReviewFieldStatus
  defaultSelected: boolean
  derivedFromSource?: boolean
}

export type CoinImportReviewMintRow = {
  mintMarkCode: string
  city: string
  mintage: string
  source: CoinImportReviewSourceBadge
  confidence: CoinLinkImportConfidence
  status: CoinImportReviewFieldStatus
  defaultSelected: boolean
}

export type CoinImportReviewSection = {
  id: 'basic' | 'release_specs' | 'source' | 'mint_variants' | 'descriptions'
  labelKey: string
  fields: CoinImportReviewFieldRow[]
}

export type CoinImportReviewModel = {
  sections: CoinImportReviewSection[]
  mintRows: CoinImportReviewMintRow[]
  hasExistingMintData: boolean
  confidence: CoinLinkImportConfidence
  derivedNotes: Partial<Record<CoinImportDerivedNoteKey, true>>
  coinIssueStatus?: CoinIssueStatus
}

export type CoinImportReviewSelection = {
  fieldKeys: string[]
  mintMarkCodes: string[]
  replaceExistingMint: boolean
}

const TAXONOMY_REVIEW_FIELDS = new Set<CoinImportFormFieldKey>([
  'country',
  'denomination',
  'coin_type',
  'coin_series',
])

export function resolveImportReviewSourceBadge(
  fieldSource: string | undefined,
  multiSource: boolean,
): CoinImportReviewSourceBadge {
  if (!fieldSource?.trim()) {
    return multiSource ? 'combined' : 'official'
  }

  const lower = fieldSource.toLowerCase()
  if (lower.includes('pasted') || lower.includes('manual_catalogue')) {
    return 'pasted_catalogue'
  }

  const catalog = lower.includes('foronum') || lower.includes('catalog')
  const official =
    lower.includes('bundesbank') ||
    lower.includes('ecb') ||
    lower.includes('official') ||
    lower.includes('imported')

  if (catalog && official) {
    return 'combined'
  }
  if (catalog) {
    return 'catalog'
  }
  return 'official'
}

function readReviewFieldSource(
  result: CoinLinkImportResult,
  sourceKeys: string[],
): string | undefined {
  const sources = { ...result.fieldSources, ...result.extracted.fieldSources }
  for (const key of sourceKeys) {
    const value = sources[key]
    if (value?.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function resolveReviewFieldStatus(
  aiValue: string | undefined,
  applyValue: string | undefined,
  currentValue: string,
  isTaxonomy: boolean,
  taxonomyMatched: boolean,
): CoinImportReviewFieldStatus {
  const resolvedApply = (applyValue ?? aiValue ?? '').trim()
  if (!resolvedApply) {
    return 'missing'
  }

  const current = currentValue.trim()

  if (current && current !== resolvedApply) {
    return 'existing_value'
  }

  if (isTaxonomy && !taxonomyMatched) {
    return 'needs_review'
  }

  return 'ready'
}

function defaultReviewSelected(
  status: CoinImportReviewFieldStatus,
  key: string,
  applyValue: string,
  currentValue: string,
): boolean {
  if (status === 'ready') {
    return true
  }

  const isSourceField = key === 'coin_source_name' || key === 'coin_source_url'
  if (isSourceField && applyValue.trim() && !currentValue.trim()) {
    return true
  }

  return false
}

function getTaxonomyMatchForReview(
  field: 'country' | 'denomination' | 'coin_type' | 'coin_series',
  extracted: CoinLinkImportExtracted,
  formOptions: FormOptions,
  contentLanguage: ContentLanguage,
): { matchedName?: string; aiValue: string } {
  switch (field) {
    case 'country': {
      const aiValue = pickFirstNonEmpty(extracted.country, extracted.countryCode)
      const sourceHint = pickFirstNonEmpty(
        extracted.country,
        extracted.title,
        extracted.shortDescription,
        extracted.historicalBackground,
      )
      const resolution = resolveImportCountryName(
        extracted.country,
        extracted.countryCode,
        formOptions.countries,
        sourceHint,
      )
      return { aiValue, matchedName: resolution.name || undefined }
    }
    case 'denomination': {
      const aiValue = extracted.denomination?.trim() ?? ''
      const match = findDenominationOptionFromImport(extracted.denomination, formOptions.values)
      return { aiValue, matchedName: match?.name }
    }
    case 'coin_type': {
      const aiValue = extracted.coinType?.trim() ?? ''
      const match = extracted.coinType?.trim()
        ? findCoinTypeOptionFromImport(extracted.coinType, formOptions.types)
        : undefined
      return { aiValue, matchedName: match?.name }
    }
    case 'coin_series': {
      const aiValue = extracted.series?.trim() ?? ''
      if (!aiValue) {
        return { aiValue: '' }
      }
      const resolved = resolveCoinSeriesFormValue(aiValue, formOptions.series, contentLanguage)
      const match =
        findTaxonomyOption(resolved, formOptions.series) ??
        findTaxonomyOptionFromImport(aiValue, formOptions.series)
      return { aiValue, matchedName: match?.name }
    }
  }
}

type ReviewFieldBuildInput = {
  key: string
  labelKey: string
  formField?: CoinImportFormFieldKey | CoinImportReviewExtendedFormKey
  aiValue?: string
  applyValue?: string
  matchedValue?: string
  isTaxonomy?: boolean
  displayOnly?: boolean
  sourceKeys: string[]
  currentValue: string
  result: CoinLinkImportResult
  multiSource: boolean
  derivedFromSource?: boolean
}

function buildReviewFieldRow(input: ReviewFieldBuildInput): CoinImportReviewFieldRow {
  const aiValue = input.aiValue?.trim() ?? ''
  const matchedValue = input.matchedValue?.trim()
  const applyValue = input.applyValue?.trim() ?? matchedValue ?? aiValue
  const taxonomyMatched = input.isTaxonomy ? Boolean(matchedValue) : true
  const status = resolveReviewFieldStatus(
    aiValue,
    input.isTaxonomy ? matchedValue : applyValue,
    input.currentValue,
    Boolean(input.isTaxonomy),
    taxonomyMatched,
  )

  return {
    key: input.key,
    labelKey: input.labelKey,
    formField: input.formField,
    displayOnly: input.displayOnly,
    isTaxonomy: input.isTaxonomy,
    aiValue,
    matchedValue,
    applyValue: input.isTaxonomy ? matchedValue : applyValue,
    source: resolveImportReviewSourceBadge(
      readReviewFieldSource(input.result, input.sourceKeys),
      input.multiSource,
    ),
    confidence: input.result.confidence,
    status,
    defaultSelected: input.displayOnly
      ? false
      : defaultReviewSelected(status, input.key, applyValue, input.currentValue),
    derivedFromSource: input.derivedFromSource,
  }
}

export function buildCoinImportReviewModel(
  result: CoinLinkImportResult,
  currentValues: CoinFormValues,
  formOptions: FormOptions,
  contentLanguage: ContentLanguage,
  options: { multiSource?: boolean } = {},
): CoinImportReviewModel {
  const extracted = result.extracted
  const importMap = mapCoinImportToFormValues(result, formOptions, contentLanguage, currentValues)
  const mapped = importMap.values
  const multiSource = options.multiSource ?? false

  const countryTax = getTaxonomyMatchForReview('country', extracted, formOptions, contentLanguage)
  const denominationTax = getTaxonomyMatchForReview('denomination', extracted, formOptions, contentLanguage)
  const coinTypeTax = getTaxonomyMatchForReview('coin_type', extracted, formOptions, contentLanguage)
  const seriesTax = getTaxonomyMatchForReview('coin_series', extracted, formOptions, contentLanguage)

  const basicFields: CoinImportReviewFieldRow[] = [
    buildReviewFieldRow({
      key: 'country',
      labelKey: 'coinImport.fields.country',
      formField: 'country',
      aiValue: countryTax.aiValue || mapped.country,
      matchedValue: mapped.country || countryTax.matchedName,
      isTaxonomy: true,
      sourceKeys: ['country', 'coin_country', 'countryCode', 'country_code'],
      currentValue: currentValues.country,
      result,
      multiSource,
      derivedFromSource: importMap.derivedNotes.country,
    }),
    buildReviewFieldRow({
      key: 'country_code',
      labelKey: 'coinImport.fields.countryCode',
      aiValue: extracted.countryCode,
      displayOnly: true,
      sourceKeys: ['countryCode', 'country_code', 'coin_country_code'],
      currentValue: '',
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'year',
      labelKey: 'coinImport.fields.year',
      formField: 'year',
      aiValue: mapped.year ?? extracted.year,
      applyValue: mapped.year,
      sourceKeys: ['year'],
      currentValue: currentValues.year,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'denomination',
      labelKey: 'coinImport.fields.denomination',
      formField: 'denomination',
      aiValue: denominationTax.aiValue,
      matchedValue: denominationTax.matchedName,
      isTaxonomy: true,
      sourceKeys: ['denomination', 'coin_value'],
      currentValue: currentValues.denomination,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_type',
      labelKey: 'coinImport.fields.coin_type',
      formField: 'coin_type',
      aiValue: coinTypeTax.aiValue,
      matchedValue: coinTypeTax.matchedName,
      isTaxonomy: true,
      sourceKeys: ['coinType', 'coin_type'],
      currentValue: currentValues.coin_type,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_series',
      labelKey: 'coinImport.fields.coin_series',
      formField: 'coin_series',
      aiValue: seriesTax.aiValue,
      matchedValue: seriesTax.matchedName,
      isTaxonomy: true,
      sourceKeys: ['series', 'coin_series'],
      currentValue: currentValues.coin_series,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_theme',
      labelKey: 'coinImport.fields.coin_theme',
      formField: 'coin_theme',
      aiValue: mapped.coin_theme ?? extracted.theme ?? extracted.title,
      applyValue: mapped.coin_theme,
      sourceKeys: ['theme', 'title', 'coin_theme'],
      currentValue: currentValues.coin_theme,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_designer',
      labelKey: 'coinImport.fields.coin_designer',
      formField: 'coin_designer',
      aiValue: mapped.coin_designer ?? extracted.designer,
      applyValue: mapped.coin_designer,
      sourceKeys: ['designer', 'coin_designer'],
      currentValue: currentValues.coin_designer,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'short_description',
      labelKey: 'coinImport.fields.short_description',
      formField: 'short_description',
      aiValue: mapped.short_description ?? extracted.shortDescription,
      applyValue: mapped.short_description,
      sourceKeys: ['shortDescription', 'short_description'],
      currentValue: currentValues.short_description,
      result,
      multiSource,
    }),
  ]

  const releaseFields: CoinImportReviewFieldRow[] = [
    buildReviewFieldRow({
      key: 'released_date',
      labelKey: 'coinImport.fields.released_date',
      formField: 'released_date',
      aiValue: extracted.releaseDate || mapped.released_date,
      applyValue: mapped.released_date,
      sourceKeys: ['releaseDate', 'release_date', 'released_date'],
      currentValue: currentValues.released_date,
      result,
      multiSource,
      derivedFromSource: importMap.derivedNotes.released_date,
    }),
    buildReviewFieldRow({
      key: 'coin_issue_status',
      labelKey: 'coinImport.fields.coin_issue_status',
      formField: 'coin_issue_status',
      aiValue: pickFirstNonEmpty(extracted.issueStatus, importMap.coin_issue_status),
      applyValue: importMap.coin_issue_status,
      sourceKeys: ['issueStatus', 'issue_status', 'coin_issue_status', 'releaseDate', 'released_date'],
      currentValue: currentValues.coin_issue_status,
      result,
      multiSource,
      derivedFromSource: importMap.derivedNotes.coin_issue_status,
    }),
    buildReviewFieldRow({
      key: 'coin_mintage',
      labelKey: 'coinImport.fields.coin_mintage',
      formField: 'coin_mintage',
      aiValue: extracted.mintage || mapped.coin_mintage,
      applyValue: mapped.coin_mintage,
      sourceKeys: ['mintage', 'coin_mintage', 'totalMintage', 'auflage'],
      currentValue: currentValues.coin_mintage,
      result,
      multiSource,
      derivedFromSource: importMap.derivedNotes.coin_mintage,
    }),
    buildReviewFieldRow({
      key: 'coin_material',
      labelKey: 'coinImport.fields.coin_material',
      formField: 'coin_material',
      aiValue: mapped.coin_material ?? extracted.material,
      applyValue: mapped.coin_material,
      sourceKeys: ['material', 'coin_material'],
      currentValue: currentValues.coin_material,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_weight_g',
      labelKey: 'coinImport.review.weight',
      formField: 'coin_weight_g',
      aiValue: extracted.weightG,
      applyValue: extracted.weightG,
      sourceKeys: ['weightG', 'weight_g', 'weight', 'coin_weight_g'],
      currentValue: currentValues.coin_weight_g,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_diameter_mm',
      labelKey: 'coinImport.review.diameter',
      formField: 'coin_diameter_mm',
      aiValue: extracted.diameterMm,
      applyValue: extracted.diameterMm,
      sourceKeys: ['diameterMm', 'diameter_mm', 'diameter', 'coin_diameter_mm'],
      currentValue: currentValues.coin_diameter_mm,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_thickness_mm',
      labelKey: 'coinImport.review.thickness',
      formField: 'coin_thickness_mm',
      aiValue: extracted.thicknessMm,
      applyValue: extracted.thicknessMm,
      sourceKeys: ['thicknessMm', 'thickness_mm', 'thickness', 'coin_thickness_mm'],
      currentValue: currentValues.coin_thickness_mm,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_edge_inscription',
      labelKey: 'coinImport.preview.edgeInscription',
      formField: 'coin_edge_inscription',
      aiValue: extracted.edgeInscription,
      applyValue: extracted.edgeInscription,
      sourceKeys: ['edgeInscription', 'edge_inscription', 'coin_edge_inscription'],
      currentValue: currentValues.coin_edge_inscription,
      result,
      multiSource,
    }),
  ]

  const descriptionFields: CoinImportReviewFieldRow[] = [
    buildReviewFieldRow({
      key: 'coin_obverse_description',
      labelKey: 'coinImport.fields.coin_obverse_description',
      formField: 'coin_obverse_description',
      aiValue: mapped.coin_obverse_description ?? extracted.obverseDescription,
      applyValue: mapped.coin_obverse_description,
      sourceKeys: ['obverseDescription', 'coin_obverse_description'],
      currentValue: currentValues.coin_obverse_description,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_reverse_description',
      labelKey: 'coinImport.fields.coin_reverse_description',
      formField: 'coin_reverse_description',
      aiValue: mapped.coin_reverse_description ?? extracted.reverseDescription,
      applyValue: mapped.coin_reverse_description,
      sourceKeys: ['reverseDescription', 'coin_reverse_description'],
      currentValue: currentValues.coin_reverse_description,
      result,
      multiSource,
    }),
    buildReviewFieldRow({
      key: 'coin_historical_background',
      labelKey: 'coinImport.fields.coin_historical_background',
      formField: 'coin_historical_background',
      aiValue: mapped.coin_historical_background ?? extracted.historicalBackground,
      applyValue: mapped.coin_historical_background,
      sourceKeys: ['historicalBackground', 'coin_historical_background'],
      currentValue: currentValues.coin_historical_background,
      result,
      multiSource,
    }),
  ]

  const sourceFields: CoinImportReviewFieldRow[] = [
    buildReviewFieldRow({
      key: 'coin_source_name',
      labelKey: 'coinImport.fields.coin_source_name',
      formField: 'coin_source_name',
      aiValue: pickFirstNonEmpty(extracted.sourceName, result.sourceName) || mapped.coin_source_name,
      applyValue: mapped.coin_source_name,
      sourceKeys: [
        'sourceName',
        'source_name',
        'coin_source_name',
        'official_source_name',
        'officialSourceName',
        'provider',
        'publisher',
        'site_name',
        'siteName',
      ],
      currentValue: currentValues.coin_source_name,
      result,
      multiSource,
      derivedFromSource: importMap.derivedNotes.coin_source_name,
    }),
    buildReviewFieldRow({
      key: 'coin_source_url',
      labelKey: 'coinImport.fields.coin_source_url',
      formField: 'coin_source_url',
      aiValue: pickFirstNonEmpty(extracted.sourceUrl, result.sourceUrl) || mapped.coin_source_url,
      applyValue: mapped.coin_source_url,
      sourceKeys: [
        'sourceUrl',
        'source_url',
        'coin_source_url',
        'url',
        'page_url',
        'pageUrl',
        'canonical_url',
        'canonicalUrl',
        'original_url',
        'originalUrl',
        'import_url',
        'importUrl',
      ],
      currentValue: currentValues.coin_source_url,
      result,
      multiSource,
      derivedFromSource: importMap.derivedNotes.coin_source_url,
    }),
  ]

  const mintVariants = extracted.mintVariants ?? []
  const mintSource = resolveImportReviewSourceBadge(
    readReviewFieldSource(result, ['mintVariants', 'mint_variants', 'coin_mint_variants', 'mint']),
    multiSource,
  )
  const hasExistingMintData = hasUserMintData(currentValues)

  const mintRows: CoinImportReviewMintRow[] = mintVariants.map((row) => {
    const existingRow = currentValues.mintVariants.find(
      (entry) => normalizeMintMarkCode(entry.mintMarkCode) === row.mintMarkCode,
    )
    const hasExistingRow = Boolean(
      existingRow &&
        (existingRow.mintMintage.trim() || existingRow.mintNotes.trim() || existingRow.mintMarkCode.trim()),
    )
    const aiPresent = Boolean(row.mintMarkCode.trim())
    let status: CoinImportReviewFieldStatus = 'missing'
    if (aiPresent) {
      status = hasExistingRow || hasExistingMintData ? 'existing_value' : 'ready'
    }

    return {
      mintMarkCode: row.mintMarkCode,
      city: row.mintNotes || getMintMarkLabel(row.mintMarkCode) || '',
      mintage: row.mintMintage,
      source: mintSource,
      confidence: result.confidence,
      status,
      defaultSelected: status === 'ready',
    }
  })

  return {
    sections: [
      { id: 'basic', labelKey: 'coinImport.review.sectionBasic', fields: basicFields },
      { id: 'release_specs', labelKey: 'coinImport.review.sectionReleaseSpecs', fields: releaseFields },
      { id: 'source', labelKey: 'coinImport.review.sectionSource', fields: sourceFields },
      { id: 'descriptions', labelKey: 'coinImport.review.sectionDescriptions', fields: descriptionFields },
    ],
    mintRows,
    hasExistingMintData,
    confidence: result.confidence,
    derivedNotes: importMap.derivedNotes,
    coinIssueStatus: importMap.coin_issue_status,
  }
}

function setReviewFormField(
  target: CoinFormValues,
  field: CoinImportFormFieldKey | CoinImportReviewExtendedFormKey,
  value: string,
): void {
  if (field === 'coin_weight_g') {
    target.coin_weight_g = value
    return
  }
  if (field === 'coin_diameter_mm') {
    target.coin_diameter_mm = value
    return
  }
  if (field === 'coin_thickness_mm') {
    target.coin_thickness_mm = value
    return
  }
  if (field === 'coin_edge_inscription') {
    target.coin_edge_inscription = value
    return
  }
  if (field === 'coin_issue_status') {
    target.coin_issue_status = value as CoinIssueStatus
    return
  }

  setImportedFormField(target, field as CoinImportFormFieldKey, value)
}

function applyImportSourceAttribution(
  target: CoinFormValues,
  fieldRows: CoinImportReviewFieldRow[],
): void {
  const sourceNameRow = fieldRows.find((row) => row.key === 'coin_source_name')
  const sourceUrlRow = fieldRows.find((row) => row.key === 'coin_source_url')

  if (
    sourceNameRow?.applyValue?.trim() &&
    !target.coin_source_name.trim() &&
    sourceNameRow.status !== 'needs_review' &&
    sourceNameRow.status !== 'missing'
  ) {
    target.coin_source_name = sourceNameRow.applyValue.trim()
  }

  if (
    sourceUrlRow?.applyValue?.trim() &&
    !target.coin_source_url.trim() &&
    sourceUrlRow.status !== 'needs_review' &&
    sourceUrlRow.status !== 'missing'
  ) {
    target.coin_source_url = sourceUrlRow.applyValue.trim()
  }
}

export function applySelectedImportReview(
  current: CoinFormValues,
  review: CoinImportReviewModel,
  selection: CoinImportReviewSelection,
  extended?: CoinImportExtendedData,
): CoinFormValues {
  const next: CoinFormValues = {
    ...current,
    mintVariants: current.mintVariants.map((row) => ({ ...row })),
  }

  const selectedFields = new Set(selection.fieldKeys)
  const fieldRows = review.sections.flatMap((section) => section.fields)

  for (const row of fieldRows) {
    if (row.displayOnly || !selectedFields.has(row.key)) {
      continue
    }
    if (row.status === 'needs_review' || row.status === 'missing') {
      continue
    }
    if (!row.applyValue?.trim() || !row.formField) {
      continue
    }

    if (TAXONOMY_REVIEW_FIELDS.has(row.formField as CoinImportFormFieldKey)) {
      if (!row.matchedValue?.trim()) {
        continue
      }
      setImportedFormField(next, row.formField as CoinImportFormFieldKey, row.matchedValue)
      continue
    }

    setReviewFormField(next, row.formField, row.applyValue)
  }

  applyImportSourceAttribution(next, fieldRows)

  const selectedMintCodes = selection.mintMarkCodes.filter(Boolean)
  const importedVariants: CoinImportMintVariant[] = []

  for (const code of selectedMintCodes) {
    const fromExtended = extended?.mintVariants?.find((row) => row.mintMarkCode === code)
    if (fromExtended) {
      importedVariants.push(fromExtended)
      continue
    }

    const fromReview = review.mintRows.find((row) => row.mintMarkCode === code)
    if (!fromReview || fromReview.status === 'missing' || fromReview.status === 'needs_review') {
      continue
    }

    importedVariants.push({
      mintMarkCode: fromReview.mintMarkCode,
      mintMintage: fromReview.mintage,
      mintNotes: fromReview.city,
    })
  }

  if (importedVariants.length > 0) {
    const canApplyMint = !review.hasExistingMintData || selection.replaceExistingMint
    if (canApplyMint) {
      next.hasMintVariants = true
      next.singleMintMark = ''
      next.mintMarksAvailable =
        extended?.mintMarksAvailable?.trim() ||
        importedVariants.map((row) => row.mintMarkCode).join(', ')
      next.mintVariants = ensureMintVariantClientIds(
        importedVariants.map((row) => ({
          mintMarkCode: normalizeMintMarkCode(row.mintMarkCode),
          mintMintage: row.mintMintage,
          mintNotes: row.mintNotes || getMintMarkLabel(normalizeMintMarkCode(row.mintMarkCode)) || '',
        })),
      )
    }
  }

  return next
}

function hasUserMintData(values: CoinFormValues): boolean {
  if (values.hasMintVariants) {
    return values.mintVariants.some(
      (row) => row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim(),
    )
  }

  return Boolean(values.singleMintMark.trim() || values.mintMarksAvailable.trim())
}

function applyImportExtendedToFormValues(
  next: CoinFormValues,
  extended: CoinImportExtendedData,
  mode: CoinImportApplyMode,
): Pick<CoinImportApplyReport, 'appliedMintRows' | 'skippedMintReason'> {
  const specFields: Array<keyof Pick<
    CoinFormValues,
    'coin_weight_g' | 'coin_diameter_mm' | 'coin_thickness_mm' | 'coin_edge_inscription'
  >> = ['coin_weight_g', 'coin_diameter_mm', 'coin_thickness_mm', 'coin_edge_inscription']

  for (const field of specFields) {
    const importedValue = extended[field]?.trim()
    if (!importedValue) {
      continue
    }

    const currentValue = String(next[field] ?? '').trim()
    if (currentValue && mode === 'empty-only') {
      continue
    }
    if (currentValue && currentValue !== importedValue && mode !== 'replace-all') {
      continue
    }
    if (!currentValue || mode === 'replace-all') {
      next[field] = importedValue
    }
  }

  const importedVariants = (extended.mintVariants ?? []).filter((row) => row.mintMarkCode.trim())
  if (!importedVariants.length) {
    return { appliedMintRows: 0, skippedMintReason: 'no_variants' }
  }

  if (hasUserMintData(next)) {
    if (mode !== 'replace-all') {
      return { appliedMintRows: 0, skippedMintReason: 'existing_data' }
    }
  }

  next.hasMintVariants = true
  next.singleMintMark = ''

  if (extended.mintMarksAvailable?.trim()) {
    next.mintMarksAvailable = extended.mintMarksAvailable.trim()
  } else {
    next.mintMarksAvailable = importedVariants.map((row) => row.mintMarkCode).join(', ')
  }

  next.mintVariants = ensureMintVariantClientIds(
    importedVariants.map((row) => ({
      mintMarkCode: normalizeMintMarkCode(row.mintMarkCode),
      mintMintage: row.mintMintage,
      mintNotes: row.mintNotes || getMintMarkLabel(normalizeMintMarkCode(row.mintMarkCode)) || '',
    })),
  )

  return { appliedMintRows: next.mintVariants.length }
}

export const CATALOGUE_TEXT_SOURCE_LABEL = 'pasted_catalogue'

const CATALOGUE_MINT_LINE_PATTERN =
  /^(\d{4})?([ADFJG])\s+(?:[ADFJG][-·.]?\s*)?(.+?)\s+([\d][\d.,\s]*)$/i

const MINT_CITY_ALIASES: Record<string, string> = {
  berlin: 'Berlin',
  munich: 'Munich',
  munchen: 'Munich',
  stuttgart: 'Stuttgart',
  karlsruhe: 'Karlsruhe',
  hamburg: 'Hamburg',
  hamburgo: 'Hamburg',
}

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}

function isMintTableHeaderLine(line: string): boolean {
  const lower = line.toLowerCase()
  return /\byear\b/.test(lower) && /\bmint\b/.test(lower) && /\bmintage\b/.test(lower)
}

function normalizeMintCityName(raw: string, mintMarkCode: string): string {
  const fromLocation = raw
    .replace(/^[-·.\s]+/, '')
    .replace(/^[ADFJG][-·.]?\s*/i, '')
    .trim()

  if (!fromLocation) {
    return getMintMarkLabel(mintMarkCode) || ''
  }

  const key = stripDiacritics(fromLocation).toLowerCase()
  const fromAlias = MINT_CITY_ALIASES[key]
  if (fromAlias) {
    return fromAlias
  }

  return getMintMarkLabel(mintMarkCode) || fromLocation
}

function extractMintageFromText(text: string): string {
  const matches = [...text.matchAll(/([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d{4,})/g)]
  if (matches.length === 0) {
    return ''
  }

  return normalizeImportMintage(matches[matches.length - 1][1])
}

function looksLikeMintageColumn(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 4 && /^[\d][\d.,\s]*$/.test(value.trim())
}

function parseMintFromColumns(cols: string[]): CoinImportMintVariant | null {
  let yearMintCol: string | null = null
  let locationCol: string | null = null
  let mintageCol: string | null = null

  for (const col of cols) {
    if (!yearMintCol && /\d{4}[ADFJG]/i.test(col)) {
      yearMintCol = col
    }
    if (!locationCol && /[ADFJG][-·.]/i.test(col)) {
      locationCol = col
    }
    if (looksLikeMintageColumn(col)) {
      mintageCol = col
    }
  }

  if (!yearMintCol) {
    return null
  }

  const yearMintMatch = yearMintCol.match(/(\d{4})([ADFJG])/i)
  if (!yearMintMatch) {
    return null
  }

  const mintMarkCode = normalizeMintMarkCode(yearMintMatch[2].toUpperCase())
  if (!isKnownMintMarkCode(mintMarkCode)) {
    return null
  }

  const mintage = mintageCol
    ? normalizeImportMintage(mintageCol)
    : extractMintageFromText(cols.join(' '))
  if (!mintage) {
    return null
  }

  const city = locationCol
    ? normalizeMintCityName(locationCol, mintMarkCode)
    : getMintMarkLabel(mintMarkCode) || ''

  return {
    mintMarkCode,
    mintMintage: mintage,
    mintNotes: city,
  }
}

function parseMintFromFreeText(text: string): CoinImportMintVariant | null {
  const yearMintMatch = text.match(/(\d{4})([ADFJG])/i)
  if (yearMintMatch) {
    const mintMarkCode = normalizeMintMarkCode(yearMintMatch[2].toUpperCase())
    if (!isKnownMintMarkCode(mintMarkCode)) {
      return null
    }

    const mintage = extractMintageFromText(text)
    if (!mintage) {
      return null
    }

    const locMatch = text.match(/([ADFJG])[-·.]([A-Za-zÀ-ÿ]+)/i)
    const city =
      locMatch && normalizeMintMarkCode(locMatch[1]) === mintMarkCode
        ? normalizeMintCityName(locMatch[2], mintMarkCode)
        : getMintMarkLabel(mintMarkCode) || ''

    return {
      mintMarkCode,
      mintMintage: mintage,
      mintNotes: city,
    }
  }

  const legacyMatch = text.match(CATALOGUE_MINT_LINE_PATTERN)
  if (!legacyMatch) {
    return null
  }

  const mintMarkCode = normalizeMintMarkCode(legacyMatch[2].toUpperCase())
  if (!isKnownMintMarkCode(mintMarkCode)) {
    return null
  }

  const city = normalizeMintCityName(legacyMatch[3], mintMarkCode)

  return {
    mintMarkCode,
    mintMintage: normalizeImportMintage(legacyMatch[4]),
    mintNotes: city || getMintMarkLabel(mintMarkCode) || '',
  }
}

function parseCatalogueMintLine(line: string): CoinImportMintVariant | null {
  const trimmed = line.trim()
  if (!trimmed || isMintTableHeaderLine(trimmed) || /^mint\s+manufacturing/i.test(trimmed)) {
    return null
  }

  if (trimmed.includes('\t')) {
    const cols = trimmed
      .split('\t')
      .map((col) => col.trim())
      .filter((col) => col && col !== '-')
    const fromColumns = parseMintFromColumns(cols)
    if (fromColumns) {
      return fromColumns
    }
  }

  const freeText = trimmed.replace(/^-\s+/, '')
  return parseMintFromFreeText(freeText)
}

export function parsePastedCatalogueText(text: string): {
  mintVariants: CoinImportMintVariant[]
  mintMarksAvailable: string
} {
  const rows: CoinImportMintVariant[] = []
  const seen = new Set<string>()

  for (const line of text.split(/\r?\n/)) {
    const parsed = parseCatalogueMintLine(line)
    if (!parsed || seen.has(parsed.mintMarkCode)) {
      continue
    }
    seen.add(parsed.mintMarkCode)
    rows.push(parsed)
  }

  return {
    mintVariants: rows,
    mintMarksAvailable: rows.map((row) => row.mintMarkCode).join(', '),
  }
}

export function enrichImportResultWithCatalogueText(
  result: CoinLinkImportResult,
  catalogueText: string,
  options: { preferPasted?: boolean } = {},
): CoinLinkImportResult {
  const parsed = parsePastedCatalogueText(catalogueText)
  if (parsed.mintVariants.length === 0) {
    return result
  }

  const existingMint = result.extracted.mintVariants ?? []
  const shouldUsePasted = options.preferPasted || existingMint.length === 0
  if (!shouldUsePasted) {
    return result
  }

  const fieldSources = {
    ...result.fieldSources,
    ...result.extracted.fieldSources,
    mintVariants: CATALOGUE_TEXT_SOURCE_LABEL,
    mint_variants: CATALOGUE_TEXT_SOURCE_LABEL,
    coin_mint_variants: CATALOGUE_TEXT_SOURCE_LABEL,
  }

  const warnings = [...result.warnings]
  const pastedWarning =
    'Using pasted catalogue table text for mint variants.'
  if (options.preferPasted && !warnings.some((entry) => entry.toLowerCase().includes('pasted catalogue'))) {
    warnings.push(pastedWarning)
  }

  return {
    ...result,
    confidence: result.confidence === 'high' ? 'medium' : result.confidence,
    extracted: {
      ...result.extracted,
      hasMintVariants: true,
      mintVariants: parsed.mintVariants,
      mintMarksAvailable: parsed.mintMarksAvailable,
      fieldSources,
    },
    fieldSources,
    warnings,
  }
}

export function buildMinimalImportResultFromCatalogueText(
  catalogueText: string,
  sourceUrl: string,
): CoinLinkImportResult | null {
  const parsed = parsePastedCatalogueText(catalogueText)
  if (parsed.mintVariants.length === 0) {
    return null
  }

  const fieldSources = {
    mintVariants: CATALOGUE_TEXT_SOURCE_LABEL,
    mint_variants: CATALOGUE_TEXT_SOURCE_LABEL,
    coin_mint_variants: CATALOGUE_TEXT_SOURCE_LABEL,
  }

  return {
    sourceUrl,
    sourceName: 'European Central Bank',
    confidence: 'medium',
    extracted: {
      hasMintVariants: true,
      mintVariants: parsed.mintVariants,
      mintMarksAvailable: parsed.mintMarksAvailable,
      fieldSources,
    },
    missing: ['mint_variants', 'mint_mintage_by_mint'],
    warnings: [
      'Showing pasted catalogue table data for mint variants.',
    ],
    fieldSources,
  }
}

export function getCatalogueTextPreviewRows(
  text: string,
): CoinImportMintVariant[] {
  return parsePastedCatalogueText(text).mintVariants
}

export type CoinImportReviewSummary = {
  fieldsFound: number
  readyToApply: number
  needsReview: number
  existingValues: number
}

export function computeReviewSummaryStats(review: CoinImportReviewModel): CoinImportReviewSummary {
  const rows = review.sections
    .flatMap((section) => section.fields)
    .filter((row) => !row.displayOnly && row.status !== 'missing')

  return {
    fieldsFound: rows.length,
    readyToApply: rows.filter((row) => row.status === 'ready').length,
    needsReview: rows.filter((row) => row.status === 'needs_review').length,
    existingValues: rows.filter((row) => row.status === 'existing_value').length,
  }
}

const MAX_FORM_MINT_VARIANTS = 5

export function parseMintRowsFromText(text: string): CoinImportMintVariant[] {
  return parsePastedCatalogueText(text).mintVariants
}

export type MintTablePreviewRow = {
  mintMarkCode: string
  city: string
  mintage: string
  status: 'ready' | 'already_exists'
}

export function buildMintTablePreview(
  text: string,
  current: Pick<CoinFormValues, 'mintVariants'>,
): MintTablePreviewRow[] {
  const parsed = parseMintRowsFromText(text)
  const existingCodes = new Set(
    current.mintVariants
      .filter(isMintVariantRowFilled)
      .map((row) => normalizeMintMarkCode(row.mintMarkCode))
      .filter(Boolean),
  )

  return parsed.map((row) => ({
    mintMarkCode: row.mintMarkCode,
    city: row.mintNotes || getMintMarkLabel(row.mintMarkCode) || '',
    mintage: row.mintMintage,
    status: existingCodes.has(row.mintMarkCode) ? 'already_exists' : 'ready',
  }))
}

export type ApplyPastedMintTableResult = {
  hasMintVariants: boolean
  mintVariants: MintVariantRow[]
  mintMarksAvailable: string
  addedCount: number
  skippedDuplicates: number
}

export function applyDetectedMintRows(
  detected: CoinImportMintVariant[],
  current: Pick<CoinFormValues, 'hasMintVariants' | 'mintMarksAvailable' | 'mintVariants'>,
  options: { replaceExisting: boolean },
): ApplyPastedMintTableResult | null {
  if (detected.length === 0) {
    return null
  }

  const newRows: MintVariantRow[] = detected.map((row) => ({
    clientId: crypto.randomUUID(),
    mintMarkCode: row.mintMarkCode,
    mintMintage: row.mintMintage,
    mintNotes: row.mintNotes || getMintMarkLabel(row.mintMarkCode) || '',
  }))

  const filledExisting = current.mintVariants.filter(isMintVariantRowFilled)
  const hasExisting = filledExisting.length > 0

  let merged: MintVariantRow[]
  let addedCount: number
  let skippedDuplicates = 0

  if (hasExisting && options.replaceExisting) {
    merged = ensureMintVariantClientIds(newRows).slice(0, MAX_FORM_MINT_VARIANTS)
    addedCount = merged.length
  } else if (hasExisting) {
    const existingCodes = new Set(
      filledExisting
        .map((row) => normalizeMintMarkCode(row.mintMarkCode))
        .filter(Boolean),
    )
    const toAdd = newRows.filter((row) => {
      const code = normalizeMintMarkCode(row.mintMarkCode)
      if (code && existingCodes.has(code)) {
        skippedDuplicates += 1
        return false
      }
      return true
    })
    merged = ensureMintVariantClientIds([...filledExisting, ...toAdd]).slice(0, MAX_FORM_MINT_VARIANTS)
    addedCount = toAdd.length
  } else {
    merged = ensureMintVariantClientIds(newRows).slice(0, MAX_FORM_MINT_VARIANTS)
    addedCount = merged.length
  }

  if (addedCount === 0 && skippedDuplicates > 0) {
    return null
  }

  const allCodes = merged
    .map((row) => normalizeMintMarkCode(row.mintMarkCode))
    .filter(Boolean)

  return {
    hasMintVariants: true,
    mintVariants: merged,
    mintMarksAvailable: allCodes.join(', '),
    addedCount,
    skippedDuplicates,
  }
}

export function applyPastedMintTableToForm(
  text: string,
  current: Pick<CoinFormValues, 'hasMintVariants' | 'mintMarksAvailable' | 'mintVariants'>,
  options: { replaceExisting: boolean },
): ApplyPastedMintTableResult | null {
  return applyDetectedMintRows(parseMintRowsFromText(text), current, options)
}

export function isCatalogueImportFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('403') ||
    message.includes('foronum') ||
    message.includes('failed to fetch the coin page') ||
    message.includes('failed to fetch')
  )
}

export function getOfficialCoinImportUrls(urls: string[]): string[] {
  return urls.filter((url) => {
    try {
      const host = new URL(url).hostname.toLowerCase()
      return (
        SUPPORTED_COIN_IMPORT_HOSTS.has(host) ||
        host.endsWith('.bundesbank.de') ||
        host.endsWith('.ecb.europa.eu')
      )
    } catch {
      return false
    }
  })
}

export function normalizeCoinLinkImportResult(data: unknown, fallbackUrl: string): CoinLinkImportResult {
  const record =
    typeof data === 'object' && data !== null
      ? ((data as Record<string, unknown>).result ?? data)
      : {}

  if (typeof record !== 'object' || record === null) {
    throw new Error('Invalid coin import response.')
  }

  const payload = record as Record<string, unknown>
  const extractedRaw =
    typeof payload.extracted === 'object' && payload.extracted !== null
      ? (payload.extracted as Record<string, unknown>)
      : {}

  const confidence =
    payload.confidence === 'high' || payload.confidence === 'medium' || payload.confidence === 'low'
      ? payload.confidence
      : 'medium'

  const images = Array.isArray(extractedRaw.images)
    ? extractedRaw.images.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined

  const extracted = normalizeExtractedFromRaw(extractedRaw)
  if (images) {
    extracted.images = images
  }

  const fieldSources =
    readFieldSources(payload.fieldSources ?? payload.field_sources) ?? extracted.fieldSources

  const sources = readImportSources(payload.sources)
  const blockedSources = readStringArray(payload.blocked_sources ?? payload.blockedSources)
  const catalogueTextRequired =
    payload.catalogue_text_required === true || payload.catalogueTextRequired === true

  const sourceUrl =
    sanitizeImportSourceUrl(
      pickFirstNonEmptyString(
        readOptionalString(payload.sourceUrl),
        readOptionalString(payload.source_url),
        extracted.sourceUrl,
        sources[0]?.url,
        fallbackUrl,
      ),
    ) || sanitizeImportSourceUrl(fallbackUrl)

  const explicitSourceName = normalizeKnownSourceName(
    pickFirstNonEmptyString(
      readOptionalString(payload.sourceName),
      readOptionalString(payload.source_name),
      readOptionalString(payload.official_source_name),
      readOptionalString(payload.officialSourceName),
      extracted.sourceName,
      sources[0]?.label,
    ),
  )

  const resolvedSourceName = explicitSourceName || resolveOfficialSourceNameFromUrl(sourceUrl)
  const sourceName: CoinLinkImportSourceName =
    resolvedSourceName === 'Deutsche Bundesbank'
      ? 'Deutsche Bundesbank'
      : resolvedSourceName === 'European Central Bank'
        ? 'European Central Bank'
        : sourceUrl.includes('bundesbank.de')
          ? 'Deutsche Bundesbank'
          : 'European Central Bank'

  if (sourceUrl && !extracted.sourceUrl) {
    extracted.sourceUrl = sourceUrl
  }
  if (resolvedSourceName && !extracted.sourceName) {
    extracted.sourceName = resolvedSourceName
  }

  return {
    sourceUrl,
    sourceName,
    confidence,
    extracted: {
      ...extracted,
      fieldSources,
    },
    missing: readStringArray(payload.missing),
    warnings: readStringArray(payload.warnings),
    fieldSources,
    catalogueTextRequired: catalogueTextRequired || undefined,
    blockedSources: blockedSources.length > 0 ? blockedSources : undefined,
    sources: sources.length > 0 ? sources : undefined,
  }
}

function readImportSources(value: unknown): CoinLinkImportSourceEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  const entries: CoinLinkImportSourceEntry[] = []

  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      continue
    }

    const record = item as Record<string, unknown>
    const url = readOptionalString(record.url)
    if (!url) {
      continue
    }

    const rawStatus = readOptionalString(record.status)?.toLowerCase()
    const status: CoinLinkImportSourceStatus =
      rawStatus === 'blocked' || rawStatus === 'failed' ? rawStatus : 'success'

    entries.push({
      url,
      label: readOptionalString(record.label) ?? readOptionalString(record.name),
      status,
      blockedReason:
        readOptionalString(record.blocked_reason) ?? readOptionalString(record.blockedReason),
    })
  }

  return entries
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}
