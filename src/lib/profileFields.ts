export type ProfileUpdatePayload = {
  first_name: string
  last_name: string
  display_name?: string
}

export type AdminContributorProfileUpdatePayload = ProfileUpdatePayload & {
  email: string
  role: 'contributor' | 'admin'
  status: string
}

export type ProfileFieldKey = 'first_name' | 'last_name' | 'email'

export type ProfileFieldErrors = Partial<Record<ProfileFieldKey, 'required' | 'invalid'>>

export function normalizeProfileValue(value: string): string {
  return value.trim()
}

export function getProfileDisplayPreview(
  firstName: string,
  lastName: string,
  displayName?: string,
): string {
  const display = normalizeProfileValue(displayName ?? '')
  if (display) {
    return display
  }

  const combined = [normalizeProfileValue(firstName), normalizeProfileValue(lastName)]
    .filter(Boolean)
    .join(' ')

  return combined || '—'
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateProfileFields(
  values: {
    first_name: string
    last_name: string
    email?: string
  },
  options?: { requireEmail?: boolean },
): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {}

  if (!normalizeProfileValue(values.first_name)) {
    errors.first_name = 'required'
  }

  if (!normalizeProfileValue(values.last_name)) {
    errors.last_name = 'required'
  }

  if (options?.requireEmail) {
    const email = normalizeProfileValue(values.email ?? '')
    if (!email) {
      errors.email = 'required'
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'invalid'
    }
  }

  return errors
}

export function hasProfileFieldErrors(errors: ProfileFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function toProfileUpdatePayload(
  firstName: string,
  lastName: string,
  displayName: string,
): ProfileUpdatePayload {
  const first_name = normalizeProfileValue(firstName)
  const last_name = normalizeProfileValue(lastName)
  const display_name = normalizeProfileValue(displayName)

  return display_name
    ? { first_name, last_name, display_name }
    : { first_name, last_name }
}

export function getEditableDisplayName(
  firstName: string,
  lastName: string,
  displayName: string,
): string {
  const display = normalizeProfileValue(displayName)
  const autoPreview = getProfileDisplayPreview(firstName, lastName, '')

  if (!display || display === autoPreview) {
    return ''
  }

  return display
}
