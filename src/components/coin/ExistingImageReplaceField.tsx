import { CroppableFileUploadField } from '../ui/CroppableFileUploadField'

type ExistingImageReplaceFieldProps = {
  label: string
  replaceLabel: string
  currentUrl?: string | null
  previewUrl?: string | null
  previewAlt?: string
  fileName?: string | null
  isNewSelection?: boolean
  error?: string
  name?: string
  disabled?: boolean
  onFileChange: (file: File | null) => void
}

export function ExistingImageReplaceField({
  label,
  replaceLabel,
  currentUrl,
  previewUrl,
  previewAlt,
  fileName,
  isNewSelection = false,
  error,
  name,
  disabled,
  onFileChange,
}: ExistingImageReplaceFieldProps) {
  const thumbnailUrl = previewUrl ?? currentUrl ?? null

  return (
    <div className="flex flex-col gap-2">
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
        previewAlt={previewAlt ?? label}
        error={error}
        disabled={disabled}
        onFileChange={onFileChange}
      />
    </div>
  )
}
