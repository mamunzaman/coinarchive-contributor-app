/**
 * Coin link import source adapters.
 * Frontend defines allowlisted hosts, source roles, and expected extractable fields.
 * HTML scraping/merge runs on the WordPress `/coin-link-import` endpoint.
 */

export type CoinImportSourceRole = 'primary' | 'supplemental'

/** Fields the backend scraper is expected to contribute for this source when available. */
export type CoinImportExtractableField =
  | 'title'
  | 'country'
  | 'countryCode'
  | 'year'
  | 'denomination'
  | 'coinType'
  | 'series'
  | 'theme'
  | 'releaseDate'
  | 'mintage'
  | 'designer'
  | 'material'
  | 'quality'
  | 'obverseDescription'
  | 'reverseDescription'
  | 'historicalBackground'
  | 'shortDescription'
  | 'weightG'
  | 'diameterMm'
  | 'thicknessMm'
  | 'edgeInscription'
  | 'issueStatus'
  | 'mintMarksAvailable'
  | 'mintVariants'
  | 'images'
  | 'sourceUrl'
  | 'sourceName'

export type CoinImportSourceAdapter = {
  id: string
  displayName: string
  hostSuffixes: readonly string[]
  role: CoinImportSourceRole
  extractableFields: readonly CoinImportExtractableField[]
}

const CATALOGUE_IDENTITY_FIELDS = [
  'title',
  'country',
  'countryCode',
  'year',
  'denomination',
  'coinType',
  'series',
  'theme',
  'releaseDate',
  'issueStatus',
  'sourceUrl',
  'sourceName',
] as const satisfies readonly CoinImportExtractableField[]

const DESCRIPTION_FIELDS = [
  'shortDescription',
  'obverseDescription',
  'reverseDescription',
  'historicalBackground',
] as const satisfies readonly CoinImportExtractableField[]

const SPEC_FIELDS = [
  'mintage',
  'designer',
  'material',
  'quality',
  'weightG',
  'diameterMm',
  'thicknessMm',
  'edgeInscription',
  'mintMarksAvailable',
  'mintVariants',
  'images',
] as const satisfies readonly CoinImportExtractableField[]

export const COIN_IMPORT_SOURCE_ADAPTERS: readonly CoinImportSourceAdapter[] = [
  {
    id: 'bundesbank',
    displayName: 'Deutsche Bundesbank',
    hostSuffixes: ['bundesbank.de'],
    role: 'primary',
    extractableFields: [...CATALOGUE_IDENTITY_FIELDS, ...DESCRIPTION_FIELDS, ...SPEC_FIELDS],
  },
  {
    id: 'ecb',
    displayName: 'European Central Bank',
    hostSuffixes: ['ecb.europa.eu'],
    role: 'primary',
    extractableFields: [...CATALOGUE_IDENTITY_FIELDS, ...DESCRIPTION_FIELDS, 'images'],
  },
  {
    id: 'european-commission',
    displayName: 'European Commission',
    hostSuffixes: ['economy-finance.ec.europa.eu'],
    role: 'primary',
    extractableFields: [...CATALOGUE_IDENTITY_FIELDS, ...DESCRIPTION_FIELDS, 'images'],
  },
  {
    id: 'eurocoinhouse',
    displayName: 'Eurocoinhouse',
    hostSuffixes: ['eurocoinhouse.com'],
    role: 'primary',
    extractableFields: [
      ...CATALOGUE_IDENTITY_FIELDS,
      ...DESCRIPTION_FIELDS,
      'mintage',
      'designer',
      'material',
      'quality',
      'weightG',
      'diameterMm',
      'edgeInscription',
      'mintMarksAvailable',
      'mintVariants',
      'images',
    ],
  },
  {
    id: 'muenze-deutschland',
    displayName: 'Münze Deutschland',
    hostSuffixes: ['muenze-deutschland.de'],
    role: 'supplemental',
    extractableFields: [
      'title',
      'country',
      'year',
      'denomination',
      'theme',
      'releaseDate',
      'mintage',
      'material',
      'quality',
      'weightG',
      'diameterMm',
      'mintMarksAvailable',
      'mintVariants',
      'images',
      'sourceUrl',
      'sourceName',
      'shortDescription',
    ],
  },
  {
    id: 'zwei-euro',
    displayName: 'Zwei-Euro',
    hostSuffixes: ['zwei-euro.com'],
    role: 'supplemental',
    extractableFields: [
      'title',
      'country',
      'year',
      'denomination',
      'coinType',
      'theme',
      'releaseDate',
      'mintage',
      'designer',
      'material',
      'quality',
      'weightG',
      'diameterMm',
      'edgeInscription',
      'mintMarksAvailable',
      'mintVariants',
      'obverseDescription',
      'reverseDescription',
      'shortDescription',
      'images',
      'sourceUrl',
      'sourceName',
    ],
  },
  {
    id: 'muenzen-eu',
    displayName: 'Münzen.eu',
    hostSuffixes: ['muenzen.eu'],
    role: 'supplemental',
    extractableFields: [
      'title',
      'country',
      'year',
      'denomination',
      'theme',
      'releaseDate',
      'mintage',
      'designer',
      'material',
      'quality',
      'weightG',
      'diameterMm',
      'edgeInscription',
      'historicalBackground',
      'shortDescription',
      'sourceUrl',
      'sourceName',
    ],
  },
] as const

