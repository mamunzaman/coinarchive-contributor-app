import type { ContentLanguage } from './coinForm'
import { resolveCountryIsoFromImportText } from '../lib/countryCodeResolver'

export type TaxonomyOption = {
  id: number
  name: string
  slug: string
  country_code?: string
  countryCode?: string
  meta?: {
    country_code?: string
    [key: string]: unknown
  }
  acf?: {
    country_code?: string
    coin_country_code?: string
    [key: string]: unknown
  }
}

export type DefaultImageRef = {
  id: number
  url: string
  thumb_url?: string
}

export type DefaultImages = {
  obverse: DefaultImageRef | null
  reverse: DefaultImageRef | null
}

export type FormOptions = {
  countries: TaxonomyOption[]
  values: TaxonomyOption[]
  types: TaxonomyOption[]
  series: TaxonomyOption[]
}

export const TAXONOMY_OTHER_VALUE = '__other__'

export const TAXONOMY_OPTIONS_FAILED_MESSAGE =
  'Options could not be loaded. Please refresh and try again.'

export const TAXONOMY_INVALID_OPTION_MESSAGE = 'Please select a valid existing option.'

export const TAXONOMY_STALE_VALUE_MESSAGE =
  'This saved value is no longer available in the taxonomy list. Please choose a valid option.'

export function isKnownTaxonomyOption(value: string, options: TaxonomyOption[]): boolean {
  return Boolean(findTaxonomyOption(value, options))
}

export function findTaxonomyOption(
  value: string,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const lower = trimmed.toLowerCase()
  return options.find(
    (option) =>
      option.name === trimmed ||
      option.name.toLowerCase() === lower ||
      option.slug === trimmed ||
      option.slug.toLowerCase() === lower,
  )
}

