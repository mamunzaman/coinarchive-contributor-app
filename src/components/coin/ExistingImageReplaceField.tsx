import { useTranslation } from 'react-i18next'
import {
  getCoinImageRemovePreviewNotice,
  getImagePreviewLabel,
  resolveCoinImageClearAction,
  type ImagePreviewSource,
} from '../../lib/imagePreview'
import type { FaceImageVisualState } from '../../lib/faceImageUtils'
import { CroppableFileUploadField } from '../ui/CroppableFileUploadField'

type ExistingImageReplaceFieldProps = {
  label: string
  replaceLabel: string
  sideLabel: string
  currentUrl?: string | null
  previewUrl?: string | null
  previewSource?: ImagePreviewSource
  previewAlt?: string
  fileName?: string | null
  isNewSelection?: boolean
  imageEditMode?: boolean
  existingImageRemoved?: boolean
  error?: string
  attention?: string
  formOptionsLoading?: boolean
  statusLabel?: string
  attachmentMeta?: string | null
  removeDisabled?: boolean
  removeDisabledReason?: string
  name?: string
  disabled?: boolean
  faceSide?: 'obverse' | 'reverse'
  visualState?: FaceImageVisualState
  confirmPending?: boolean
  onFileChange: (file: File | null) => void
  onClear?: () => void
}

export function ExistingImageReplaceField({
  label,
  replaceLabel,
  sideLabel,
  currentUrl,
  previewUrl,
  previewSource = 'none',
  previewAlt,
  fileName,
  isNewSelection = false,
  imageEditMode = false,
  existingImageRemoved = false,
  error,
  attention,
  formOptionsLoading = false,
  statusLabel,
  attachmentMeta,
  removeDisabled = false,
  removeDisabledReason,
  name,
  disabled,
  faceSide,
  visualState,
  confirmPending,
  onFileChange,
  onClear,
}: ExistingImageReplaceFieldProps) {
  const { t } = useTranslation()
  const thumbnailUrl = previewUrl ?? currentUrl ?? null
  const hasExistingSubmissionImage = Boolean(currentUrl)
  const hasVisiblePreview =
    Boolean(thumbnailUrl) ||
    previewSource === 'default' ||
    previewSource === 'existing'
  const canRemoveFromSubmission =
    imageEditMode &&
    !existingImageRemoved &&
    !isNewSelection &&
    hasVisiblePreview &&
    Boolean(onClear)

  const revertAction = isNewSelection
    ? resolveCoinImageClearAction({
        sideLabel,
        isNewSelection: true,
        hasExistingImage: hasExistingSubmissionImage,
        imageEditMode,
        existingImageRemoved,
      })
    : null

  const removeAction = canRemoveFromSubmission
    ? {
        label: t('common.remove'),
        variant: 'destructive' as const,
        ariaLabel: t('imagePreview.removeImageAria', { side: sideLabel }),
      }
    : null

  const clearNotice =
    imageEditMode && existingImageRemoved && !isNewSelection
      ? getCoinImageRemovePreviewNotice()
      : null

  return (
    <div className="flex h-full min-w-0 flex-col">
      <CroppableFileUploadField
        label={replaceLabel}
        name={name}
        fileName={fileName ?? null}
        previewUrl={thumbnailUrl}
        previewSource={isNewSelection ? 'selected' : previewSource}
        previewLabel={getImagePreviewLabel(isNewSelection ? 'selected' : previewSource, fileName)}
        previewAlt={previewAlt ?? label}
        statusLabel={statusLabel}
        attachmentMeta={attachmentMeta}
        formOptionsLoading={formOptionsLoading}
        isNewSelection={isNewSelection}
        revertAction={revertAction}
        removeAction={removeAction}
        showRemoveButton={canRemoveFromSubmission}
        removeDisabled={removeDisabled}
        removeDisabledReason={removeDisabledReason}
        clearNotice={clearNotice}
        error={error}
        attention={attention}
        disabled={disabled}
        layout={imageEditMode ? 'hero' : 'stacked'}
        cropTitle={`Crop ${sideLabel.toLowerCase()}`}
        actionsAriaLabel={t('form.faceImageActions', { side: sideLabel })}
        faceSide={faceSide}
        visualState={visualState}
        confirmPending={confirmPending}
        onFileChange={onFileChange}
        onRevert={onClear}
        onRemove={onClear}
      />
    </div>
  )
}
