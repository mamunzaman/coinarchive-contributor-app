import {
  isKnownMintMarkCode,
  MINT_MARK_CODES,
  normalizeMintMarkCode,
  type CoinFormValues,
  type MintVariantRow,
} from '../types/coinForm'
import type { FormOptions, TaxonomyOption } from '../types/formOptions'

export const AUTO_FORMAT_HINT = 'Formatted automatically'

export type CoinFormNormalizeContext = {
  formOptions?: FormOptions
}

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function isValidIsoDateParts(year: string, month: string, day: string): boolean {
  const y = Number.parseInt(year, 10)
  const m = Number.parseInt(month, 10)
  const d = Number.parseInt(day, 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return false
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false
  }
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Form format: YYYY-MM-DD. Valid ISO dates are trimmed; invalid/non-ISO values are left unchanged. */
export function normalizeReleaseDateForForm(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match && isValidIsoDateParts(match[1], match[2], match[3])) {
    return trimmed
  }

  return trimmed
}

function normalizeReadableText(value: string): string {
  return collapseSpaces(value)
}

function normalizeTitleText(value: string): string {
  const collapsed = collapseSpaces(value)
  if (!collapsed) {
    return ''
  }

  if (collapsed === collapsed.toUpperCase() && /[a-z]/i.test(collapsed)) {
    return collapsed
      .toLowerCase()
      .replace(/\b([a-z])/g, (match) => match.toUpperCase())
  }

  return collapsed
}

function matchTaxonomyOption(value: string, options: TaxonomyOption[]): string | null {
  const trimmed = collapseSpaces(value)
  if (!trimmed) {
    return null
  }

  const exact = options.find((option) => option.name === trimmed)
  if (exact) {
    return exact.name
  }

  const lower = trimmed.toLowerCase()
  const caseInsensitive = options.find((option) => option.name.toLowerCase() === lower)
  return caseInsensitive?.name ?? null
}

function normalizeEuroDenomination(value: string): string {
  const trimmed = collapseSpaces(value)
  if (!trimmed) {
    return ''
  }

  const euroMatch = trimmed.match(/^(\d+)\s*(?:€|euro|euros)$/i)
  if (euroMatch) {
    return `${euroMatch[1]} Euro`
  }

  const euroSymbolMatch = trimmed.match(/^(\d+)€$/i)
  if (euroSymbolMatch) {
    return `${euroSymbolMatch[1]} Euro`
  }

  return trimmed
}

const COIN_TYPE_LABELS: Record<string, string> = {
  commemorative: 'Commemorative',
  circulation: 'Circulation',
}

function normalizeCoinTypeLabel(value: string, options: TaxonomyOption[]): string {
  const taxonomyMatch = matchTaxonomyOption(value, options)
  if (taxonomyMatch) {
    return taxonomyMatch
  }

  const lower = collapseSpaces(value).toLowerCase()
  return COIN_TYPE_LABELS[lower] ?? collapseSpaces(value)
}

function normalizeDenominationLabel(value: string, options: TaxonomyOption[]): string {
  const taxonomyMatch = matchTaxonomyOption(value, options)
  if (taxonomyMatch) {
    return taxonomyMatch
  }

  return normalizeEuroDenomination(value)
}

export function normalizeIntegerInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  if (/^\d{1,3}(,\d{3})+$/.test(trimmed)) {
    return trimmed.replace(/,/g, '')
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    return trimmed.replace(/\./g, '')
  }

  const digitsOnly = trimmed.replace(/[^\d]/g, '')
  return digitsOnly || trimmed
}

export function normalizeDecimalInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (/^\d+,\d+$/.test(trimmed)) {
    return trimmed.replace(',', '.')
  }

  if (/^\d+\.\d+$/.test(trimmed) || /^\d+$/.test(trimmed)) {
    return trimmed
  }

  return trimmed
}

export function normalizeMintMarksAvailable(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const compact = trimmed.replace(/[\s,]+/g, '').toUpperCase()
  if (compact.length > 0) {
    const letters = compact.split('').filter((char) => isKnownMintMarkCode(char))
    if (letters.length === compact.length) {
      return [...new Set(letters)].join(', ')
    }
  }

  const parts = trimmed.split(/[\s,]+/).filter(Boolean)
  const codes = parts
    .map((part) => normalizeMintMarkCode(part))
    .filter((code): code is (typeof MINT_MARK_CODES)[number] => isKnownMintMarkCode(code))

  if (codes.length === 0) {
    return collapseSpaces(trimmed)
  }

  return [...new Set(codes)].join(', ')
}

