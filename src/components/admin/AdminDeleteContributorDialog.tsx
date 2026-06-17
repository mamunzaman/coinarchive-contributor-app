import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'

type AdminDeleteContributorDialogProps = {
  open: boolean
  contributorLabel: string
  isDeleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function AdminDeleteContributorDialog({
  open,
  contributorLabel,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: AdminDeleteContributorDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, isDeleting, onCancel])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/40 p-4 sm:items-center"
      role="presentation"
      onClick={isDeleting ? undefined : onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-delete-contributor-title"
        aria-describedby="admin-delete-contributor-description"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-border/70 bg-white p-5 shadow-[var(--shadow-card)] outline-none sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-delete-contributor-title" className="font-serif text-xl font-semibold text-navy">
          {t('admin.userManagement.deleteTitle')}
        </h2>
        {contributorLabel ? (
          <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium text-navy">
            {contributorLabel}
          </p>
        ) : null}
        <p id="admin-delete-contributor-description" className="mt-3 text-sm leading-relaxed text-navy-muted">
          {t('admin.userManagement.deleteBody')}
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isDeleting}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="!bg-red-700 hover:!bg-red-800"
            aria-label={t('admin.userManagement.deleteConfirm')}
          >
            {isDeleting ? t('admin.userManagement.deleting') : t('admin.userManagement.deleteConfirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
