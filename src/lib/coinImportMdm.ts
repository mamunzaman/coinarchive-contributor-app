/**
 * MDM.de URL classification for coin-link import.
 * Product detail pages are importable; category/listing pages are not.
 */

const MDM_HOST_SUFFIX = 'mdm.de'

const MDM_UNSUPPORTED_PATH_PREFIXES = [
  '/checkout',
  '/cart',
  '/customer',
  '/wishlist',
  '/search',
  '/login',
  '/register',
  '/newsletter',
  '/muenzwelt',
  '/content',
  '/agb',
  '/datenschutz',
  '/impressum',
] as const

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || '/'
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1)
  }
  return trimmed
}

export function isMdmHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  return host === MDM_HOST_SUFFIX || host.endsWith(`.${MDM_HOST_SUFFIX}`)
}

export type MdmUrlKind = 'product' | 'listing' | 'unsupported'

/**
 * Classify an MDM URL.
 * - product: single-coin detail page (one path segment product slug)
 * - listing: category / multi-product listing (2+ path segments)
 * - unsupported: home, editorial, cart, etc.
 */
export function classifyMdmUrl(url: string): MdmUrlKind {
  try {
    const parsed = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
    if (!isMdmHost(parsed.hostname)) {
      return 'unsupported'
    }

    const pathname = normalizePathname(parsed.pathname)
    if (pathname === '/' || pathname === '') {
      return 'unsupported'
    }

    const lowerPath = pathname.toLowerCase()
    for (const prefix of MDM_UNSUPPORTED_PATH_PREFIXES) {
      if (lowerPath === prefix || lowerPath.startsWith(`${prefix}/`)) {
        return 'unsupported'
      }
    }

    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 2) {
      return 'listing'
    }

    if (segments.length === 1) {
      const slug = segments[0]?.toLowerCase() ?? ''
      if (!slug || slug === 'index' || slug === 'home') {
        return 'unsupported'
      }
      return 'product'
    }

    return 'unsupported'
  } catch {
    return 'unsupported'
  }
}

export function isMdmListingUrl(url: string): boolean {
  return classifyMdmUrl(url) === 'listing'
}

export function isMdmProductUrl(url: string): boolean {
  return classifyMdmUrl(url) === 'product'
}

export const MDM_CATEGORY_REFERENCE_URL =
  'https://www.mdm.de/deutschland-muenzen/deutsche-euro-muenzen/10-euro-muenzen'

export const MDM_PRODUCT_EXAMPLE_URL =
  'https://www.mdm.de/10-euro-silber-gedenkmunze-einfuhrung-des-euro'