export function normalizeTaxonomyLookupText(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[€$£]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function findTaxonomyOptionByNormalizedMatch(
  normalizedLookup: string,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  if (!normalizedLookup) {
    return undefined
  }

  return options.find((option) => {
    const nameNorm = normalizeTaxonomyLookupText(option.name)
    const slugNorm = normalizeTaxonomyLookupText(option.slug.replace(/-/g, ' '))
    return nameNorm === normalizedLookup || slugNorm === normalizedLookup
  })
}

const COUNTRY_IMPORT_SLUG_HINTS: Record<string, string[]> = {
  de: ['germany', 'deutschland'],
  germany: ['germany', 'deutschland'],
  deutschland: ['germany', 'deutschland'],
  'bundesrepublik deutschland': ['germany', 'deutschland'],
  it: ['italy', 'italien', 'italia'],
  italy: ['italy', 'italien', 'italia'],
  italien: ['italy', 'italien', 'italia'],
  italia: ['italy', 'italien', 'italia'],
  fr: ['france', 'frankreich'],
  france: ['france', 'frankreich'],
  frankreich: ['france', 'frankreich'],
  es: ['spain', 'spanien', 'espana'],
  spain: ['spain', 'spanien', 'espana'],
  spanien: ['spain', 'spanien', 'espana'],
  espana: ['spain', 'spanien', 'espana'],
  andorra: ['andorra'],
  ad: ['andorra'],
  be: ['belgium', 'belgien'],
  belgium: ['belgium', 'belgien'],
  belgien: ['belgium', 'belgien'],
  nl: ['netherlands', 'niederlande'],
  netherlands: ['netherlands', 'niederlande'],
  niederlande: ['netherlands', 'niederlande'],
  at: ['austria', 'osterreich', 'oesterreich'],
  austria: ['austria', 'osterreich', 'oesterreich'],
  osterreich: ['austria', 'osterreich', 'oesterreich'],
  oesterreich: ['austria', 'osterreich', 'oesterreich'],
  fi: ['finland', 'finnland'],
  finland: ['finland', 'finnland'],
  finnland: ['finland', 'finnland'],
  ie: ['ireland', 'irland'],
  ireland: ['ireland', 'irland'],
  irland: ['ireland', 'irland'],
  pt: ['portugal'],
  portugal: ['portugal'],
  gr: ['greece', 'griechenland'],
  greece: ['greece', 'griechenland'],
  griechenland: ['greece', 'griechenland'],
  lu: ['luxembourg', 'luxemburg'],
  luxembourg: ['luxembourg', 'luxemburg'],
  luxemburg: ['luxembourg', 'luxemburg'],
  mt: ['malta'],
  malta: ['malta'],
  si: ['slovenia', 'slowenien'],
  slovenia: ['slovenia', 'slowenien'],
  slowenien: ['slovenia', 'slowenien'],
  sk: ['slovakia', 'slowakei'],
  slovakia: ['slovakia', 'slowakei'],
  slowakei: ['slovakia', 'slowakei'],
  ee: ['estonia', 'estland'],
  estonia: ['estonia', 'estland'],
  estland: ['estonia', 'estland'],
  lv: ['latvia', 'lettland'],
  latvia: ['latvia', 'lettland'],
  lettland: ['latvia', 'lettland'],
  lt: ['lithuania', 'litauen'],
  lithuania: ['lithuania', 'litauen'],
  litauen: ['lithuania', 'litauen'],
  cy: ['cyprus', 'zypern'],
  cyprus: ['cyprus', 'zypern'],
  zypern: ['cyprus', 'zypern'],
  mc: ['monaco'],
  monaco: ['monaco'],
  sm: ['san marino'],
  'san marino': ['san marino'],
  va: ['vatican', 'vatikan'],
  vatican: ['vatican', 'vatikan'],
  vatikan: ['vatican', 'vatikan'],
  hr: ['croatia', 'kroatien'],
  croatia: ['croatia', 'kroatien'],
  kroatien: ['croatia', 'kroatien'],
}

function findCountryOptionByCode(
  code: string,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const upper = code.trim().toUpperCase()
  if (upper.length !== 2) {
    return undefined
  }

  const byMeta = options.find((option) => {
    const metaCode =
      option.country_code ??
      option.countryCode ??
      option.acf?.coin_country_code ??
      option.acf?.country_code ??
      option.meta?.country_code
    return metaCode?.trim().toUpperCase() === upper
  })
  if (byMeta) {
    return byMeta
  }

  const direct = options.find(
    (option) =>
      option.slug.toUpperCase() === upper || option.slug.toUpperCase().endsWith(`-${upper}`),
  )
  if (direct) {
    return direct
  }

  if (upper !== 'DE') {
    return undefined
  }

  const hints = COUNTRY_IMPORT_SLUG_HINTS.de
  return options.find((option) => {
    const slug = option.slug.toLowerCase()
    const name = normalizeTaxonomyLookupText(option.name)
    return (
      hints.some((hint) => slug === hint || slug.includes(hint)) ||
      name.includes('germany') ||
      name.includes('deutschland') ||
      name.includes('bundesrepublik')
    )
  })
}

function findCountryOptionByImportText(
  value: string,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const normalized = normalizeTaxonomyLookupText(value)
  if (!normalized) {
    return undefined
  }

  const hints = COUNTRY_IMPORT_SLUG_HINTS[normalized]
  if (hints) {
    const byHint = options.find((option) =>
      hints.some((hint) => {
        const slug = option.slug.toLowerCase()
        return slug === hint || slug.includes(hint)
      }),
    )
    if (byHint) {
      return byHint
    }
  }

  if (
    normalized.includes('germany') ||
    normalized.includes('deutschland') ||
    normalized.includes('bundesrepublik')
  ) {
    const byRegion = options.find((option) => {
      const slug = option.slug.toLowerCase()
      const name = normalizeTaxonomyLookupText(option.name)
      return (
        slug.includes('germany') ||
        slug.includes('deutschland') ||
        name.includes('germany') ||
        name.includes('deutschland')
      )
    })
    if (byRegion) {
      return byRegion
    }
  }

  return findTaxonomyOptionByNormalizedMatch(normalized, options)
}

function isTwoEuroDenominationLookup(normalized: string): boolean {
  if (!normalized) {
    return false
  }

  if (normalized === '2' || normalized === '2 euro' || normalized === 'euro 2') {
    return true
  }

  return /\b2\b/.test(normalized) && normalized.includes('euro')
}

export function findCountryOptionFromImport(
  country: string | undefined,
  countryCode: string | undefined,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const code = countryCode?.trim()
  if (code) {
    const byCode = findCountryOptionByCode(code, options)
    if (byCode) {
      return byCode
    }
  }

  if (!country?.trim()) {
    return undefined
  }

  const cleaned = country.trim()
  if (isLikelyPageChrome(cleaned)) {
    return undefined
  }

  const direct = findTaxonomyOption(cleaned, options)
  if (direct) {
    return direct
  }

  const normalized = normalizeTaxonomyLookupText(cleaned)
  const isoFromText = resolveCountryIsoFromImportText(normalized)
  if (isoFromText) {
    const byIso = findCountryOptionByCode(isoFromText, options)
    if (byIso) {
      return byIso
    }
  }

  return findCountryOptionByImportText(cleaned, options)
}

function isLikelyPageChrome(value: string): boolean {
  const normalized = normalizeTaxonomyLookupText(value)
  return (
    normalized.includes('service navigation') ||
    normalized.includes('cash management') ||
    normalized.includes('site navigation') ||
    normalized.length <= 2
  )
}

export function findDenominationOptionFromImport(
  value: string | undefined,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    return undefined
  }

  const direct = findTaxonomyOption(trimmed, options)
  if (direct) {
    return direct
  }

  const normalized = normalizeTaxonomyLookupText(trimmed)
  const byNorm = findTaxonomyOptionByNormalizedMatch(normalized, options)
  if (byNorm) {
    return byNorm
  }

  if (isTwoEuroDenominationLookup(normalized)) {
    return options.find((option) => isTwoEuroDenominationLookup(normalizeTaxonomyLookupText(option.name)))
  }

  return undefined
}

