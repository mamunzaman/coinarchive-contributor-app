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

const KNOWN_SOURCE_NAME_ALIASES: Record<string, string> = {
  bundesbank: 'Deutsche Bundesbank',
  'deutsche bundesbank': 'Deutsche Bundesbank',
  ecb: 'European Central Bank',
  'european central bank': 'European Central Bank',
  'european commission': 'European Commission',
  'muenze deutschland': 'Münze Deutschland',
  'münze deutschland': 'Münze Deutschland',
}

export const COIN_IMPORT_PRIMARY_HOST_SUFFIXES = [
  'bundesbank.de',
  'ecb.europa.eu',
  'economy-finance.ec.europa.eu',
] as const

export const COIN_IMPORT_SUPPLEMENTAL_HOST_SUFFIXES = ['muenze-deutschland.de'] as const

export function hostMatchesImportSuffix(hostname: string, suffix: string): boolean {
  const host = hostname.trim().toLowerCase()
  const normalized = suffix.trim().toLowerCase()
  return host === normalized || host.endsWith(`.${normalized}`)
}

export function isSupportedCoinImportHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  for (const suffix of COIN_IMPORT_PRIMARY_HOST_SUFFIXES) {
    if (hostMatchesImportSuffix(host, suffix)) {
      return true
    }
  }
  for (const suffix of COIN_IMPORT_SUPPLEMENTAL_HOST_SUFFIXES) {
    if (hostMatchesImportSuffix(host, suffix)) {
      return true
    }
  }
  return false
}

export type CoinImportSourceType = 'primary' | 'supplemental'

export function resolveImportSourceTypeFromHost(hostname: string): CoinImportSourceType {
  const host = hostname.trim().toLowerCase()
  for (const suffix of COIN_IMPORT_SUPPLEMENTAL_HOST_SUFFIXES) {
    if (hostMatchesImportSuffix(host, suffix)) {
      return 'supplemental'
    }
  }
  return 'primary'
}

export function resolveImportSourceTypeFromUrl(url: string): CoinImportSourceType {
  try {
    return resolveImportSourceTypeFromHost(new URL(url).hostname)
  } catch {
    const lower = url.trim().toLowerCase()
    if (lower.includes('muenze-deutschland.de')) {
      return 'supplemental'
    }
    return 'primary'
  }
}

export function pickFirstNonEmptyString(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return ''
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

  try {
    const host = new URL(trimmed).hostname.toLowerCase()
    if (host.endsWith('bundesbank.de')) {
      return 'Deutsche Bundesbank'
    }
    if (host.endsWith('ecb.europa.eu')) {
      return 'European Central Bank'
    }
    if (host.endsWith('economy-finance.ec.europa.eu')) {
      return 'European Commission'
    }
    if (hostMatchesImportSuffix(host, 'muenze-deutschland.de')) {
      return 'Münze Deutschland'
    }

    return host.replace(/^www\./, '')
  } catch {
    const lower = trimmed.toLowerCase()
    if (lower.includes('bundesbank.de')) {
      return 'Deutsche Bundesbank'
    }
    if (lower.includes('ecb.europa.eu')) {
      return 'European Central Bank'
    }
    if (lower.includes('economy-finance.ec.europa.eu')) {
      return 'European Commission'
    }
    if (lower.includes('muenze-deutschland.de')) {
      return 'Münze Deutschland'
    }
    return ''
  }
}

export function sanitizeImportSourceUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return ''
}

export function normalizeImportMintage(value: string | number | undefined): string {
  if (value === undefined || value === null) {
    return ''
  }

  const raw = String(value).trim()
  if (!raw) {
    return ''
  }

  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) {
    return raw.replace(/[.,]/g, '')
  }

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
    return raw.replace(/,/g, '')
  }

  return raw.replace(/\s/g, '')
}
