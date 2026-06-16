import { Check, CircleAlert, Crop, ImageOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FaceFeedbackFlash } from '../../lib/faceImageUtils'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

export function FaceCardOperationOverlay({ label }: { label: string }) {
  return (
    <div
      className="coin-face-card__operation-overlay"
      role="status"
      aria-live="polite"
      aria-hidden={false}
    >
      <span className="coin-face-card__operation-overlay-spinner" aria-hidden />
      <span className="coin-face-card__operation-overlay-label">{label}</span>
    </div>
  )
}

export function FaceCardFeedbackPill({ flash }: { flash: FaceFeedbackFlash }) {
  const { t } = useTranslation()
  const label =
    flash === 'saved'
      ? t('form.faceImageSaved')
      : flash === 'removed'
        ? t('form.faceImageRemoved')
        : t('form.faceChangesSaved')

  return (
    <div
      className="coin-face-card__feedback-pill coin-face-card__feedback-pill--success"
      role="status"
      aria-live="polite"
    >
      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

export function FaceCardErrorBanner({
  message,
  onRetry,
  retryLabel,
}: {
  message: string
  onRetry?: () => void
  retryLabel: string
}) {
  return (
    <div className="coin-face-card__error-banner" role="alert">
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">{message}</p>
      </div>
      {onRetry ? (
        <button type="button" className="coin-face-card__error-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}

export function FaceSectionSaveStatus({
  isSaving,
  showSaved,
  hasError,
}: {
  isSaving: boolean
  showSaved: boolean
  hasError: boolean
}) {
  const { t } = useTranslation()

  if (!isSaving && !showSaved && !hasError) {
    return null
  }

  const className = [
    'coin-face-section-status',
    isSaving
      ? 'coin-face-section-status--saving'
      : hasError
        ? 'coin-face-section-status--error'
        : 'coin-face-section-status--saved',
  ].join(' ')

  const label = isSaving
    ? t('form.faceSavingStatus')
    : hasError
      ? t('form.faceImageUpdateFailed')
      : t('detail.allChangesSaved')

  return (
    <div className={className} role="status" aria-live="polite">
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
      ) : hasError ? (
        <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span>{label}</span>
    </div>
  )
}

type FaceCardEmptyPlaceholderProps = {
  side: 'obverse' | 'reverse'
  inputId: string
  disabled?: boolean
  uploadAriaLabel: string
  onFileSelect: (file: File) => void
}

export function FaceCardEmptyPlaceholder({
  side,
  inputId,
  disabled,
  uploadAriaLabel,
  onFileSelect,
}: FaceCardEmptyPlaceholderProps) {
  const { t } = useTranslation()
  const emptyTitle =
    side === 'obverse' ? t('form.noObverseImage') : t('form.noReverseImage')
  const uploadLabel =
    side === 'obverse' ? t('form.uploadObverseImage') : t('form.uploadReverseImage')

  return (
    <div className="coin-face-card__empty coin-face-card__empty--removed">
      <div className="coin-face-card__empty-icon" aria-hidden>
        <ImageOff className="h-8 w-8" />
      </div>
      <p className="coin-face-card__empty-title">{emptyTitle}</p>
      <label
        className={[
          'coin-face-card__empty-add',
          disabled ? 'pointer-events-none opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled}
          aria-label={uploadAriaLabel}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            event.target.value = ''
            if (file) {
              onFileSelect(file)
            }
          }}
        />
        <Crop className="h-4 w-4 shrink-0" aria-hidden />
        <span>{uploadLabel}</span>
      </label>
    </div>
  )
}
