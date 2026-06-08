import { CroppableFileUploadField } from '../ui/CroppableFileUploadField'

type ExistingImageReplaceFieldProps = {
  label: string
  replaceLabel: string
  currentUrl?: string | null
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
  fileName,
  isNewSelection = false,
  error,
  name,
  disabled,
  onFileChange,
}: ExistingImageReplaceFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      {currentUrl ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
            {isNewSelection ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                New image selected
              </span>
            ) : null}
          </div>
          <img
            src={currentUrl}
            alt={label}
            className="mt-2 max-h-56 w-full rounded-lg object-contain sm:max-h-64"
          />
        </div>
      ) : null}
      <CroppableFileUploadField
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
