import { useEffect, useId, useState } from 'react'
import type { SubmissionImage } from '../../lib/api'
import type { ImageCardStatus } from '../../hooks/useSubmissionImageAutosave'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

type PendingPreview = {
  key: string
  file: File
  url: string
  index: number
}

function usePendingGalleryPreviews(files: File[]): PendingPreview[] {
  const [previews, setPreviews] = useState<PendingPreview[]>([])

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

type EditableGalleryGridProps = {
  images: SubmissionImage[]
  removedIds: number[]
  pendingFiles?: File[]
  disabled?: boolean
  embedded?: boolean
  onToggleRemove: (id: number, remove: boolean) => void
  onRemovePendingFile?: (index: number) => void
  replacementPreviews?: Record<number, string>
  onReplaceImage?: (imageId: number, file: File) => void
  onCancelReplace?: (imageId: number) => void
  replaceStatusById?: Record<number, ImageCardStatus>
  replaceErrorById?: Record<number, string>
  onRetryReplace?: (imageId: number) => void
  allowPermanentDelete?: boolean
  onPermanentDelete?: (imageId: number) => void
}

function ReplaceStatusBadge({ status }: { status: ImageCardStatus }) {
  if (status === 'idle') {
    return (
      <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary shadow-sm ring-1 ring-black/5">
        New image
      </span>
    )
  }

  const label =
    status === 'uploading' ? 'Uploading' : status === 'saved' ? 'Saved' : 'Failed'

  return (
    <span
      className={[
        'absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] shadow-sm ring-1',
        status === 'uploading'
          ? 'bg-white/95 text-navy ring-black/5'
          : status === 'saved'
            ? 'bg-primary/10 text-primary ring-primary/20'
            : 'bg-red-50 text-red-700 ring-red-200',
      ].join(' ')}
    >
      {status === 'uploading' ? (
        <span className="mr-1 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary align-[-2px]" />
      ) : null}
      {label}
    </span>
  )
}

function ExistingGalleryCard({
  image,
  isPendingRemoval,
  disabled,
  replacementPreviewUrl,
  replaceStatus,
  replaceError,
  allowPermanentDelete,
  onToggleRemove,
  onReplaceImage,
  onCancelReplace,
  onRetryReplace,
  onPermanentDelete,
}: {
  image: SubmissionImage
  isPendingRemoval: boolean
  disabled: boolean
  replacementPreviewUrl?: string
  replaceStatus?: ImageCardStatus
  replaceError?: string
  allowPermanentDelete: boolean
  onToggleRemove: (remove: boolean) => void
  onReplaceImage?: (file: File) => void
  onCancelReplace?: () => void
  onRetryReplace?: () => void
  onPermanentDelete?: () => void
}) {
  const replaceInputId = useId()
  const displayUrl = replacementPreviewUrl ?? image.url
  const hasReplacement = Boolean(replacementPreviewUrl)
  const isReplaceBusy = replaceStatus === 'uploading'
  const isReplaceFailed = replaceStatus === 'failed'

  return (
    <div
      className={[
        'flex h-full flex-col overflow-hidden rounded-lg border bg-white',
        isPendingRemoval
          ? 'border-red-300 opacity-60'
          : hasReplacement
            ? 'border-primary/35 ring-1 ring-primary/10'
            : 'border-border/60',
      ].join(' ')}
    >
      <div className="relative aspect-square w-full shrink-0">
        <img
          src={displayUrl}
          alt="Gallery image"
          className={[
            'h-full w-full object-cover',
            isPendingRemoval ? 'grayscale' : isReplaceBusy ? 'opacity-85' : '',
          ].join(' ')}
        />
        {hasReplacement ? (
          <ReplaceStatusBadge status={replaceStatus ?? 'idle'} />
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 border-t border-border/60 bg-[#faf8f5] p-2.5">
        {isPendingRemoval ? (
          <p className="text-xs font-medium text-red-600">Pending removal</p>
        ) : null}

        {isReplaceFailed && replaceError ? (
          <p role="alert" className="text-xs text-red-600">
            {replaceError}
          </p>
        ) : null}

        {!isPendingRemoval && onReplaceImage && !hasReplacement ? (
          <>
            <input
              id={replaceInputId}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              disabled={disabled || isReplaceBusy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) {
                  onReplaceImage(file)
                }
              }}
            />
            <label
              htmlFor={replaceInputId}
              className={[
                'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-border/70 bg-white px-3 text-sm font-semibold text-navy transition-colors',
                disabled || isReplaceBusy
                  ? 'pointer-events-none opacity-50'
                  : 'hover:border-primary/30 hover:bg-white',
              ].join(' ')}
            >
              Replace image
            </label>
          </>
        ) : null}

        {hasReplacement && onCancelReplace && replaceStatus !== 'uploading' ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onCancelReplace}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border/70 bg-white px-3 text-sm font-semibold text-navy-muted transition-colors hover:border-primary/30 hover:text-navy disabled:opacity-50"
          >
            Cancel replace
          </button>
        ) : null}

        {isReplaceFailed && onRetryReplace ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onRetryReplace}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Retry replace
          </button>
        ) : null}

        <button
          type="button"
          disabled={disabled || isReplaceBusy}
          onClick={() => onToggleRemove(!isPendingRemoval)}
          className={[
            'inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-50',
            isPendingRemoval
              ? 'bg-primary/10 text-primary hover:bg-primary/15'
              : 'border border-border/70 bg-white text-navy hover:border-red-200 hover:bg-red-50/80 hover:text-red-600',
          ].join(' ')}
        >
          {isPendingRemoval ? 'Undo remove' : 'Remove from gallery'}
        </button>

        {allowPermanentDelete && onPermanentDelete && !isPendingRemoval ? (
          <button
            type="button"
            disabled={disabled || isReplaceBusy}
            onClick={onPermanentDelete}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-50 px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            Delete from media library
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function EditableGalleryGrid({
  images,
  removedIds,
  pendingFiles = [],
  disabled = false,
  embedded = false,
  onToggleRemove,
  onRemovePendingFile,
  replacementPreviews = {},
  onReplaceImage,
  onCancelReplace,
  replaceStatusById = {},
  replaceErrorById = {},
  onRetryReplace,
  allowPermanentDelete = false,
  onPermanentDelete,
}: EditableGalleryGridProps) {
  const pendingPreviews = usePendingGalleryPreviews(pendingFiles)
  const hasContent = images.length > 0 || pendingPreviews.length > 0

  if (!hasContent) {
    return null
  }

  const grid = (
    <div
      className={
        embedded
          ? 'contents'
          : 'mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'
      }
    >
      {images.map((image) => {
        const isPendingRemoval = removedIds.includes(image.id)
        const replacementPreviewUrl = replacementPreviews[image.id]

        return (
          <ExistingGalleryCard
            key={image.id}
            image={image}
            isPendingRemoval={isPendingRemoval}
            disabled={disabled}
            replacementPreviewUrl={replacementPreviewUrl}
            replaceStatus={replaceStatusById[image.id]}
            replaceError={replaceErrorById[image.id]}
            allowPermanentDelete={allowPermanentDelete}
            onToggleRemove={(remove) => onToggleRemove(image.id, remove)}
            onReplaceImage={
              onReplaceImage ? (file) => onReplaceImage(image.id, file) : undefined
            }
            onCancelReplace={
              onCancelReplace && replacementPreviewUrl
                ? () => onCancelReplace(image.id)
                : undefined
            }
            onRetryReplace={
              onRetryReplace && replaceStatusById[image.id] === 'failed'
                ? () => onRetryReplace(image.id)
                : undefined
            }
            onPermanentDelete={
              onPermanentDelete
                ? () => {
                    if (
                      window.confirm(
                        'Permanently delete this image from the media library? This cannot be undone.',
                      )
                    ) {
                      onPermanentDelete(image.id)
                    }
                  }
                : undefined
            }
          />
        )
      })}

      {pendingPreviews.map((item) => (
        <div
          key={item.key}
          className="flex h-full flex-col overflow-hidden rounded-lg border border-primary/35 bg-white ring-1 ring-primary/10"
        >
          <div className="relative aspect-square w-full shrink-0">
            <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 via-black/20 to-transparent"
              aria-hidden
            />
            <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary shadow-sm ring-1 ring-black/5">
              New image
            </span>
          </div>
          <div className="flex flex-1 flex-col bg-[#faf8f5]">
            <div className="border-t border-border/50 px-2.5 py-2">
              <p
                className="truncate text-[11px] font-medium leading-snug text-[#1c1c1e]"
                title={item.file.name}
              >
                {item.file.name}
              </p>
            </div>
            <div className="mt-auto border-t border-border/50 p-2.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemovePendingFile?.(item.index)}
                className="inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-border/70 bg-white text-xs font-semibold text-navy-muted transition-colors hover:border-red-200 hover:bg-red-50/80 hover:text-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (embedded) {
    return grid
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">Gallery</p>
      {grid}
    </div>
  )
}
