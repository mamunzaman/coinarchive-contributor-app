import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getProfileDisplayPreview,
  hasProfileFieldErrors,
  toProfileUpdatePayload,
  validateProfileFields,
  type ProfileUpdatePayload,
} from '../../lib/profileFields'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'

type ProfileInformationFormProps = {
  initialFirstName: string
  initialLastName: string
  initialDisplayName: string
  email: string
  isSaving: boolean
  saveFeedback?: ReactNode
  onSubmit: (payload: ProfileUpdatePayload) => void
}

export function ProfileInformationForm({
  initialFirstName,
  initialLastName,
  initialDisplayName,
  email,
  isSaving,
  saveFeedback,
  onSubmit,
}: ProfileInformationFormProps) {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    setFirstName(initialFirstName)
    setLastName(initialLastName)
    setDisplayName(initialDisplayName)
  }, [initialDisplayName, initialFirstName, initialLastName])

  const fieldErrors = useMemo(
    () => validateProfileFields({ first_name: firstName, last_name: lastName }),
    [firstName, lastName],
  )

  const displayPreview = useMemo(
    () => getProfileDisplayPreview(firstName, lastName, displayName),
    [displayName, firstName, lastName],
  )

  const canSubmit = !isSaving && !hasProfileFieldErrors(fieldErrors)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowValidation(true)

    const errors = validateProfileFields({ first_name: firstName, last_name: lastName })
    if (hasProfileFieldErrors(errors)) {
      return
    }

    onSubmit(toProfileUpdatePayload(firstName, lastName, displayName))
  }

  return (
    <Card>
      <h2 className="font-serif text-lg font-semibold text-navy">{t('profile.form.title')}</h2>
      <p className="mt-2 text-sm text-navy-muted">{t('profile.form.helper')}</p>

      {saveFeedback ? <div className="mt-4">{saveFeedback}</div> : null}

      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="profile-first-name"
          label={t('profile.form.firstName')}
          name="first_name"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          disabled={isSaving}
          required
          error={
            showValidation && fieldErrors.first_name === 'required'
              ? t('profile.form.firstNameRequired')
              : undefined
          }
        />

        <TextField
          id="profile-last-name"
          label={t('profile.form.lastName')}
          name="last_name"
          autoComplete="family-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          disabled={isSaving}
          required
          error={
            showValidation && fieldErrors.last_name === 'required'
              ? t('profile.form.lastNameRequired')
              : undefined
          }
        />

        <TextField
          id="profile-display-name"
          label={t('profile.form.displayName')}
          name="display_name"
          autoComplete="nickname"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={isSaving}
          hint={t('profile.form.displayNameOptional')}
        />

        {!displayName.trim() ? (
          <p className="text-sm text-navy-muted">
            {t('profile.form.displayNamePreview', { name: displayPreview })}
          </p>
        ) : null}

        <TextField
          id="profile-email"
          label={t('profile.form.email')}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          readOnly
          disabled
          hint={t('profile.form.emailReadOnly')}
        />

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={!canSubmit}>
            {isSaving ? t('profile.form.saving') : t('profile.form.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
