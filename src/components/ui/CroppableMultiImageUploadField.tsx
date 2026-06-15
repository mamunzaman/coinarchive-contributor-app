import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  COIN_MEDIA_GRID_CLASS,
  GalleryAddCropTile,
  GalleryPendingMediaCard,
} from '../coin/EditableGalleryGrid'
import { validateGalleryFiles } from './MultiImageUploadField'

const ImageCropModal = lazy(() =>
  import('./ImageCropModal').then((module) => ({ default: module.ImageCropModal })),
)

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

type FilePreview = {
  key: string
  file: File
  url: string
  index: number
}

function useFilePreviews(files: File[]): FilePreview[] {
  const [previews, setPreviews] = useState<FilePreview[]>([])

  useEffect(() => {
    const next = files.map((file, index) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      file,
      url: URL.createObjectURL(file),
      index,
    }))
    setPreviews(next)

    return () => {
      for (const item of next) {
        URL.revokeObjectURL(item.url)
      }
    }
  }, [files])

  return previews
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
  const previews = useFilePreviews(files)
  const validationError = validateGalleryFiles(files)

  function handleAddFiles(newFiles: File[]) {
    onFilesChange([...files, ...newFiles])
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

export function useGalleryCropReplace() {
  const { t } = useTranslation()
  const [pendingReplace, setPendingReplace] = useState<{
    file: File
    onComplete: (file: File) => void
  } | null>(null)

  function requestCropReplace(file: File, onComplete: (file: File) => void) {
    setPendingReplace({ file, onComplete })
  }

  function closeCropReplace() {
    setPendingReplace(null)
  }

  const cropModal = pendingReplace ? (
    <Suspense fallback={null}>
      <ImageCropModal
        open={Boolean(pendingReplace)}
        file={pendingReplace.file}
        title={t('widgets.cropGalleryImage')}
        onClose={closeCropReplace}
        onSave={(file) => {
          pendingReplace.onComplete(file)
          closeCropReplace()
        }}
      />
    </Suspense>
  ) : null

  return { pendingReplace, requestCropReplace, closeCropReplace, cropModal }
}
