import {
  findCountryOptionFromImport,
  findTaxonomyOption,
  normalizeTaxonomyLookupText,
  type TaxonomyOption,
} from '../types/formOptions'

const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  germany: 'DE',
  deutschland: 'DE',
  'bundesrepublik deutschland': 'DE',
  andorra: 'AD',
  italy: 'IT',
  italien: 'IT',
  italia: 'IT',
  france: 'FR',
  frankreich: 'FR',
  spain: 'ES',
  spanien: 'ES',
  españa: 'ES',
  belgium: 'BE',
  belgien: 'BE',
  netherlands: 'NL',
  niederlande: 'NL',
  austria: 'AT',
  osterreich: 'AT',
  österreich: 'AT',
  finland: 'FI',
  finnland: 'FI',
  ireland: 'IE',
  irland: 'IE',
  portugal: 'PT',
  greece: 'GR',
  griechenland: 'GR',
  luxembourg: 'LU',
  luxemburg: 'LU',
  malta: 'MT',
  slovenia: 'SI',
  slowenien: 'SI',
  slovakia: 'SK',
  slowakei: 'SK',
  estonia: 'EE',
  estland: 'EE',
  latvia: 'LV',
  lettland: 'LV',
  lithuania: 'LT',
  litauen: 'LT',
  cyprus: 'CY',
  zypern: 'CY',
  monaco: 'MC',
  'san marino': 'SM',
  'vatican city': 'VA',
  vatikan: 'VA',
  croatia: 'HR',
  kroatien: 'HR',
}

const ISO_SLUG_TO_CODE: Record<string, string> = {
  de: 'DE',
  ad: 'AD',
  it: 'IT',
  fr: 'FR',
  es: 'ES',
  be: 'BE',
  nl: 'NL',
  at: 'AT',
  fi: 'FI',
  ie: 'IE',
  pt: 'PT',
  gr: 'EL',
  lu: 'LU',
  mt: 'MT',
  si: 'SI',
  sk: 'SK',
  ee: 'EE',
  lv: 'LV',
  lt: 'LT',
  cy: 'CY',
  mc: 'MC',
  sm: 'SM',
  va: 'VA',
  hr: 'HR',
}

export type CountryCodeResolutionDebug = {
  rawCountryValue: string
  matchedOption: TaxonomyOption | null
  resolvedCountryCode: string
  source: 'explicit_meta' | 'iso_slug' | 'option_name' | 'raw_value' | 'none'
}

function normalizeCountryLookupKey(value: string): string {
  return normalizeTaxonomyLookupText(value)
}

function isIsoCountryCode(value: string): boolean {
  return /^[A-Z]{2}$/.test(value.trim().toUpperCase())
}

function readExplicitCountryCode(option: TaxonomyOption): string | undefined {
  const extended = option as TaxonomyOption & { value?: string }
  const candidates = [
    option.country_code,
    option.countryCode,
    option.meta?.country_code,
    option.acf?.coin_country_code,
    option.acf?.country_code,
    extended.value,
  ]

  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed && isIsoCountryCode(trimmed)) {
      return trimmed.toUpperCase()
    }
  }

  return undefined
}

function lookupCountryNameFallback(value: string): string | undefined {
  const key = normalizeCountryLookupKey(value)
  if (!key) {
    return undefined
  }

  return COUNTRY_NAME_TO_ISO[key] ?? COUNTRY_NAME_TO_ISO[key.replace(/\s+/g, ' ')]
}

function lookupIsoSlug(slug: string): string | undefined {
  const key = slug.trim().toLowerCase()
  return ISO_SLUG_TO_CODE[key]
}

export function findCountryOptionForFormValue(
  value: string,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const numericId = Number.parseInt(trimmed, 10)
  if (Number.isFinite(numericId) && String(numericId) === trimmed) {
    const byId = options.find((option) => option.id === numericId)
    if (byId) {
      return byId
    }
  }

  return (
    findTaxonomyOption(trimmed, options) ??
    findCountryOptionFromImport(trimmed, undefined, options)
  )
}

export function resolveCountryCodeFromOption(
  option: TaxonomyOption,
): { code: string; source: CountryCodeResolutionDebug['source'] } {
  const explicit = readExplicitCountryCode(option)
  if (explicit) {
    return { code: explicit, source: 'explicit_meta' }
  }

  const fromSlug = lookupIsoSlug(option.slug)
  if (fromSlug) {
    return { code: fromSlug, source: 'iso_slug' }
  }

  const fromName = lookupCountryNameFallback(option.name)
  if (fromName) {
    return { code: fromName, source: 'option_name' }
  }

  const fromSlugName = lookupCountryNameFallback(option.slug.replace(/-/g, ' '))
  if (fromSlugName) {
    return { code: fromSlugName, source: 'option_name' }
  }

  return { code: '', source: 'none' }
}

export function resolveCountryCodeForFormValue(
  countryValue: string,
  options: TaxonomyOption[] = [],
  debug?: { log?: boolean },
): string {
  const resolution = resolveCountryCodeWithDebug(countryValue, options)
  if (debug?.log && import.meta.env.DEV) {
    console.info('[coin-form] country code resolution', resolution)
  }
  return resolution.resolvedCountryCode
}

export function resolveCountryCodeWithDebug(
  countryValue: string,
  options: TaxonomyOption[] = [],
): CountryCodeResolutionDebug {
  const trimmed = countryValue.trim()
  if (!trimmed) {
    return {
      rawCountryValue: '',
      matchedOption: null,
      resolvedCountryCode: '',
      source: 'none',
    }
  }

  if (isIsoCountryCode(trimmed)) {
    return {
      rawCountryValue: trimmed,
      matchedOption: null,
      resolvedCountryCode: trimmed.toUpperCase(),
      source: 'raw_value',
    }
  }

  const matchedOption = findCountryOptionForFormValue(trimmed, options)
  if (matchedOption) {
    const fromOption = resolveCountryCodeFromOption(matchedOption)
    if (fromOption.code) {
      return {
        rawCountryValue: trimmed,
        matchedOption,
        resolvedCountryCode: fromOption.code,
        source: fromOption.source,
      }
    }
  }

  const fromRaw = lookupCountryNameFallback(trimmed)
  if (fromRaw) {
    return {
      rawCountryValue: trimmed,
      matchedOption: matchedOption ?? null,
      resolvedCountryCode: fromRaw,
      source: 'raw_value',
    }
  }

  return {
    rawCountryValue: trimmed,
    matchedOption: matchedOption ?? null,
    resolvedCountryCode: '',
    source: 'none',
  }
}

export function extractCoinCodeCountryPrefix(coinCode: string): string {
  return coinCode.split('-')[0]?.trim().toUpperCase() ?? ''
}

export function coinCodeMatchesCountryCode(coinCode: string, countryCode: string): boolean {
  const prefix = extractCoinCodeCountryPrefix(coinCode)
  const normalizedCountry = countryCode.trim().toUpperCase()
  if (!prefix || !normalizedCountry) {
    return false
  }
  return prefix === normalizedCountry
}
