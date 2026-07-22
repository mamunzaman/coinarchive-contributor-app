import {
  COIN_IMPORT_PRIMARY_HOST_SUFFIXES as SOURCE_PRIMARY_HOST_SUFFIXES,
  COIN_IMPORT_SUPPLEMENTAL_HOST_SUFFIXES as SOURCE_SUPPLEMENTAL_HOST_SUFFIXES,
  hostMatchesImportSuffix as sourceHostMatchesImportSuffix,
  isSupportedCoinImportHost as sourceIsSupportedCoinImportHost,
  normalizeKnownSourceName as sourceNormalizeKnownSourceName,
  resolveImportSourceTypeFromHost as sourceResolveImportSourceTypeFromHost,
  resolveImportSourceTypeFromUrl as sourceResolveImportSourceTypeFromUrl,
  resolveOfficialSourceNameFromUrl as sourceResolveOfficialSourceNameFromUrl,
  type CoinImportSourceRole,
} from './coinImportSources'

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

export const COIN_IMPORT_PRIMARY_HOST_SUFFIXES = SOURCE_PRIMARY_HOST_SUFFIXES
export const COIN_IMPORT_SUPPLEMENTAL_HOST_SUFFIXES = SOURCE_SUPPLEMENTAL_HOST_SUFFIXES

export function hostMatchesImportSuffix(hostname: string, suffix: string): boolean {
  return sourceHostMatchesImportSuffix(hostname, suffix)
}

export function isSupportedCoinImportHost(hostname: string): boolean {
  return sourceIsSupportedCoinImportHost(hostname)
}

export type CoinImportSourceType = CoinImportSourceRole

export function resolveImportSourceTypeFromHost(hostname: string): CoinImportSourceType {
  return sourceResolveImportSourceTypeFromHost(hostname)
}

export function resolveImportSourceTypeFromUrl(url: string): CoinImportSourceType {
  return sourceResolveImportSourceTypeFromUrl(url)
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
  return sourceNormalizeKnownSourceName(value)
}

export function resolveOfficialSourceNameFromUrl(url: string | undefined): string {
  return sourceResolveOfficialSourceNameFromUrl(url)
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
