import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExistingImageReplaceField } from './ExistingImageReplaceField'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { ImagePreviewSource } from '../../lib/imagePreview'
import type { FaceImageVisualState } from '../../lib/faceImageUtils'

type ContributorEditFaceImageCardProps = {
  side: 'obverse' | 'reverse'
  attachmentId?: number | null
  replaceLabel: string
  previewUrl?: string | null
  previewSource?: ImagePreviewSource
  previewAlt: string
  currentUrl?: string | null
  fileName?: string | null
  isNewSelection?: boolean
  existingImageRemoved?: boolean
  error?: string
  attention?: string
  formOptionsLoading?: boolean
  name: string
  disabled?: boolean
  onFileChange: (file: File | null) => void
  onConfirmRemove: () => void
  onUndoRemove?: () => void
  onClearSelection?: () => void
}

export function ContributorEditFaceImageCard({
  side,
  replaceLabel,
  previewUrl,
  previewSource,
  previewAlt,
  currentUrl,
  fileName,
  isNewSelection = false,
  existingImageRemoved = false,
  error,
  attention,
  formOptionsLoading = false,
  name,
  disabled,
  onFileChange,
  onConfirmRemove,
  onUndoRemove,
  onClearSelection,
}: ContributorEditFaceImageCardProps) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const sideLabel = side === 'obverse' ? t('form.obverse') : t('form.reverse')
  const hasEffectiveImage =
    !existingImageRemoved &&
    !isNewSelection &&
    (Boolean(previewUrl) ||
      Boolean(currentUrl) ||
      previewSource === 'default' ||
      previewSource === 'existing')
  const attachmentMeta = hasEffectiveImage
    ? t(side === 'obverse' ? 'form.currentObverse' : 'form.currentReverse')
    : null
  const visualState: FaceImageVisualState = confirmOpen
    ? 'idle'
    : existingImageRemoved && !isNewSelection
      ? 'removed'
      : formOptionsLoading
        ? 'uploading'
        : 'idle'

  function handleClear() {
    if (isNewSelection) {
      onClearSelection?.()
      return
    }

    if (hasEffectiveImage) {
      setConfirmOpen(true)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border/60 bg-white p-3 shadow-sm sm:p-4">
      <div className="coin-face-card__header">
        <span className="coin-face-card__side-label">{sideLabel}</span>
        <span
          className={[
            'coin-face-chip',
            visualState === 'removed'
              ? 'coin-face-chip--missing'
              : hasEffectiveImage || isNewSelection
                ? 'coin-face-chip--ready'
                : 'coin-face-chip--missing',
          ].join(' ')}
        >
          {visualState === 'removed'
            ? t('form.imageMissing')
            : hasEffectiveImage || isNewSelection
              ? t('form.imageReady')
              : t('form.imageMissing')}
        </span>
      </div>

      <ExistingImageReplaceField
        label={t(side === 'obverse' ? 'form.currentObverse' : 'form.currentReverse')}
        replaceLabel={replaceLabel}
        sideLabel={sideLabel}
        currentUrl={currentUrl}
        previewUrl={previewUrl}
        previewSource={previewSource}
        previewAlt={previewAlt}
        name={name}
        fileName={fileName ?? null}
        isNewSelection={isNewSelection}
        imageEditMode
        existingImageRemoved={existingImageRemoved}
        error={error}
        attention={attention}
        disabled={disabled}
        formOptionsLoading={formOptionsLoading}
        statusLabel={sideLabel}
        attachmentMeta={attachmentMeta}
        faceSide={side}
        visualState={visualState}
        confirmPending={confirmOpen}
        onFileChange={onFileChange}
        onClear={handleClear}
      />

      {existingImageRemoved && !isNewSelection ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{t('form.imageRemoveOnSave')}</span>
          {onUndoRemove ? (
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={onUndoRemove}
            >
              {t('form.imageRemoveUndo')}
            </button>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={t('form.imageRemoveConfirmTitle', { side: sideLabel })}
        description={t('form.imageRemoveConfirmBody')}
        confirmLabel={t('form.imageRemoveConfirmAction')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onConfirmRemove()
        }}
      />
    </div>
  )
}
