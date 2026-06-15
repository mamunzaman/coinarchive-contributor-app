import type { CoinFormValues, ContentLanguage } from '../types/coinForm'
import type { CoinFormStepId } from '../types/coinFormSteps'
import {
  findTaxonomyOption,
  resolveCoinSeriesFormValue,
  resolveTaxonomyFormValue,
  type FormOptions,
} from '../types/formOptions'

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

  for (const key of STANDARD_MISSING_KEYS) {
    keys.add(key)
  }

  for (const item of result.missing) {
    const mapped = mapMissingTextToImportKey(item)
    if (mapped) {
      keys.add(mapped)
    }
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
}

export type CoinLinkImportResult = {
  sourceUrl: string
  sourceName: CoinLinkImportSourceName
  confidence: CoinLinkImportConfidence
  extracted: CoinLinkImportExtracted
  missing: string[]
  warnings: string[]
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

function resolveCountryFromImport(
  country: string | undefined,
  countryCode: string | undefined,
  options: FormOptions['countries'],
): string {
  const code = countryCode?.trim()
  if (code) {
    const upper = code.toUpperCase()
    const byCode = options.find(
      (option) =>
        option.slug.toUpperCase() === upper ||
        option.name.toUpperCase() === upper ||
        option.slug.toUpperCase().endsWith(`-${upper}`),
    )
    if (byCode) {
      return byCode.name
    }
  }

  if (country?.trim()) {
    return resolveTaxonomyFormValue(country, options)
  }

  return ''
}

function resolveDenominationFromImport(
  value: string | undefined,
  options: FormOptions['values'],
): string {
  if (!value?.trim()) {
    const twoEuro = options.find((option) => {
      const label = option.name.toLowerCase()
      return label.includes('2') && label.includes('euro')
    })
    return twoEuro?.name ?? ''
  }

  const resolved = resolveTaxonomyFormValue(value, options)
  if (findTaxonomyOption(resolved, options)) {
    return resolved
  }

  const lower = value.toLowerCase()
  if (lower.includes('2') && lower.includes('euro')) {
    const match = options.find((option) => {
      const label = option.name.toLowerCase()
      return label.includes('2') && label.includes('euro')
    })
    if (match) {
      return match.name
    }
  }

  return resolved
}

function resolveCoinTypeFromImport(
  value: string | undefined,
  options: FormOptions['types'],
): string {
  if (value?.trim()) {
    const resolved = resolveTaxonomyFormValue(value, options)
    if (findTaxonomyOption(resolved, options)) {
      return resolved
    }
  }

  const commemorative = options.find((option) => {
    const label = `${option.name} ${option.slug}`.toLowerCase()
    return label.includes('commemorative')
  })

  return commemorative?.name ?? resolveTaxonomyFormValue(value ?? '', options)
}

function resolveSeriesFromImport(
  value: string | undefined,
  formOptions: FormOptions,
  contentLanguage: ContentLanguage,
): string {
  if (!value?.trim()) {
    return ''
  }

  return resolveCoinSeriesFormValue(value, formOptions.series, contentLanguage)
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

const PAGE_CHROME_EXACT = new Set([
  'service navigation',
  'tasks',
  'cash management',
  'statistics',
  'press',
  'search',
  'login',
  'log in',
  'download',
  'home',
  'menu',
  'navigation',
  'breadcrumb',
  'skip to content',
  'site map',
  'sitemap',
  'contact',
  'legal notice',
  'privacy',
  'imprint',
  'deutsch',
  'english',
])

const PAGE_CHROME_PATTERNS: RegExp[] = [
  /^service navigation$/i,
  /^cash management$/i,
  /^site navigation$/i,
  /^main navigation$/i,
  /^footer navigation$/i,
  /^\d+\s+years?\s+of\s+euro\s+cash$/i,
  /^breadcrumb/i,
]

const PAGE_CHROME_CONTENT_TERMS = [
  'service navigation',
  'cash management',
  'bundesbank.de',
  'site map',
  'sitemap',
  'skip to content',
  'main navigation',
  'footer navigation',
  'press release',
  'cookie settings',
  'data protection',
]

function normalizeComparableText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isLikelyPageChrome(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return true
  }

  const normalized = normalizeComparableText(trimmed)
  if (normalized.length <= 2) {
    return true
  }

  if (PAGE_CHROME_EXACT.has(normalized)) {
    return true
  }

  for (const pattern of PAGE_CHROME_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true
    }
  }

  if (/^[\w\säöüß.-]+(\s*[>|/\\·›→]\s*[\w\säöüß.-]+){2,}$/i.test(trimmed)) {
    return true
  }

  return false
}

