import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'

type AdminSendPasswordResetDialogProps = {
  open: boolean
  email: string
  isSubmitting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function AdminSendPasswordResetDialog({
  open,
  email,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}: AdminSendPasswordResetDialogProps) {
  const { t } = useTranslation()

  if (!open) {
    return null
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
        aria-labelledby="admin-send-reset-title"
        className="w-full max-w-sm rounded-2xl border border-border/70 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-send-reset-title" className="font-serif text-xl font-semibold text-navy">
          {t('admin.userManagement.sendResetTitle')}
        </h2>
        <p className="mt-2 text-sm text-navy-muted">
          {t('admin.userManagement.sendResetBody', { email })}
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting
              ? t('admin.userManagement.sendingReset')
              : t('admin.userManagement.sendResetConfirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
