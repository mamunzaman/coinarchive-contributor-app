import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Check, CircleAlert, Crop, ImageOff, Loader2, Trash2 } from 'lucide-react'
import { CoinImagePreviewSlot } from '../coin/CoinImagePreviewSlot'
import {
  GalleryMediaIconButton,
  GalleryMediaInfoBar,
  GalleryTileActionBar,
  CoinFaceEditHint,
} from '../coin/EditableGalleryGrid'
import type { CoinImageClearActionVariant } from '../../lib/imagePreview'
import type { ImagePreviewSource } from '../../lib/imagePreview'
import { getImagePreviewLabel } from '../../lib/imagePreview'

const ImageCropModal = lazy(() =>
  import('./ImageCropModal').then((module) => ({ default: module.ImageCropModal })),
)

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

export type FaceImageVisualState =
  | 'idle'
  | 'uploading'
  | 'saving'
  | 'saved'
  | 'removing'
  | 'removed'
  | 'reverting'
  | 'failed'

export type FaceFeedbackFlash = 'saved' | 'removed' | 'changesSaved'

export function isFaceOperationActive(state: FaceImageVisualState): boolean {
  return state === 'uploading' || state === 'saving' || state === 'removing' || state === 'reverting'
}

export function getFaceOverlayLabel(state: FaceImageVisualState, t: TFunction): string | null {
  switch (state) {
    case 'uploading':
      return t('form.faceUploadingImage')
    case 'saving':
      return t('form.faceSavingImage')
    case 'removing':
      return t('form.faceRemovingImage')
    case 'reverting':
      return t('form.faceRevertingImage')
    default:
      return null
  }
}

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