export const COIN_IMPORT_PRIMARY_HOST_SUFFIXES = COIN_IMPORT_SOURCE_ADAPTERS.filter(
  (adapter) => adapter.role === 'primary',
).flatMap((adapter) => [...adapter.hostSuffixes])

export const COIN_IMPORT_SUPPLEMENTAL_HOST_SUFFIXES = COIN_IMPORT_SOURCE_ADAPTERS.filter(
  (adapter) => adapter.role === 'supplemental',
).flatMap((adapter) => [...adapter.hostSuffixes])

export const COIN_IMPORT_SUPPORTED_SOURCE_LABELS = COIN_IMPORT_SOURCE_ADAPTERS.map(
  (adapter) => adapter.displayName,
).join(', ')

export const COIN_IMPORT_UNSUPPORTED_URL_MESSAGE = `Supported sources: ${COIN_IMPORT_SUPPORTED_SOURCE_LABELS}.`

const KNOWN_SOURCE_NAME_ALIASES: Record<string, string> = {
  bundesbank: 'Deutsche Bundesbank',
  'deutsche bundesbank': 'Deutsche Bundesbank',
  ecb: 'European Central Bank',
  'european central bank': 'European Central Bank',
  'european commission': 'European Commission',
  'muenze deutschland': 'Münze Deutschland',
  'münze deutschland': 'Münze Deutschland',
  eurocoinhouse: 'Eurocoinhouse',
  'euro coin house': 'Eurocoinhouse',
  'zwei-euro': 'Zwei-Euro',
  'zwei euro': 'Zwei-Euro',
  'muenzen.eu': 'Münzen.eu',
  muenzen: 'Münzen.eu',
  'münzen.eu': 'Münzen.eu',
}

export function hostMatchesImportSuffix(hostname: string, suffix: string): boolean {
  const host = hostname.trim().toLowerCase()
  const normalized = suffix.trim().toLowerCase()
  return host === normalized || host.endsWith(`.${normalized}`)
}

export function findCoinImportSourceAdapterByHost(
  hostname: string,
): CoinImportSourceAdapter | null {
  const host = hostname.trim().toLowerCase()
  for (const adapter of COIN_IMPORT_SOURCE_ADAPTERS) {
    for (const suffix of adapter.hostSuffixes) {
      if (hostMatchesImportSuffix(host, suffix)) {
        return adapter
      }
    }
  }
  return null
}

export function findCoinImportSourceAdapterByUrl(url: string): CoinImportSourceAdapter | null {
  try {
    return findCoinImportSourceAdapterByHost(new URL(url).hostname)
  } catch {
    const lower = url.trim().toLowerCase()
    for (const adapter of COIN_IMPORT_SOURCE_ADAPTERS) {
      for (const suffix of adapter.hostSuffixes) {
        if (lower.includes(suffix)) {
          return adapter
        }
      }
    }
    return null
  }
}

export function isSupportedCoinImportHost(hostname: string): boolean {
  return findCoinImportSourceAdapterByHost(hostname) !== null
}

export function resolveImportSourceTypeFromHost(hostname: string): CoinImportSourceRole {
  return findCoinImportSourceAdapterByHost(hostname)?.role ?? 'primary'
}

export function resolveImportSourceTypeFromUrl(url: string): CoinImportSourceRole {
  return findCoinImportSourceAdapterByUrl(url)?.role ?? 'primary'
}

export function normalizeKnownSourceName(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  const key = trimmed.toLowerCase()
  return KNOWN_SOURCE_NAME_ALIASES[key] ?? trimmed
}

export function resolveOfficialSourceNameFromUrl(url: string | undefined): string {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  const adapter = findCoinImportSourceAdapterByUrl(trimmed)
  if (adapter) {
    return adapter.displayName
  }

  try {
    return new URL(trimmed).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function listSupportedCoinImportHosts(): string[] {
  return COIN_IMPORT_SOURCE_ADAPTERS.flatMap((adapter) =>
    adapter.hostSuffixes.flatMap((suffix) => [suffix, `www.${suffix}`]),
  )
}
