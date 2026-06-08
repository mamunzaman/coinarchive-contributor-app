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

export const TAXONOMY_OPTIONS_FAILED_MESSAGE =
  'Options could not be loaded. Please refresh and try again.'

export const TAXONOMY_INVALID_OPTION_MESSAGE = 'Please select a valid existing option.'

export const TAXONOMY_STALE_VALUE_MESSAGE =
  'This saved value is no longer available in the taxonomy list. Please choose a valid option.'

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