export function useFaceSectionSavedFlash(
  isSaving: boolean,
  obverseStatus: string,
  reverseStatus: string,
) {
  const [showSaved, setShowSaved] = useState(false)
  const wasSavingRef = useRef(false)

  useEffect(() => {
    if (wasSavingRef.current && !isSaving) {
      const failed = obverseStatus === 'failed' || reverseStatus === 'failed'
      if (!failed) {
        setShowSaved(true)
        const timer = window.setTimeout(() => setShowSaved(false), 2500)
        return () => window.clearTimeout(timer)
      }
    }
    wasSavingRef.current = isSaving
    return undefined
  }, [isSaving, obverseStatus, reverseStatus])

  return showSaved
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

type CoinImageClearAction = {
  label: string
  variant: CoinImageClearActionVariant
  ariaLabel: string
}

type CroppableFileUploadFieldProps = {
  label: string
  hint?: string
  error?: string
  attention?: string
  fileName?: string | null
  previewUrl?: string | null
  previewSource?: ImagePreviewSource
  previewLabel?: string
  previewAlt?: string
  statusLabel?: string
  attachmentMeta?: string | null
  formOptionsLoading?: boolean
  isNewSelection?: boolean
  revertAction?: CoinImageClearAction | null
  removeAction?: CoinImageClearAction | null
  showRemoveButton?: boolean
  removeDisabled?: boolean
  removeDisabledReason?: string | null
  clearNotice?: string | null
  name?: string
  id?: string
  disabled?: boolean
  layout?: 'stacked' | 'hero'
  cropTitle?: string
  actionsAriaLabel?: string
  faceSide?: 'obverse' | 'reverse'
  visualState?: FaceImageVisualState
  feedbackFlash?: FaceFeedbackFlash | null
  operationError?: string | null
  confirmPending?: boolean
  onRetry?: () => void
  onFileChange: (file: File | null) => void
  onRevert?: () => void
  onRemove?: () => void
}

export function CroppableFileUploadField({
  label,
  hint = 'JPG, PNG, WEBP up to 5MB — crop after selecting',
  error,
  attention,
  fileName,
  previewUrl,
  previewSource = 'none',
  previewLabel,
  previewAlt = 'Selected image preview',
  statusLabel,
  attachmentMeta,
  formOptionsLoading = false,
  isNewSelection = false,
  revertAction = null,
  removeAction = null,
  showRemoveButton = false,
  removeDisabled = false,
  removeDisabledReason = null,
  clearNotice = null,
  id,
  disabled,
  layout = 'stacked',
  cropTitle,
  actionsAriaLabel,
  faceSide,
  visualState = 'idle',
  feedbackFlash = null,
  operationError = null,
  confirmPending = false,
  onRetry,
  onFileChange,
  onRevert,
  onRemove,
}: CroppableFileUploadFieldProps) {
  const { t } = useTranslation()
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined
  const attentionId = !error && attention ? `${fieldId}-attention` : undefined
  const clearNoticeId = clearNotice ? `${fieldId}-clear-notice` : undefined
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function openCropWithFile(file: File) {
    setPendingFile(file)
    setCropOpen(true)
  }

  function handleRawSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''

    if (!file) {
      return
    }

    openCropWithFile(file)
  }

  function handleRevert() {
    setCropOpen(false)
    setPendingFile(null)
    onRevert?.()
  }

  function handleRemove() {
    onRemove?.()
  }

  const stackedSecondaryAction = revertAction ?? removeAction

  const displayName = previewLabel ?? getImagePreviewLabel(
    fileName ? 'selected' : previewSource,
    fileName,
  )

  const showDefaultBadge = previewSource === 'default' && !isNewSelection
  const hasPreview =
    formOptionsLoading ||
    Boolean(previewUrl) ||
    previewSource === 'default' ||
    isNewSelection

  if (layout === 'hero') {
    const isRemoved = visualState === 'removed'
    const showImage = hasPreview && !isRemoved
    const effectiveVisualState: FaceImageVisualState = formOptionsLoading
      ? 'uploading'
      : visualState
    const operationActive =
      !confirmPending && isFaceOperationActive(effectiveVisualState)
    const overlayLabel = operationActive ? getFaceOverlayLabel(effectiveVisualState, t) : null
    const actionsDisabled = Boolean(disabled) || operationActive
    const showImageActions = showImage && !formOptionsLoading
    const canShowRemove = Boolean(onRemove) && (Boolean(removeAction) || showRemoveButton)
    const canShowRevert = Boolean(revertAction && onRevert)
    const canShowTrash = canShowRemove || canShowRevert
    const replaceAriaLabel = label
    const showPreviewMeta = Boolean(statusLabel || attachmentMeta)
    const uploadAriaLabel =
      faceSide === 'obverse' ? t('form.uploadObverseImage') : t('form.uploadReverseImage')

    function openFilePicker() {
      if (actionsDisabled) {
        return
      }
      fileInputRef.current?.click()
    }

    return (
      <>
        <div className="coin-face-card">
          <div
            className={[
              'coin-face-card__preview',
              showImageActions ? 'group coin-face-card__preview--actions' : '',
              operationActive ? 'coin-face-card__preview--busy' : '',
            ].join(' ')}
          >
            {showImage ? (
              <>
                <CoinImagePreviewSlot
                  previewUrl={previewUrl}
                  previewSource={previewSource}
                  formOptionsLoading={formOptionsLoading}
                  isNewSelection={isNewSelection}
                  alt={previewAlt}
                  size="catalogue"
                  objectFit="contain"
                  className="coin-face-card__media h-full w-full rounded-2xl border-0 shadow-none"
                />

                {showPreviewMeta ? (
                  <GalleryMediaInfoBar
                    title={statusLabel ?? displayName}
                    meta={attachmentMeta ?? undefined}
                  />
                ) : null}

                {feedbackFlash ? <FaceCardFeedbackPill flash={feedbackFlash} /> : null}
                {effectiveVisualState === 'saved' && !feedbackFlash ? (
                  <FaceCardFeedbackPill flash="saved" />
                ) : null}

                {overlayLabel ? <FaceCardOperationOverlay label={overlayLabel} /> : null}

                {showImageActions && !operationActive ? <CoinFaceEditHint /> : null}

                {showImageActions ? (
                  <GalleryTileActionBar
                    ariaLabel={actionsAriaLabel ?? replaceAriaLabel}
                  >
                    <input
                      ref={fileInputRef}
                      id={fieldId}
                      type="file"
                      accept={ACCEPT}
                      className="sr-only"
                      disabled={actionsDisabled}
                      aria-label={replaceAriaLabel}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={[errorId, attentionId, clearNoticeId].filter(Boolean).join(' ') || undefined}
                      onChange={handleRawSelect}
                    />
                    <GalleryMediaIconButton
                      label={replaceAriaLabel}
                      tone="primary"
                      variant="overlay"
                      disabled={actionsDisabled}
                      onClick={openFilePicker}
                    >
                      <Crop className="h-5 w-5" aria-hidden />
                    </GalleryMediaIconButton>

                    {canShowTrash ? (
                      <GalleryMediaIconButton
                        label={
                          canShowRemove
                            ? removeAction?.ariaLabel ?? t('common.remove')
                            : revertAction!.ariaLabel
                        }
                        tone="danger"
                        variant="overlay"
                        disabled={actionsDisabled || removeDisabled}
                        onClick={canShowRemove ? handleRemove : handleRevert}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden />
                      </GalleryMediaIconButton>
                    ) : null}
                  </GalleryTileActionBar>
                ) : null}
              </>
            ) : isRemoved && faceSide ? (
              <FaceCardEmptyPlaceholder
                side={faceSide}
                inputId={fieldId}
                disabled={actionsDisabled}
                uploadAriaLabel={uploadAriaLabel}
                onFileSelect={openCropWithFile}
              />
            ) : (
              <div className="coin-face-card__empty">
                <label
                  className={[
                    'coin-face-card__empty-add',
                    actionsDisabled ? 'pointer-events-none opacity-50' : '',
                  ].join(' ')}
                >
                  <input
                    id={fieldId}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    disabled={actionsDisabled}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={[errorId, attentionId, clearNoticeId].filter(Boolean).join(' ') || undefined}
                    onChange={handleRawSelect}
                  />
                  <Crop className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{t('form.addAndCrop')}</span>
                </label>
              </div>
            )}
          </div>

          {operationError || error || effectiveVisualState === 'failed' ? (
            <FaceCardErrorBanner
              message={operationError ?? error ?? t('form.faceImageUpdateFailed')}
              onRetry={onRetry}
              retryLabel={t('form.faceTryAgain')}
            />
          ) : null}

          {removeDisabled && removeDisabledReason ? (
            <p className="text-xs text-navy-muted">{removeDisabledReason}</p>
          ) : null}

          {!showPreviewMeta && !isRemoved ? (
            <div className="coin-face-card__status">
              <p className="coin-face-card__status-label">
                {statusLabel ?? displayName}
              </p>
              {attachmentMeta ? (
                <p className="coin-face-card__status-meta">{attachmentMeta}</p>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-[1.125rem]">
            {!operationError && !error && effectiveVisualState !== 'failed' && attention ? (
              <p id={attentionId} className="text-xs text-amber-800">
                {attention}
              </p>
            ) : null}
            {!operationError && !error && effectiveVisualState !== 'failed' && !attention && clearNotice ? (
              <p id={clearNoticeId} className="text-xs text-navy-muted">
                {clearNotice}
              </p>
            ) : null}
          </div>
        </div>

        {cropOpen ? (
          <Suspense fallback={null}>
            <ImageCropModal
              open={cropOpen}
              file={pendingFile}
              title={cropTitle ?? `Crop ${label.toLowerCase()}`}
              onClose={() => {
                setCropOpen(false)
                setPendingFile(null)
              }}
              onSave={(file) => {
                onFileChange(file)
                setPendingFile(null)
                setCropOpen(false)
              }}
            />
          </Suspense>
        ) : null}
      </>
    )
  }

  return (
    <>
      <div className="flex h-full min-w-0 flex-col gap-1.5">
        <div className="flex min-h-7 items-center justify-between gap-2">
          <label htmlFor={fieldId} className="min-w-0 truncate text-sm font-medium text-navy">
            {label}
          </label>
          <div className="flex min-h-5 shrink-0 items-center justify-end gap-1.5">
            {isNewSelection ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                New image selected
              </span>
            ) : null}
            {showDefaultBadge ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Default
              </span>
            ) : null}
          </div>
        </div>
        <div
          className={[
            'coin-upload-card gap-3 rounded-xl border bg-muted/30 p-3 xl:gap-4 xl:p-5',
            error
              ? 'border-red-300'
              : attention
                ? 'border-amber-300/90 ring-1 ring-amber-200/70'
                : 'border-border',
          ].join(' ')}
        >
          <div className="coin-upload-card__body">
            <CoinImagePreviewSlot
              previewUrl={previewUrl}
              previewSource={previewSource}
              formOptionsLoading={formOptionsLoading}
              isNewSelection={isNewSelection}
              alt={previewAlt}
              size="field"
            />
            <div className="coin-upload-card__meta">
              <p
                className="truncate text-sm font-medium leading-5 text-navy"
                title={displayName}
              >
                {displayName}
              </p>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[11px] leading-snug text-navy-muted xl:mt-1.5 xl:min-h-[2.75rem] xl:text-xs xl:leading-relaxed">
                {hint}
              </p>
            </div>
          </div>
          <div className="coin-upload-card__actions">
            <label className="block w-full min-w-0">
              <input
                id={fieldId}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={[errorId, attentionId, clearNoticeId].filter(Boolean).join(' ') || undefined}
                onChange={handleRawSelect}
              />
              <span
                className={[
                  'flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors xl:min-h-11 xl:px-5 xl:py-3',
                  disabled ? 'pointer-events-none opacity-50' : 'hover:bg-primary/10',
                ].join(' ')}
              >
                <Crop className="h-4 w-4 shrink-0" aria-hidden />
                {fileName ? 'Replace & crop' : 'Choose & crop'}
              </span>
            </label>
            {stackedSecondaryAction && (onRevert || onRemove) ? (
              <button
                type="button"
                disabled={disabled || (removeAction ? removeDisabled : false)}
                aria-label={stackedSecondaryAction.ariaLabel}
                onClick={removeAction ? handleRemove : handleRevert}
                className={[
                  'flex min-h-10 w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors xl:min-h-11 xl:px-5 xl:py-3',
                  stackedSecondaryAction.variant === 'destructive'
                    ? 'border-red-200/90 bg-white text-red-700 hover:border-red-300 hover:bg-red-50'
                    : 'border-border/80 bg-white text-navy-muted hover:border-navy/15 hover:bg-page hover:text-navy',
                  disabled ? 'pointer-events-none opacity-50' : '',
                ].join(' ')}
              >
                {stackedSecondaryAction.label}
              </button>
            ) : (
              <div className="min-h-10 xl:min-h-11" aria-hidden="true" />
            )}
          </div>
        </div>
        <div className="min-h-[1.125rem]">
          {error ? (
            <p id={errorId} role="alert" className="text-xs text-red-600">
              {error}
            </p>
          ) : null}
          {!error && attention ? (
            <p id={attentionId} className="text-xs text-amber-800">
              {attention}
            </p>
          ) : null}
          {!error && !attention && clearNotice ? (
            <p id={clearNoticeId} className="text-xs text-navy-muted">
              {clearNotice}
            </p>
          ) : null}
        </div>
      </div>

      {cropOpen ? (
        <Suspense fallback={null}>
          <ImageCropModal
            open={cropOpen}
            file={pendingFile}
            title={cropTitle ?? `Crop ${label.toLowerCase()}`}
            onClose={() => {
              setCropOpen(false)
              setPendingFile(null)
            }}
            onSave={(file) => {
              onFileChange(file)
              setPendingFile(null)
              setCropOpen(false)
            }}
          />
        </Suspense>
      ) : null}
    </>
  )
}
