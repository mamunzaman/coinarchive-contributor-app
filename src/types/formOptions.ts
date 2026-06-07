export type TaxonomyOption = {
  id: number
  name: string
  slug: string
}

export type FormOptions = {
  countries: TaxonomyOption[]
  values: TaxonomyOption[]
  types: TaxonomyOption[]
}

export const TAXONOMY_OTHER_VALUE = '__other__'

export function isKnownTaxonomyOption(value: string, options: TaxonomyOption[]): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  return options.some((option) => option.name === trimmed)
}

export function getTaxonomySelectValue(value: string, options: TaxonomyOption[]): string {
  if (!value.trim()) {
    return ''
  }

  if (isKnownTaxonomyOption(value, options)) {
    return value.trim()
  }

  return TAXONOMY_OTHER_VALUE
}

export const EMPTY_FORM_OPTIONS: FormOptions = {
  countries: [],
  values: [],
  types: [],
}
