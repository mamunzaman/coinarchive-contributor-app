import type { CoinFormValues } from '../types/coinForm'

export type RevisionFieldChange = {
  field: string
  label: string
  previous: string
  current: string
}

const FIELD_LABELS: Partial<Record<keyof CoinFormValues, string>> = {
  title: 'Title',
  country: 'Country',
  year: 'Year',
  denomination: 'Denomination',
  coin_type: 'Coin type',
  short_description: 'Description',
  coin_theme: 'Theme',
  coin_material: 'Material',
  coin_mintage: 'Mintage',
  singleMintMark: 'Mint mark',
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'string') {
    return value.trim() || '—'
  }

  return String(value ?? '—')
}

export function compareCoinFormValues(
  previous: CoinFormValues,
  current: CoinFormValues,
): RevisionFieldChange[] {
  const changes: RevisionFieldChange[] = []

  for (const field of Object.keys(FIELD_LABELS) as Array<keyof CoinFormValues>) {
    const previousValue = formatValue(previous[field])
    const currentValue = formatValue(current[field])

    if (previousValue !== currentValue) {
      changes.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        previous: previousValue,
        current: currentValue,
      })
    }
  }

  return changes
}

export function getImageChangeLabels(options: {
  obverseChanged: boolean
  reverseChanged: boolean
  galleryChanged: boolean
}): string[] {
  const labels: string[] = []

  if (options.obverseChanged) {
    labels.push('Obverse image replaced')
  }

  if (options.reverseChanged) {
    labels.push('Reverse image replaced')
  }

  if (options.galleryChanged) {
    labels.push('Gallery updated')
  }

  return labels
}
