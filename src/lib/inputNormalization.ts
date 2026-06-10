import type { CoinFormValues, MintVariantRow } from '../types/coinForm'
import type { FormOptions, TaxonomyOption } from '../types/formOptions'

const INVISIBLE_CHARS = /[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
])

type SubmissionPayload = Partial<CoinFormValues> & Record<string, unknown>

export function removeInvisibleCharacters(value: string): string {
  return value.replace(INVISIBLE_CHARS, '')
}

export function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, '\n')
}

export function normalizeWhitespace(value: string): string {
  return normalizeLineEndings(removeInvisibleCharacters(value)).trim().replace(/[^\S\n]+/g, ' ').replace(/\n+/g, ' ')
}

export function normalizeRichText(value: string): string {
  return normalizeLineEndings(removeInvisibleCharacters(value)).trim()
}

export function normalizeTitle(value: string): string {
  return normalizeWhitespace(value)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=\S)/g, '$1 ')
    .replace(/([!?.,;:])\s+\1+/g, '$1')
}

export function normalizeCountryLabel(value: string, options: TaxonomyOption[] = []): string {
  const normalized = normalizeWhitespace(value)
  if (!normalized) {
    return ''
  }

  const match = options.find((option) => option.name.toLowerCase() === normalized.toLowerCase())
  return match?.name ?? normalized
}

export function normalizeMintMark(value: string): string {
  return normalizeWhitespace(value).toUpperCase().replace(/[^A-Z,\-./& ]/g, '')
}

export function normalizeCoinCodeLike(value: string): string {
  return normalizeWhitespace(value).toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

export function normalizeImageUrl(value: string): string {
  const cleaned = removeInvisibleCharacters(value).trim()
  if (!cleaned) {
    return ''
  }

  try {
    const url = new URL(cleaned)
    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key)
      }
    }
    return url.toString()
  } catch {
    return cleaned
  }
}

export function normalizeImageUrlList(value: string): string {
  return normalizeWhitespace(value)
    .split('|')
    .map((url) => normalizeImageUrl(url))
    .filter(Boolean)
    .join('|')
}

function normalizeStringRecordValue(key: string, value: string, formOptions?: FormOptions): string {
  if (key === 'title' || key === 'post_title') {
    return normalizeTitle(value)
  }

  if (key === 'country') {
    return normalizeCountryLabel(value, formOptions?.countries)
  }

  if (key === 'coin_code' || key === 'unique_code') {
    return normalizeCoinCodeLike(value)
  }

  if (key === 'singleMintMark' || key === 'mintMarkCode' || key === 'mint_mark') {
    return normalizeMintMark(value)
  }

  if (key === 'obverse_image_url' || key === 'reverse_image_url') {
    return normalizeImageUrl(value)
  }

  if (key === 'gallery_image_urls') {
    return normalizeImageUrlList(value)
  }

  if (
    key === 'coin_obverse_description' ||
    key === 'coin_reverse_description' ||
    key === 'coin_historical_background' ||
    key === 'coin_collector_notes' ||
    key === 'historical_background'
  ) {
    return normalizeRichText(value)
  }

  if (
    key === 'theme' ||
    key === 'coin_theme' ||
    key === 'series' ||
    key === 'short_description' ||
    key === 'denomination' ||
    key === 'coin_type' ||
    key === 'coin_material' ||
    key === 'material' ||
    key === 'edge' ||
    key === 'designer' ||
    key === 'released_date'
  ) {
    return normalizeWhitespace(value)
  }

  return normalizeWhitespace(value)
}

function normalizeMintVariants(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value
  }

  return value.map((row) => {
    const variant = row as MintVariantRow
    return {
      ...variant,
      mintMarkCode: normalizeMintMark(variant.mintMarkCode ?? ''),
      mintMintage: normalizeWhitespace(variant.mintMintage ?? ''),
      mintNotes: normalizeRichText(variant.mintNotes ?? ''),
    }
  })
}

export function normalizeSubmissionPayload<T extends SubmissionPayload>(
  payload: T,
  options: { formOptions?: FormOptions } = {},
): T {
  const next: SubmissionPayload = { ...payload }

  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string') {
      next[key] = normalizeStringRecordValue(key, value, options.formOptions)
    }
  }

  if ('mintVariants' in next) {
    ;(next as Record<string, unknown>).mintVariants = normalizeMintVariants(next.mintVariants)
  }

  return next as T
}

export function normalizeImportRow<T extends Record<string, string>>(row: T): T {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    next[normalizeImportHeaderKey(key)] = normalizeStringRecordValue(normalizeImportHeaderKey(key), String(value ?? ''))
  }

  if (!next.coin_code?.trim() && next.unique_code?.trim()) {
    next.coin_code = next.unique_code
  }

  return next as T
}

export function normalizeImportHeaderKey(raw: string): string {
  const cleaned = removeInvisibleCharacters(raw)
    .replace(/^\uFEFF/, '')
    .replace(/\s*[*~]$/, '')
    .trim()
    .toLowerCase()

  return IMPORT_KEY_ALIASES[cleaned] ?? cleaned.replace(/[\s-]+/g, '_')
}

const IMPORT_KEY_ALIASES: Record<string, string> = {
  'obverse image url': 'obverse_image_url',
  'obverse image': 'obverse_image_url',
  'obverse url': 'obverse_image_url',
  'reverse image url': 'reverse_image_url',
  'reverse image': 'reverse_image_url',
  'reverse url': 'reverse_image_url',
  'gallery image urls': 'gallery_image_urls',
  'gallery images': 'gallery_image_urls',
  'gallery urls': 'gallery_image_urls',
  'coin type': 'coin_type',
  cointype: 'coin_type',
  'coin code': 'coin_code',
  coincode: 'coin_code',
  'unique code': 'unique_code',
  uniquecode: 'unique_code',
  'mint mark': 'mint_mark',
  mintmark: 'mint_mark',
  'short description': 'short_description',
  'historical background': 'historical_background',
  historicalbackground: 'historical_background',
  'weight (g)': 'weight',
  'weight g': 'weight',
  'diameter (mm)': 'diameter',
  'diameter mm': 'diameter',
  release_date: 'released_date',
  'release date': 'released_date',
  quality: 'coin_quality',
  obverse_description: 'coin_obverse_description',
  'obverse description': 'coin_obverse_description',
  reverse_description: 'coin_reverse_description',
  'reverse description': 'coin_reverse_description',
  collector_notes: 'coin_collector_notes',
  'collector notes': 'coin_collector_notes',
  published_in_catalogue: 'coin_is_published_catalogue',
  'published in catalogue': 'coin_is_published_catalogue',
  featured_coin: 'coin_is_featured',
  'featured coin': 'coin_is_featured',
  app_enabled: 'coin_is_app_enabled',
  'app enabled': 'coin_is_app_enabled',
  record_status: 'coin_record_status',
  'record status': 'coin_record_status',
}
