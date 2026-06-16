import { useTranslation } from 'react-i18next'
import { GalleryAddCropTile, GalleryPendingMediaCard } from '../coin/EditableGalleryGrid'
import { COIN_MEDIA_GRID_CLASS } from '../../lib/coinMediaGrid'
import { usePendingFilePreviews } from '../../hooks/usePendingFilePreviews'
import { validateGalleryFiles } from '../../lib/galleryUploadValidation'
import { validateImageFile } from '../../lib/validation'

type CroppableMultiImageUploadFieldProps = {
  label: string
  hint?: string
  error?: string
  files: File[]
  name?: string
  id?: string
  disabled?: boolean
  hideFileList?: boolean
  onFilesChange: (files: File[]) => void
}

export function CroppableMultiImageUploadField({
  label,
  hint = 'JPG, PNG, WEBP up to 5MB each',
  error,
  files,
  id,
  disabled,
  hideFileList = false,
  onFilesChange,
}: CroppableMultiImageUploadFieldProps) {
  const { t } = useTranslation()
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined
  const previews = usePendingFilePreviews(files)
  const validationError = validateGalleryFiles(files)

  function handleAddFiles(newFiles: File[]) {
    const accepted = newFiles.filter((file) => !validateImageFile(file))
    if (accepted.length === 0) {
      return
    }
    onFilesChange([...files, ...accepted])
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  if (hideFileList) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-navy">
          {label}
        </label>
        <p id={fieldId} className="text-xs text-navy-muted">
          {hint}
        </p>
      </div>

      <div
        className={[
          error || validationError ? 'rounded-xl border border-red-300 p-1' : '',
        ].join(' ')}
        aria-invalid={error || validationError ? true : undefined}
        aria-describedby={errorId}
      >
        <div className={COIN_MEDIA_GRID_CLASS}>
          {previews.map((preview) => (
            <GalleryPendingMediaCard
              key={preview.key}
              previewUrl={preview.url}
              alt={preview.file.name}
              title={t('form.galleryImageLabel')}
              meta={t('form.galleryImageNew')}
              disabled={disabled}
              onRemove={() => removeFile(preview.index)}
            />
          ))}
          <GalleryAddCropTile disabled={disabled} onAddFiles={handleAddFiles} />
        </div>
      </div>

      {error || validationError ? (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error ?? validationError}
        </p>
      ) : null}
    </div>
  )
}

