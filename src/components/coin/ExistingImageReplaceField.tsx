import { FileUploadField } from '../ui/FileUploadField'

type ExistingImageReplaceFieldProps = {
  label: string
  replaceLabel: string
  currentUrl?: string | null
  fileName?: string | null
  error?: string
  name?: string
  disabled?: boolean
  onFileChange: (file: File | null) => void
}

export function ExistingImageReplaceField({
  label,
  replaceLabel,
  currentUrl,
  fileName,
  error,
  name,
  disabled,
  onFileChange,
}: ExistingImageReplaceFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      {currentUrl ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
          <img
            src={currentUrl}
            alt={label}
            className="mt-2 max-h-48 w-full rounded-lg object-contain"
          />
        </div>
      ) : null}
      <FileUploadField
        label={replaceLabel}
        name={name}
        fileName={fileName ?? null}
        error={error}
        disabled={disabled}
        onFileChange={onFileChange}
      />
    </div>
  )
}
