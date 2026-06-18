import { getCoinIssueStatusDisplayLabel } from './coinDisplayLabels'
import type { CoinImportReviewFieldRow } from './coinImport'
import type { CoinFormValues } from '../types/coinForm'
import { formatMintStatusLabel } from '../types/coinForm'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatImportReviewDateDisplay(
  value: string,
  locale: string,
): { display: string; formValue?: string } {
  const trimmed = value.trim()
  if (!trimmed) {
    return { display: '—' }
  }

  const isoMatch = ISO_DATE.exec(trimmed)
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    if (!Number.isNaN(parsed.getTime())) {
      return {
        display: parsed.toLocaleDateString(locale, { dateStyle: 'medium' }),
        formValue: trimmed,
      }
    }
  }

  return { display: trimmed }
}

export function formatImportReviewMintageDisplay(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return '—'
  }
  return trimmed
}

function resolveIssueStatusDisplay(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  return getCoinIssueStatusDisplayLabel(trimmed) || trimmed
}

export function resolveImportReviewCurrentDisplay(
  row: CoinImportReviewFieldRow,
  currentValues: CoinFormValues,
  locale: string,
): string {
  if (row.formField === 'mintMarksAvailable') {
    const raw = currentValues.mintMarksAvailable.trim()
    return raw || '—'
  }

  if (row.formField === 'hasMintVariants') {
    return formatMintStatusLabel(currentValues.hasMintVariants)
  }

  if (!row.formField) {
    return '—'
  }

  const raw = String(currentValues[row.formField] ?? '').trim()
  if (!raw) {
    return '—'
  }

  if (row.key === 'released_date') {
    return formatImportReviewDateDisplay(raw, locale).display
  }

  if (row.key === 'coin_issue_status') {
    return resolveIssueStatusDisplay(raw)
  }

  if (row.key === 'coin_mintage') {
    return formatImportReviewMintageDisplay(raw)
  }

  return raw
}

export type ImportReviewImportedDisplay = {
  display: string
  showMintageHint: boolean
  formValueNote?: string
}

export function resolveImportReviewImportedDisplay(
  row: CoinImportReviewFieldRow,
  locale: string,
): ImportReviewImportedDisplay {
  const resolvedApply =
    row.key === 'coin_issue_status' && row.applyValue?.trim()
      ? resolveIssueStatusDisplay(row.applyValue)
      : row.applyValue?.trim()

  const rawValue =
    row.isTaxonomy && row.matchedValue ? row.matchedValue : resolvedApply || row.aiValue || ''

  if (!rawValue.trim()) {
    return { display: '—', showMintageHint: false }
  }

  if (row.key === 'released_date') {
    const formatted = formatImportReviewDateDisplay(rawValue, locale)
    return {
      display: formatted.display,
      showMintageHint: false,
      formValueNote:
        formatted.formValue && formatted.formValue !== formatted.display
          ? formatted.formValue
          : undefined,
    }
  }

  if (row.key === 'coin_mintage') {
    return {
      display: formatImportReviewMintageDisplay(rawValue),
      showMintageHint: true,
    }
  }

  if (row.key === 'coin_has_mint_variants') {
    const isMultiple = rawValue === 'true' || rawValue === '1'
    return { display: formatMintStatusLabel(isMultiple), showMintageHint: false }
  }

  if (row.key.startsWith('import_image_')) {
    return { display: rawValue, showMintageHint: false }
  }

  return { display: rawValue, showMintageHint: false }
}

export function formatImportReviewSourceHost(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return '—'
  }
  try {
    return new URL(trimmed).hostname.replace(/^www\./, '')
  } catch {
    return trimmed
  }
}

export function isImportReviewCountryAlreadyMatching(
  row: CoinImportReviewFieldRow,
  currentValues: CoinFormValues,
  locale: string,
): boolean {
  if (row.key !== 'country') {
    return false
  }

  const current = resolveImportReviewCurrentDisplay(row, currentValues, locale)
  const imported = resolveImportReviewImportedDisplay(row, locale)

  if (!current || current === '—' || !imported.display || imported.display === '—') {
    return false
  }

  return current.trim().toLowerCase() === imported.display.trim().toLowerCase()
}
