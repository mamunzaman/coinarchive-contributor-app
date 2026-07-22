import type { TaxonomyOption } from '../types/formOptions'
import {
  findDenominationOptionFromImport,
  findTaxonomyOption,
} from '../types/formOptions'

/** Plugin matched term for the coin_value / denomination taxonomy. */
export type CoinImportCoinValueMatch = {
  termId: number
  slug: string
  value: string
  label: string
}

/** Soft conflict entry from the import plugin (field-level merge conflict). */
export type CoinImportApiConflict = {
  field: string
  winner?: string | null
  values?: string[]
}

const MAX_SAFE_STRING_LENGTH = 500

function sanitizeImportSafeString(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed.slice(0, MAX_SAFE_STRING_LENGTH)
}

function readPositiveTermId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

/** True when a raw coin_value payload existed but failed normalization. */
export function isRejectedImportCoinValue(raw: unknown): boolean {
  if (raw === undefined || raw === null || raw === '') {
    return false
  }

  return normalizeImportCoinValue(raw) === undefined
}

/**
 * Normalize plugin `extracted.coin_value`.
 * Returns undefined when missing or invalid (zero / non-numeric term_id, empty object, etc.).
 */
export function normalizeImportCoinValue(raw: unknown): CoinImportCoinValueMatch | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined
  }

  const record = raw as Record<string, unknown>
  const termId = readPositiveTermId(record.term_id ?? record.termId)
  if (termId === null) {
    return undefined
  }

  const slug = sanitizeImportSafeString(record.slug)
  const value = sanitizeImportSafeString(record.value)
  const label = sanitizeImportSafeString(record.label)

  if (!slug && !value && !label) {
    return undefined
  }

  return {
    termId,
    slug,
    value,
    label,
  }
}

export function normalizeImportApiConflicts(raw: unknown): CoinImportApiConflict[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const conflicts: CoinImportApiConflict[] = []

  for (const item of raw) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue
    }

    const record = item as Record<string, unknown>
    const field = sanitizeImportSafeString(record.field ?? record.key ?? record.name)
    if (!field) {
      continue
    }

    const winnerRaw = record.winner ?? record.resolved ?? record.chosen
    const winner =
      winnerRaw === null || winnerRaw === undefined
        ? null
        : sanitizeImportSafeString(winnerRaw) || null

    const values = Array.isArray(record.values)
      ? record.values
          .map((entry) => sanitizeImportSafeString(entry))
          .filter(Boolean)
      : undefined

    conflicts.push({
      field,
      winner,
      values: values && values.length > 0 ? values : undefined,
    })
  }

  return conflicts
}

function isCoinValueFieldKey(field: string): boolean {
  const lower = field.trim().toLowerCase()
  return (
    lower === 'coin_value' ||
    lower === 'coinvalue' ||
    lower === 'denomination' ||
    lower === 'value'
  )
}

/** True when plugin reported a denomination/coin_value conflict with no winner. */
export function hasDenominationConflictWithoutWinner(
  conflicts: CoinImportApiConflict[] | undefined,
): boolean {
  if (!conflicts?.length) {
    return false
  }

  return conflicts.some(
    (conflict) => isCoinValueFieldKey(conflict.field) && !conflict.winner?.trim(),
  )
}

/** True when missing/unmatched lists include coin_value (or denomination). */
export function isCoinValueReportedMissing(
  missing: string[] | undefined,
  unmatched?: string[],
): boolean {
  const lists = [...(missing ?? []), ...(unmatched ?? [])]
  return lists.some((item) => isCoinValueFieldKey(String(item ?? '')))
}

/**
 * Map a validated plugin coin_value match to the form/API identifier:
 * taxonomy option `name` (label), never term id.
 */
export function resolveCoinValueToDenominationName(
  match: CoinImportCoinValueMatch,
  options: TaxonomyOption[],
): string {
  const byId = options.find((option) => option.id === match.termId)
  if (byId?.name.trim()) {
    return byId.name.trim()
  }

  if (match.slug) {
    const bySlug = findTaxonomyOption(match.slug, options)
    if (bySlug?.name.trim()) {
      return bySlug.name.trim()
    }
  }

  const labelOrValue = match.label || match.value
  if (labelOrValue) {
    const byText = findDenominationOptionFromImport(labelOrValue, options)
    if (byText?.name.trim()) {
      return byText.name.trim()
    }
  }

  return ''
}

export function getCoinValueDisplayLabel(
  match: CoinImportCoinValueMatch | undefined,
  denomination?: string,
): string {
  return (
    sanitizeImportSafeString(denomination) ||
    match?.label ||
    match?.value ||
    match?.slug ||
    ''
  )
}

export type ResolveImportDenominationInput = {
  denomination?: string
  coinValue?: CoinImportCoinValueMatch
  /** Raw coin_value was present but failed validation. */
  coinValueRejected?: boolean
  missing?: string[]
  unmatched?: string[]
  conflicts?: CoinImportApiConflict[]
  options: TaxonomyOption[]
}

/**
 * Resolve denomination for form mapping.
 * Only auto-applies when a valid matched coin_value resolves to a local taxonomy option.
 * On missing / unmatched / conflict / invalid: returns '' (caller must not clear existing form value).
 */
export function resolveImportDenominationValue(
  input: ResolveImportDenominationInput,
): string {
  if (hasDenominationConflictWithoutWinner(input.conflicts)) {
    return ''
  }

  if (isCoinValueReportedMissing(input.missing, input.unmatched)) {
    return ''
  }

  if (input.coinValueRejected) {
    return ''
  }

  if (input.coinValue) {
    return resolveCoinValueToDenominationName(input.coinValue, input.options)
  }

  return findDenominationOptionFromImport(input.denomination, input.options)?.name ?? ''
}