export function containsPageChromeContent(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  const lower = trimmed.toLowerCase()
  let hits = 0
  for (const term of PAGE_CHROME_CONTENT_TERMS) {
    if (lower.includes(term)) {
      hits += 1
    }
  }

  if (hits >= 2) {
    return true
  }

  if (trimmed.length > 180 && hits >= 1 && /\b(navigation|menu|login|search)\b/i.test(lower)) {
    return true
  }

  return false
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
): Partial<Record<CoinImportFormFieldKey, string>> {
  const extracted = result.extracted

  const mapped: Partial<Record<CoinImportFormFieldKey, string>> = {
    coin_theme: resolveThemeImportValue(extracted),
    country: resolveCountryFromImport(extracted.country, extracted.countryCode, formOptions.countries),
    year: sanitizeShortImportValue(extracted.year),
    denomination: resolveDenominationFromImport(
      sanitizeShortImportValue(extracted.denomination) || extracted.denomination,
      formOptions.values,
    ),
    coin_type: resolveCoinTypeFromImport(
      sanitizeShortImportValue(extracted.coinType) || extracted.coinType,
      formOptions.types,
    ),
    coin_series: resolveSeriesFromImport(
      sanitizeShortImportValue(extracted.series) || extracted.series,
      formOptions,
      contentLanguage,
    ),
    released_date: sanitizeShortImportValue(extracted.releaseDate),
    coin_mintage: sanitizeShortImportValue(extracted.mintage),
    coin_designer: sanitizeShortImportValue(extracted.designer),
    coin_material: sanitizeShortImportValue(extracted.material),
    coin_quality: sanitizeShortImportValue(extracted.quality),
    coin_obverse_description: sanitizeLongImportValue(extracted.obverseDescription),
    coin_reverse_description: sanitizeLongImportValue(extracted.reverseDescription),
    coin_historical_background: sanitizeLongImportValue(extracted.historicalBackground),
    short_description: sanitizeLongImportValue(extracted.shortDescription),
    coin_source_name: pickFirstNonEmpty(
      sanitizeShortImportValue(extracted.sourceName),
      result.sourceName,
    ),
    coin_source_url: pickFirstNonEmpty(
      sanitizeShortImportValue(extracted.sourceUrl),
      result.sourceUrl,
    ),
  }

  for (const key of COIN_IMPORT_FORM_FIELD_KEYS) {
    if (!mapped[key]?.trim()) {
      delete mapped[key]
    }
  }

  return mapped
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
): CoinFormValues {
  const next = { ...current }

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

  return next
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
  return preview.core.length + preview.descriptions.length + preview.source.length
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

  const sourceName =
    payload.sourceName === 'Deutsche Bundesbank' || payload.sourceName === 'European Central Bank'
      ? payload.sourceName
      : payload.sourceName === 'Bundesbank'
        ? 'Deutsche Bundesbank'
        : payload.sourceName === 'ECB'
          ? 'European Central Bank'
          : 'European Central Bank'

  const confidence =
    payload.confidence === 'high' || payload.confidence === 'medium' || payload.confidence === 'low'
      ? payload.confidence
      : 'medium'

  const images = Array.isArray(extractedRaw.images)
    ? extractedRaw.images.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined

  return {
    sourceUrl: typeof payload.sourceUrl === 'string' ? payload.sourceUrl : fallbackUrl,
    sourceName,
    confidence,
    extracted: {
      title: readOptionalString(extractedRaw.title),
      country: readOptionalString(extractedRaw.country),
      countryCode: readOptionalString(extractedRaw.countryCode),
      year: readOptionalString(extractedRaw.year),
      denomination: readOptionalString(extractedRaw.denomination),
      coinType: readOptionalString(extractedRaw.coinType),
      series: readOptionalString(extractedRaw.series),
      theme: readOptionalString(extractedRaw.theme),
      releaseDate: readOptionalString(extractedRaw.releaseDate),
      mintage: readOptionalString(extractedRaw.mintage),
      designer: readOptionalString(extractedRaw.designer),
      material: readOptionalString(extractedRaw.material),
      quality: readOptionalString(extractedRaw.quality),
      obverseDescription: readOptionalString(extractedRaw.obverseDescription),
      reverseDescription: readOptionalString(extractedRaw.reverseDescription),
      historicalBackground: readOptionalString(extractedRaw.historicalBackground),
      shortDescription: readOptionalString(extractedRaw.shortDescription),
      sourceUrl: readOptionalString(extractedRaw.sourceUrl),
      sourceName: readOptionalString(extractedRaw.sourceName),
      images,
    },
    missing: readStringArray(payload.missing),
    warnings: readStringArray(payload.warnings),
  }
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
