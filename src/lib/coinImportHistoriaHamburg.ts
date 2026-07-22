/**
 * Historia Hamburg URL classification for coin-link import (Input 1 primary).
 * Only single-product .html pages with a year in the product slug are importable.
 */

const HISTORIA_HOST_SUFFIX = 'historia-hamburg.de'

const HISTORIA_UNSUPPORTED_PATH_PREFIXES = [
  '/checkout',
  '/cart',
  '/customer',
  '/customer/account',
  '/wishlist',
  '/catalogsearch',
  '/search',
  '/account',
  '/login',
  '/register',
  '/wishlist',
  '/onestepcheckout',
] as const

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || '/'
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1)
  }
  return trimmed
}

export function isHistoriaHamburgHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  return host === HISTORIA_HOST_SUFFIX || host.endsWith(`.${HISTORIA_HOST_SUFFIX}`)
}

export type HistoriaHamburgUrlKind = 'product' | 'listing' | 'unsupported'

/**
 * Classify a Historia Hamburg URL.
 * - product: .html product page whose final slug contains a 4-digit year
 * - listing: category / multi-product paths
 * - unsupported: home, cart, account, search, etc.
 */
export function classifyHistoriaHamburgUrl(url: string): HistoriaHamburgUrlKind {
  try {
    const parsed = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
    if (!isHistoriaHamburgHost(parsed.hostname)) {
      return 'unsupported'
    }

    const pathname = normalizePathname(parsed.pathname)
    if (pathname === '/' || pathname === '') {
      return 'unsupported'
    }

    const lowerPath = pathname.toLowerCase()
    for (const prefix of HISTORIA_UNSUPPORTED_PATH_PREFIXES) {
      if (lowerPath === prefix || lowerPath.startsWith(`${prefix}/`)) {
        return 'unsupported'
      }
    }

    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) {
      return 'unsupported'
    }

    const last = segments[segments.length - 1]?.toLowerCase() ?? ''
    if (!last.endsWith('.html')) {
      return 'listing'
    }

    const slug = last.replace(/\.html$/i, '')
    if (!slug || slug === 'index' || slug === 'home') {
      return 'unsupported'
    }

    // Product pages include a year in the slug; bare category hubs usually do not.
    if (!/(?:19|20)\d{2}/.test(slug)) {
      return 'listing'
    }

    return 'product'
  } catch {
    return 'unsupported'
  }
}

export function isHistoriaHamburgProductUrl(url: string): boolean {
  return classifyHistoriaHamburgUrl(url) === 'product'
}

export function isHistoriaHamburgListingUrl(url: string): boolean {
  return classifyHistoriaHamburgUrl(url) === 'listing'
}

export const HISTORIA_HAMBURG_PRODUCT_EXAMPLE_URL =
  'https://www.historia-hamburg.de/deutschland-10-euro-2024-polizei.html'
