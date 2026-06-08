import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Crop } from 'lucide-react'
import { ImageCropModal } from './ImageCropModal'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

type CroppableFileUploadFieldProps = {
  label: string
  hint?: string
  error?: string
  attention?: string
  fileName?: string | null
  previewUrl?: string | null
  previewAlt?: string
  name?: string
  id?: string
  disabled?: boolean
  cropTitle?: string
  onFileChange: (file: File | null) => void
}

export function CroppableFileUploadField({
  label,
  hint = 'JPG, PNG, WEBP up to 5MB — crop after selecting',
  error,
  attention,
  fileName,
  previewUrl,
  previewAlt = 'Selected image preview',
  id,
  disabled,
  cropTitle,
  onFileChange,
}: CroppableFileUploadFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined
  const attentionId = !error && attention ? `${fieldId}-attention` : undefined
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  function handleRawSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''

    if (!file) {
      return
    }

    setPendingFile(file)
    setCropOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-navy">
          {label}
        </label>
        <div
          className={[
            'rounded-xl border bg-muted/30 px-4 py-4',
            error
              ? 'border-red-300'
              : attention
                ? 'border-amber-300/90 ring-1 ring-amber-200/70'
                : 'border-border',
          ].join(' ')}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-white sm:h-20 sm:w-20">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={previewAlt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full bg-muted/40"
                    role="img"
                    aria-label="No image selected"
                  />
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="truncate text-sm text-navy">
                  {fileName ?? (previewUrl ? 'Current image' : 'No file selected')}
                </p>
                <p className="mt-1 text-xs text-navy-muted">{hint}</p>
              </div>
            </div>
            <label className="shrink-0">
              <input
                id={fieldId}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId ?? attentionId}
                onChange={handleRawSelect}
              />
              <span
                className={[
                  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition-colors',
                  disabled ? 'pointer-events-none opacity-50' : 'hover:bg-primary/10',
                ].join(' ')}
              >
                <Crop className="h-4 w-4" aria-hidden />
                {fileName ? 'Replace & crop' : 'Choose & crop'}
              </span>
            </label>
          </div>
        </div>
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
      </div>

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
        }}
      />
    </>
  )
}
