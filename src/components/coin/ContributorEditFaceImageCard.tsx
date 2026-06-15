import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExistingImageReplaceField } from './ExistingImageReplaceField'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { ImagePreviewSource } from '../../lib/imagePreview'

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
  attachmentId,
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
  const hasExistingImage = Boolean(currentUrl)

  function handleClear() {
    if (isNewSelection) {
      onClearSelection?.()
      return
    }

    if (hasExistingImage && !existingImageRemoved) {
      setConfirmOpen(true)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">
          {sideLabel}
        </span>
        {attachmentId && attachmentId > 0 ? (
          <span className="text-xs text-navy-muted">
            {t('form.imageAttachmentId', { id: attachmentId })}
          </span>
        ) : null}
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