export function findCoinTypeOptionFromImport(
  value: string | undefined,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const trimmed = value?.trim() ?? ''
  if (trimmed) {
    const direct = findTaxonomyOption(trimmed, options)
    if (direct) {
      return direct
    }

    const normalized = normalizeTaxonomyLookupText(trimmed)
    const byNorm = findTaxonomyOptionByNormalizedMatch(normalized, options)
    if (byNorm) {
      return byNorm
    }

    if (normalized.includes('commemorative') || normalized.includes('gedenkmunze')) {
      const commemorative = options.find((option) => {
        const label = `${option.name} ${option.slug}`.toLowerCase()
        const labelNorm = normalizeTaxonomyLookupText(label)
        return label.includes('commemorative') || labelNorm.includes('gedenkmunze')
      })
      if (commemorative) {
        return commemorative
      }
    }
  }

  return options.find((option) => {
    const label = `${option.name} ${option.slug}`.toLowerCase()
    return (
      label.includes('commemorative') ||
      normalizeTaxonomyLookupText(label).includes('gedenkmunze')
    )
  })
}

export function findTaxonomyOptionFromImport(
  value: string,
  options: TaxonomyOption[],
): TaxonomyOption | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  return findTaxonomyOption(trimmed, options) ?? findTaxonomyOptionByNormalizedMatch(
    normalizeTaxonomyLookupText(trimmed),
    options,
  )
}

export function resolveTaxonomyFormValue(value: string, options: TaxonomyOption[]): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return findTaxonomyOption(trimmed, options)?.name ?? trimmed
}

function normalizeCoinSeriesLookupValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const lower = trimmed.toLowerCase()
  return COIN_SERIES_LEGACY_ALIASES[lower] ?? trimmed
}

export function findStaticCoinSeriesMatch(
  value: string,
): (typeof STATIC_COIN_SERIES)[number] | undefined {
  const trimmed = normalizeCoinSeriesLookupValue(value)
  if (!trimmed) {
    return undefined
  }

  const lower = trimmed.toLowerCase()
  return STATIC_COIN_SERIES.find(
    (item) =>
      item.slug === lower ||
      item.slug === trimmed ||
      item.en.toLowerCase() === lower ||
      item.de.toLowerCase() === lower ||
      item.en === trimmed ||
      item.de === trimmed,
  )
}

export function resolveCoinSeriesFormValue(
  value: string,
  options: TaxonomyOption[],
  contentLanguage: ContentLanguage,
): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const match = findTaxonomyOption(trimmed, options)
  if (match) {
    return match.name
  }

  const staticMatch = findStaticCoinSeriesMatch(trimmed)
  if (staticMatch) {
    return contentLanguage === 'en' ? staticMatch.en : staticMatch.de
  }

  return trimmed
}

export function isRecognizedCoinSeriesValue(
  value: string,
  options: TaxonomyOption[],
): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  return Boolean(findTaxonomyOption(trimmed, options) ?? findStaticCoinSeriesMatch(trimmed))
}

export function getTaxonomySelectValue(value: string, options: TaxonomyOption[]): string {
  if (!value.trim()) {
    return ''
  }

  if (isKnownTaxonomyOption(value, options)) {
    return value.trim()
  }

  return TAXONOMY_OTHER_VALUE
}

export const EMPTY_FORM_OPTIONS: FormOptions = {
  countries: [],
  values: [],
  types: [],
  series: [],
}

export const EMPTY_DEFAULT_IMAGES: DefaultImages = {
  obverse: null,
  reverse: null,
}

const COIN_SERIES_LEGACY_ALIASES: Record<string, string> = {
  unity: 'unity-and-justice-and-freedom',
  'justice and freedom': 'unity-and-justice-and-freedom',
  'unity, justice and freedom': 'unity-and-justice-and-freedom',
  'unity-justice-and-freedom': 'unity-and-justice-and-freedom',
  'unity-justice-freedom': 'unity-and-justice-and-freedom',
  'einigkeit, recht und freiheit': 'unity-and-justice-and-freedom',
}

const STATIC_COIN_SERIES: Array<{ slug: string; en: string; de: string }> = [
  {
    slug: 'unity-and-justice-and-freedom',
    en: 'Unity and Justice and Freedom',
    de: 'Einigkeit und Recht und Freiheit',
  },
  { slug: 'states-of-germany', en: 'States of Germany', de: 'Bundesländer' },
  { slug: 'erasmus-programme', en: 'Erasmus Programme', de: 'Erasmus-Programm' },
  { slug: 'european-capitals-of-culture', en: 'European Capitals of Culture', de: 'Kulturhauptstädte Europas' },
  { slug: 'olympic-games', en: 'Olympic Games', de: 'Olympische Spiele' },
  { slug: 'unesco-world-heritage', en: 'UNESCO World Heritage', de: 'UNESCO-Welterbe' },
]

export function getStaticCoinSeriesOptions(contentLanguage: ContentLanguage): TaxonomyOption[] {
  return STATIC_COIN_SERIES.map((item, index) => ({
    id: index + 1,
    slug: item.slug,
    name: contentLanguage === 'en' ? item.en : item.de,
  }))
}

export function resolveFormOptions(
  options: FormOptions,
  contentLanguage: ContentLanguage = 'de',
): FormOptions {
  return {
    ...options,
    series:
      options.series.length > 0 ? options.series : getStaticCoinSeriesOptions(contentLanguage),
  }
}
