import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminContributorListItem } from '../../lib/adminApi'
import {
  getEditableDisplayName,
  getProfileDisplayPreview,
  hasProfileFieldErrors,
  normalizeProfileValue,
  validateProfileFields,
  type AdminContributorProfileUpdatePayload,
} from '../../lib/profileFields'
import { Button } from '../ui/Button'
import { SaveFeedbackBanner } from '../ui/SaveFeedbackBanner'
import { SelectField } from '../ui/SelectField'
import { TextField } from '../ui/TextField'

const ROLE_OPTIONS = [
  { value: 'contributor', labelKey: 'profile.adminEdit.roleContributor' },
  { value: 'admin', labelKey: 'profile.adminEdit.roleAdmin' },
] as const

const STATUS_OPTIONS = [
  { value: 'pending', labelKey: 'profile.adminEdit.statusPending' },
  { value: 'pending_approval', labelKey: 'profile.adminEdit.statusPendingApproval' },
  { value: 'approved', labelKey: 'profile.adminEdit.statusApproved' },
  { value: 'rejected', labelKey: 'profile.adminEdit.statusRejected' },
  { value: 'suspended', labelKey: 'profile.adminEdit.statusSuspended' },
] as const

type AdminContributorEditDialogProps = {
  open: boolean
  user: AdminContributorListItem | null
  isSubmitting: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (payload: AdminContributorProfileUpdatePayload) => void
}

function getInitialDisplayName(user: AdminContributorListItem): string {
  return getEditableDisplayName(
    user.first_name?.trim() ?? '',
    user.last_name?.trim() ?? '',
    user.display_name?.trim() ?? '',
  )
}

export function AdminContributorEditDialog({
  open,
  user,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: AdminContributorEditDialogProps) {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'contributor' | 'admin'>('contributor')
  const [status, setStatus] = useState('approved')
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    if (!open || !user) {
      return
    }

    setFirstName(user.first_name?.trim() ?? '')
    setLastName(user.last_name?.trim() ?? '')
    setDisplayName(getInitialDisplayName(user))
    setEmail(user.email?.trim() ?? '')
    setRole(user.role === 'admin' ? 'admin' : 'contributor')
    setStatus(user.status?.trim() || 'approved')
    setShowValidation(false)
  }, [open, user])

  const fieldErrors = useMemo(
    () =>
      validateProfileFields(
        { first_name: firstName, last_name: lastName, email },
        { requireEmail: true },
      ),
    [email, firstName, lastName],
  )

  const displayPreview = useMemo(
    () => getProfileDisplayPreview(firstName, lastName, displayName),
    [displayName, firstName, lastName],
  )

  const canSubmit = !isSubmitting && !hasProfileFieldErrors(fieldErrors)

  if (!open || !user) {
    return null
  }

  const userLabel = displayPreview !== '—' ? displayPreview : user.email?.trim() || `#${user.id}`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowValidation(true)

    const errors = validateProfileFields(
      { first_name: firstName, last_name: lastName, email },
      { requireEmail: true },
    )
    if (hasProfileFieldErrors(errors)) {
      return
    }

    const first_name = normalizeProfileValue(firstName)
    const last_name = normalizeProfileValue(lastName)
    const display_name = normalizeProfileValue(displayName)

    onSubmit({
      first_name,
      last_name,
      ...(display_name ? { display_name } : {}),
      email: normalizeProfileValue(email),
      role,
      status,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/40 p-4 sm:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-contributor-edit-title"
        className="max-h-[min(92vh,48rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/70 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-contributor-edit-title" className="font-serif text-xl font-semibold text-navy">
          {t('profile.adminEdit.title')}
        </h2>
        <p className="mt-2 text-sm text-navy-muted">
          {t('profile.adminEdit.body', { name: userLabel })}
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
          <TextField
            id="admin-edit-first-name"
            label={t('profile.form.firstName')}
            name="first_name"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={isSubmitting}
            required
            error={
              showValidation && fieldErrors.first_name === 'required'
                ? t('profile.form.firstNameRequired')
                : undefined
            }
          />

          <TextField
            id="admin-edit-last-name"
            label={t('profile.form.lastName')}
            name="last_name"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            disabled={isSubmitting}
            required
            error={
              showValidation && fieldErrors.last_name === 'required'
                ? t('profile.form.lastNameRequired')
                : undefined
            }
          />

          <TextField
            id="admin-edit-display-name"
            label={t('profile.form.displayName')}
            name="display_name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={isSubmitting}
            hint={t('profile.form.displayNameOptional')}
          />

          {!displayName.trim() ? (
            <p className="text-sm text-navy-muted">
              {t('profile.form.displayNamePreview', { name: displayPreview })}
            </p>
          ) : null}

          <TextField
            id="admin-edit-email"
            label={t('profile.form.email')}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            required
            error={
              showValidation && fieldErrors.email === 'required'
                ? t('profile.adminEdit.emailRequired')
                : showValidation && fieldErrors.email === 'invalid'
                  ? t('profile.adminEdit.emailInvalid')
                  : undefined
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              id="admin-edit-role"
              label={t('profile.adminEdit.role')}
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as 'contributor' | 'admin')}
              disabled={isSubmitting}
              options={ROLE_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
            />

            <SelectField
              id="admin-edit-status"
              label={t('profile.adminEdit.status')}
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={isSubmitting}
              options={STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
            />
          </div>

          {error ? (
            <SaveFeedbackBanner variant="error" message={error} />
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? t('profile.adminEdit.saving') : t('profile.adminEdit.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
