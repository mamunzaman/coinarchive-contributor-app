export type RegisterFormValues = {
  display_name: string
  email: string
  password: string
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegisterForm(values: RegisterFormValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {}

  if (!values.display_name.trim()) {
    errors.display_name = 'Display name is required.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

export type LoginFormValues = {
  email: string
  password: string
}

export type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>

export function validateLoginForm(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

import type { CoinFormValues } from '../types/coinForm'
import {
  isKnownTaxonomyOption,
  TAXONOMY_INVALID_OPTION_MESSAGE,
  TAXONOMY_OPTIONS_FAILED_MESSAGE,
  type FormOptions,
  type TaxonomyOption,
} from '../types/formOptions'

export type NewCoinFormValues = CoinFormValues

export type NewCoinFieldErrors = Partial<Record<keyof CoinFormValues, string>>

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export type CoinFormValidationContext = {
  formOptions?: FormOptions
  formOptionsReady?: boolean
  formOptionsFailed?: boolean
}

function validateTaxonomySelection(
  value: string,
  options: TaxonomyOption[],
  field: 'country' | 'denomination' | 'coin_type',
  errors: NewCoinFieldErrors,
  context?: CoinFormValidationContext,
): void {
  if (!context) {
    return
  }

  if (context.formOptionsFailed || (context.formOptionsReady && options.length === 0)) {
    errors[field] = TAXONOMY_OPTIONS_FAILED_MESSAGE
    return
  }

  if (!context.formOptionsReady) {
    errors[field] = TAXONOMY_OPTIONS_FAILED_MESSAGE
    return
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return
  }

  if (!isKnownTaxonomyOption(trimmed, options)) {
    errors[field] = TAXONOMY_INVALID_OPTION_MESSAGE
  }
}

export function validateNewCoinForm(
  values: NewCoinFormValues,
  context?: CoinFormValidationContext,
): NewCoinFieldErrors {
  const errors: NewCoinFieldErrors = {}
  const formOptions = context?.formOptions

  if (!values.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!values.country.trim()) {
    errors.country = 'Country is required.'
  }

  const minYear = 500
  const maxYear = new Date().getFullYear() + 1
  const yearValue = values.year.trim()

  if (!yearValue) {
    errors.year = 'Year is required.'
  } else if (!/^\d+$/.test(yearValue)) {
    errors.year = 'Enter a valid year.'
  } else {
    const year = Number.parseInt(yearValue, 10)

    if (year < minYear) {
      errors.year = `Year must be ${minYear} or later.`
    } else if (year > maxYear) {
      errors.year = `Year cannot be later than ${maxYear}.`
    }
  }

  if (!values.denomination.trim()) {
    errors.denomination = 'Denomination is required.'
  }

  if (!values.coin_type.trim()) {
    errors.coin_type = 'Coin type is required.'
  }

  if (!values.short_description.trim()) {
    errors.short_description = 'Short description is required.'
  }

  if (!values.released_date.trim()) {
    errors.released_date = 'Release date required.'
  }

  if (formOptions) {
    validateTaxonomySelection(
      values.country,
      formOptions.countries,
      'country',
      errors,
      context,
    )
    validateTaxonomySelection(
      values.denomination,
      formOptions.values,
      'denomination',
      errors,
      context,
    )
    validateTaxonomySelection(
      values.coin_type,
      formOptions.types,
      'coin_type',
      errors,
      context,
    )
  }

  return errors
}

export function validateImageFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const typeAllowed = ALLOWED_IMAGE_TYPES.has(file.type)
  const extensionAllowed = ALLOWED_IMAGE_EXTENSIONS.has(extension)

  if (!typeAllowed && !extensionAllowed) {
    return 'File must be JPG, PNG, or WEBP.'
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return 'File must be 5MB or smaller.'
  }

  return null
}
