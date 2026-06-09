import type { ImagePreviewSource } from '../../lib/imagePreview'
import { getImagePreviewLabel } from '../../lib/imagePreview'
import { CroppableFileUploadField } from '../ui/CroppableFileUploadField'

type ExistingImageReplaceFieldProps = {
  label: string
  replaceLabel: string
  currentUrl?: string | null
  previewUrl?: string | null
  previewSource?: ImagePreviewSource
  previewAlt?: string
  fileName?: string | null
  isNewSelection?: boolean
  error?: string
  attention?: string
  formOptionsLoading?: boolean
  name?: string
  disabled?: boolean
  onFileChange: (file: File | null) => void
}

export function ExistingImageReplaceField({
  label,
  replaceLabel,
  currentUrl,
  previewUrl,
  previewSource = 'none',
  previewAlt,
  fileName,
  isNewSelection = false,
  error,
  attention,
  formOptionsLoading = false,
  name,
  disabled,
  onFileChange,
}: ExistingImageReplaceFieldProps) {
  const thumbnailUrl = previewUrl ?? currentUrl ?? null

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {isNewSelection ? (
        <div className="flex justify-end">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            New image selected
          </span>
        </div>
      ) : null}
      <CroppableFileUploadField
        label={replaceLabel}
        name={name}
        fileName={fileName ?? null}
        previewUrl={thumbnailUrl}
        previewSource={isNewSelection ? 'selected' : previewSource}
        previewLabel={getImagePreviewLabel(isNewSelection ? 'selected' : previewSource, fileName)}
        previewAlt={previewAlt ?? label}
        formOptionsLoading={formOptionsLoading}
        isNewSelection={isNewSelection}
        error={error}
        attention={attention}
        disabled={disabled}
        onFileChange={onFileChange}
      />
    </div>
  )
}
