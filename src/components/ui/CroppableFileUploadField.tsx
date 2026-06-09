import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Crop } from 'lucide-react'
import { CoinImagePreviewSlot } from '../coin/CoinImagePreviewSlot'
import type { ImagePreviewSource } from '../../lib/imagePreview'
import { getImagePreviewLabel } from '../../lib/imagePreview'
import { ImageCropModal } from './ImageCropModal'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

type CroppableFileUploadFieldProps = {
  label: string
  hint?: string
  error?: string
  attention?: string
  fileName?: string | null
  previewUrl?: string | null
  previewSource?: ImagePreviewSource
  previewLabel?: string
  previewAlt?: string
  formOptionsLoading?: boolean
  isNewSelection?: boolean
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
  previewSource = 'none',
  previewLabel,
  previewAlt = 'Selected image preview',
  formOptionsLoading = false,
  isNewSelection = false,
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

  const displayName = previewLabel ?? getImagePreviewLabel(
    fileName ? 'selected' : previewSource,
    fileName,
  )

  return (
    <>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <label htmlFor={fieldId} className="text-sm font-medium text-navy">
            {label}
          </label>
          {previewSource === 'default' ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              Default
            </span>
          ) : null}
        </div>
        <div
          className={[
            'flex min-w-0 flex-col gap-3 rounded-xl border bg-muted/30 p-3 xl:gap-4 xl:p-5',
            error
              ? 'border-red-300'
              : attention
                ? 'border-amber-300/90 ring-1 ring-amber-200/70'
                : 'border-border',
          ].join(' ')}
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start xl:gap-4">
            <CoinImagePreviewSlot
              previewUrl={previewUrl}
              previewSource={previewSource}
              formOptionsLoading={formOptionsLoading}
              isNewSelection={isNewSelection}
              alt={previewAlt}
              size="field"
            />
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium text-navy"
                title={displayName}
              >
                {displayName}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-navy-muted xl:mt-1.5 xl:text-xs xl:leading-relaxed">
                {hint}
              </p>
            </div>
          </div>
          <label className="block w-full min-w-0">
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
                'flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors xl:min-h-11 xl:px-5 xl:py-3',
                disabled ? 'pointer-events-none opacity-50' : 'hover:bg-primary/10',
              ].join(' ')}
            >
              <Crop className="h-4 w-4 shrink-0" aria-hidden />
              {fileName ? 'Replace & crop' : 'Choose & crop'}
            </span>
          </label>
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
