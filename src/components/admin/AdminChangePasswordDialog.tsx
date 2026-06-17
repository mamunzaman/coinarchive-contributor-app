import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { PasswordField } from '../ui/PasswordField'
import { PasswordStrengthMeter } from '../ui/PasswordStrengthMeter'

const MIN_PASSWORD_LENGTH = 8

type AdminChangePasswordDialogProps = {
  open: boolean
  userLabel: string
  isSubmitting: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (payload: { new_password: string; send_email: boolean }) => void
}

export function AdminChangePasswordDialog({
  open,
  userLabel,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: AdminChangePasswordDialogProps) {
  const { t } = useTranslation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    if (!open) {
      setNewPassword('')
      setConfirmPassword('')
      setSendEmail(true)
      setShowValidation(false)
    }
  }, [open])

  const newPasswordError = useMemo(() => {
    if (!showValidation && !newPassword) return undefined
    if (newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH) {
      return t('admin.userManagement.passwordTooShort')
    }
    if (showValidation && newPassword.length < MIN_PASSWORD_LENGTH) {
      return t('admin.userManagement.passwordTooShort')
    }
    return undefined
  }, [newPassword, showValidation, t])

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) {
      return showValidation ? t('admin.userManagement.confirmPasswordRequired') : undefined
    }
    if (newPassword !== confirmPassword) {
      return t('admin.userManagement.passwordMismatch')
    }
    return undefined
  }, [confirmPassword, newPassword, showValidation, t])

  const canSubmit =
    !isSubmitting &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword

  if (!open) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowValidation(true)
    if (!canSubmit) {
      return
    }

    const password = newPassword
    setNewPassword('')
    setConfirmPassword('')
    onSubmit({ new_password: password, send_email: sendEmail })
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
        aria-labelledby="admin-change-password-title"
        className="w-full max-w-md rounded-2xl border border-border/70 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-change-password-title" className="font-serif text-xl font-semibold text-navy">
          {t('admin.userManagement.changePasswordTitle')}
        </h2>
        <p className="mt-2 text-sm text-navy-muted">
          {t('admin.userManagement.changePasswordBody', { name: userLabel })}
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <PasswordField
            label={t('admin.userManagement.newPassword')}
            name="new_password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={newPasswordError}
            disabled={isSubmitting}
            required
          />
          <PasswordStrengthMeter password={newPassword} />
          <PasswordField
            label={t('admin.userManagement.confirmPassword')}
            name="confirm_password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={confirmPasswordError}
            disabled={isSubmitting}
            required
          />

          <label className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <span>{t('admin.userManagement.sendEmailNotification')}</span>
          </label>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting
                ? t('admin.userManagement.changingPassword')
                : t('admin.userManagement.changePasswordConfirm')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