export function normalizeCoinFormField<K extends keyof CoinFormValues>(
  field: K,
  value: CoinFormValues[K],
  context: CoinFormNormalizeContext = {},
): CoinFormValues[K] {
  const options = context.formOptions

  switch (field) {
    case 'title':
      return normalizeTitleText(String(value)) as CoinFormValues[K]
    case 'country':
      return collapseSpaces(String(value)) as CoinFormValues[K]
    case 'denomination':
      return normalizeDenominationLabel(
        String(value),
        options?.values ?? [],
      ) as CoinFormValues[K]
    case 'coin_type':
      return normalizeCoinTypeLabel(String(value), options?.types ?? []) as CoinFormValues[K]
    case 'released_date':
      return normalizeReleaseDateForForm(String(value)) as CoinFormValues[K]
    case 'coin_mintage':
    case 'year':
      return normalizeIntegerInput(String(value)) as CoinFormValues[K]
    case 'coin_weight_g':
    case 'coin_diameter_mm':
    case 'coin_thickness_mm':
      return normalizeDecimalInput(String(value)) as CoinFormValues[K]
    case 'mintMarksAvailable':
      return normalizeMintMarksAvailable(String(value)) as CoinFormValues[K]
    case 'singleMintMark': {
      const code = normalizeMintMarkCode(String(value))
      return (isKnownMintMarkCode(code) ? code : collapseSpaces(String(value))) as CoinFormValues[K]
    }
    case 'coin_theme':
    case 'short_description':
    case 'coin_material':
    case 'coin_edge_inscription':
    case 'coin_obverse_description':
    case 'coin_reverse_description':
    case 'coin_collector_notes':
      return normalizeReadableText(String(value)) as CoinFormValues[K]
    case 'mintVariants': {
      const rows = value as MintVariantRow[]
      return rows.map((row) => ({
        ...row,
        mintMarkCode: normalizeMintMarkCode(row.mintMarkCode),
        mintMintage: normalizeIntegerInput(row.mintMintage),
        mintNotes: normalizeReadableText(row.mintNotes),
      })) as CoinFormValues[K]
    }
    default:
      return value
  }
}

export function normalizeCoinFormValues(
  values: CoinFormValues,
  context: CoinFormNormalizeContext = {},
): CoinFormValues {
  return {
    ...values,
    title: normalizeCoinFormField('title', values.title, context),
    country: normalizeCoinFormField('country', values.country, context),
    year: normalizeCoinFormField('year', values.year, context),
    denomination: normalizeCoinFormField('denomination', values.denomination, context),
    coin_type: normalizeCoinFormField('coin_type', values.coin_type, context),
    short_description: normalizeCoinFormField('short_description', values.short_description, context),
    coin_theme: normalizeCoinFormField('coin_theme', values.coin_theme, context),
    released_date: normalizeCoinFormField('released_date', values.released_date, context),
    coin_mintage: normalizeCoinFormField('coin_mintage', values.coin_mintage, context),
    coin_material: normalizeCoinFormField('coin_material', values.coin_material, context),
    coin_weight_g: normalizeCoinFormField('coin_weight_g', values.coin_weight_g, context),
    coin_diameter_mm: normalizeCoinFormField('coin_diameter_mm', values.coin_diameter_mm, context),
    coin_thickness_mm: normalizeCoinFormField('coin_thickness_mm', values.coin_thickness_mm, context),
    coin_edge_inscription: normalizeCoinFormField(
      'coin_edge_inscription',
      values.coin_edge_inscription,
      context,
    ),
    coin_obverse_description: normalizeCoinFormField(
      'coin_obverse_description',
      values.coin_obverse_description,
      context,
    ),
    coin_reverse_description: normalizeCoinFormField(
      'coin_reverse_description',
      values.coin_reverse_description,
      context,
    ),
    coin_collector_notes: normalizeCoinFormField(
      'coin_collector_notes',
      values.coin_collector_notes,
      context,
    ),
    singleMintMark: normalizeCoinFormField('singleMintMark', values.singleMintMark, context),
    mintMarksAvailable: normalizeCoinFormField(
      'mintMarksAvailable',
      values.mintMarksAvailable,
      context,
    ),
    mintVariants: normalizeCoinFormField('mintVariants', values.mintVariants, context),
  }
}
