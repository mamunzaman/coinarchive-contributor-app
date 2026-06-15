import type { CoinFormValues, ContentLanguage } from '../types/coinForm'
import {
  findTaxonomyOption,
  resolveCoinSeriesFormValue,
  resolveTaxonomyFormValue,
  type FormOptions,
} from '../types/formOptions'

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

const STANDARD_MISSING_FIELDS = [
  'mint mark / mint variants',
  'exact mintage by mint',
  'quality',
  'edge inscription',
  'weight / diameter / thickness',
  'reverse image',
] as const

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

export function mapImportResultToFormValues(
  result: CoinLinkImportResult,
  formOptions: FormOptions,
  contentLanguage: ContentLanguage,
): Partial<Record<CoinImportFormFieldKey, string>> {
  const extracted = result.extracted

  const mapped: Partial<Record<CoinImportFormFieldKey, string>> = {
    coin_theme: pickFirstNonEmpty(extracted.theme, extracted.title),
    country: resolveCountryFromImport(extracted.country, extracted.countryCode, formOptions.countries),
    year: extracted.year?.trim() ?? '',
    denomination: resolveDenominationFromImport(extracted.denomination, formOptions.values),
    coin_type: resolveCoinTypeFromImport(extracted.coinType, formOptions.types),
    coin_series: resolveSeriesFromImport(extracted.series, formOptions, contentLanguage),
    released_date: extracted.releaseDate?.trim() ?? '',
    coin_mintage: extracted.mintage?.trim() ?? '',
    coin_designer: extracted.designer?.trim() ?? '',
    coin_material: extracted.material?.trim() ?? '',
    coin_quality: extracted.quality?.trim() ?? '',
    coin_obverse_description: extracted.obverseDescription?.trim() ?? '',
    coin_reverse_description: extracted.reverseDescription?.trim() ?? '',
    coin_historical_background: extracted.historicalBackground?.trim() ?? '',
    short_description: extracted.shortDescription?.trim() ?? '',
    coin_source_name: pickFirstNonEmpty(extracted.sourceName, result.sourceName),
    coin_source_url: pickFirstNonEmpty(extracted.sourceUrl, result.sourceUrl),
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
  const merged = new Set<string>(result.missing.map((entry) => entry.trim()).filter(Boolean))

  for (const field of STANDARD_MISSING_FIELDS) {
    merged.add(field)
  }

  const images = result.extracted.images ?? []
  if (images.length === 0) {
    merged.add('reverse image')
  } else if (images.length === 1) {
    merged.add('reverse image')
  }

  if (!result.extracted.quality?.trim()) {
    merged.add('quality')
  }

  return Array.from(merged)
}

export function getExtractedFieldEntries(
  result: CoinLinkImportResult,
): Array<{ key: keyof CoinLinkImportExtracted; labelKey: string; value: string }> {
  const entries: Array<{ key: keyof CoinLinkImportExtracted; labelKey: string; value: string }> = []
  const extracted = result.extracted

  for (const [extractedKey, formField] of Object.entries(EXTRACTED_TO_FORM_FIELD) as Array<
    [keyof CoinLinkImportExtracted, CoinImportFormFieldKey]
  >) {
    if (extractedKey === 'images' || extractedKey === 'countryCode') {
      continue
    }

    const raw = extracted[extractedKey]
    if (typeof raw !== 'string') {
      continue
    }

    const value = raw.trim()
    if (!value) {
      continue
    }

    entries.push({
      key: extractedKey,
      labelKey: `coinImport.fields.${formField}`,
      value,
    })
  }

  if (extracted.countryCode?.trim()) {
    entries.push({
      key: 'countryCode',
      labelKey: 'coinImport.fields.countryCode',
      value: extracted.countryCode.trim(),
    })
  }

  return entries
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
