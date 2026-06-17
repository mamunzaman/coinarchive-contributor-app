import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { changeOwnPassword, mapChangePasswordError } from '../../services/profileApi'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { PasswordField } from '../ui/PasswordField'
import { PasswordStrengthMeter } from '../ui/PasswordStrengthMeter'
import { SaveFeedbackBanner } from '../ui/SaveFeedbackBanner'
import { SaveFeedbackToast } from '../ui/SaveFeedbackToast'

const MIN_PASSWORD_LENGTH = 8

type ChangePasswordFormProps = {
  token: string | null
}

export function ChangePasswordForm({ token }: ChangePasswordFormProps) {
  const { t } = useTranslation()
  const {
    inlineRef,
    inlineFeedback,
    inlineExiting,
    toast,
    showSuccess,
    showError,
    dismissToast,
    clearInlineFeedback,
  } = useSaveFeedback()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const currentPasswordError = useMemo(() => {
    if (!showValidation && !currentPassword) {
      return undefined
    }
    if (!currentPassword.trim()) {
      return t('profile.password.currentRequired')
    }
    return undefined
  }, [currentPassword, showValidation, t])

  const newPasswordError = useMemo(() => {
    if (!showValidation && !newPassword) {
      return undefined
    }
    if (newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH) {
      return t('profile.password.tooWeak')
    }
    if (showValidation && newPassword.length < MIN_PASSWORD_LENGTH) {
      return t('profile.password.tooWeak')
    }
    return undefined
  }, [newPassword, showValidation, t])

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) {
      return showValidation ? t('profile.password.confirmRequired') : undefined
    }
    if (newPassword !== confirmPassword) {
      return t('profile.password.mismatch')
    }
    return undefined
  }, [confirmPassword, newPassword, showValidation, t])

  const canSubmit =
    !isSubmitting &&
    currentPassword.trim().length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword

  function clearFields() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowValidation(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowValidation(true)
    clearInlineFeedback()

    if (!canSubmit) {
      return
    }

    if (!token) {
      showError(t('profile.password.sessionExpired'))
      return
    }

    setIsSubmitting(true)

    try {
      await changeOwnPassword(token, {
        current_password: currentPassword.trim(),
        new_password: newPassword,
      })
      clearFields()
      showSuccess(t('profile.password.saveSuccess'))
    } catch (err) {
      showError(mapChangePasswordError(err, t))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SaveFeedbackToast toast={toast} onDismiss={dismissToast} />
      <Card>
        <h2 className="font-serif text-lg font-semibold text-navy">{t('profile.password.title')}</h2>
        <p className="mt-2 text-sm text-navy-muted">{t('profile.password.description')}</p>

        {inlineFeedback ? (
          <div className="mt-4">
            <SaveFeedbackBanner
              ref={inlineRef}
              variant={inlineFeedback.variant}
              message={inlineFeedback.message}
              exiting={inlineExiting}
            />
          </div>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <PasswordField
            id="profile-current-password"
            label={t('profile.password.current')}
            name="current_password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={isSubmitting}
            required
            error={currentPasswordError}
          />

          <PasswordField
            id="profile-new-password"
            label={t('profile.password.new')}
            name="new_password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isSubmitting}
            required
            error={newPasswordError}
          />

          <PasswordStrengthMeter password={newPassword} />

          <PasswordField
            id="profile-confirm-password"
            label={t('profile.password.confirm')}
            name="confirm_password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting}
            required
            error={confirmPasswordError}
          />

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('profile.password.updating') : t('profile.password.update')}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
