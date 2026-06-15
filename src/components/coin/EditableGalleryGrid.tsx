import { lazy, Suspense, useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Crop,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react'
import type { SubmissionImage } from '../../lib/api'
import type { ImageCardStatus } from '../../hooks/useSubmissionImageAutosave'
import { ConfirmDialog } from '../ui/ConfirmDialog'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

export const COIN_MEDIA_GRID_CLASS = 'coin-media-grid'

const ImageCropModal = lazy(() =>
  import('../ui/ImageCropModal').then((module) => ({ default: module.ImageCropModal })),
)

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
  externalPendingItems?: GalleryExternalPendingItem[]
  disabled?: boolean
  embedded?: boolean
  showAddTile?: boolean
  headerMode?: 'inline' | 'none'
  onToggleRemove: (id: number, remove: boolean) => void
  onRemovePendingFile?: (index: number) => void
  onRetryExternalPending?: (key: string) => void
  onDismissExternalPending?: (key: string) => void
  onAddFiles?: (files: File[]) => void
  replacementPreviews?: Record<number, string>
  onReplaceImage?: (imageId: number, file: File) => void
  onCancelReplace?: (imageId: number) => void
  replaceStatusById?: Record<number, ImageCardStatus>
  replaceErrorById?: Record<number, string>
  onRetryReplace?: (imageId: number) => void
  allowPermanentDelete?: boolean
  onPermanentDelete?: (imageId: number) => void
  confirmRemove?: boolean
  pendingGalleryUploading?: boolean
}

function GallerySectionStatus({
  isSaving,
  showSaved,
  hasError,
}: {
  isSaving: boolean
  showSaved: boolean
  hasError?: boolean
}) {
  const { t } = useTranslation()

  if (isSaving) {
    return (
      <span className="gallery-section-status gallery-section-status--saving" role="status" aria-live="polite">
        <span className="gallery-section-status__spinner" aria-hidden />
        {t('form.gallerySaving')}
      </span>
    )
  }

  if (hasError) {
    return (
      <span className="gallery-section-status gallery-section-status--error" role="status" aria-live="polite">
        {t('form.gallerySaveError')}
      </span>
    )
  }

  if (showSaved) {
    return (
      <span className="gallery-section-status gallery-section-status--saved" role="status" aria-live="polite">
        {t('form.galleryImagesSaved')}
      </span>
    )
  }

  return null
}

export type GalleryExternalPendingItem = {
  key: string
  previewUrl: string
  fileName: string
  status: 'uploading' | 'failed'
  error?: string
}

export function useGallerySavedFlash(
  isSaving: boolean,
  replaceStatusById: Record<number, ImageCardStatus> = {},
) {
  const [savedFlash, setSavedFlash] = useState(false)
  const wasSavingRef = useRef(false)

  useEffect(() => {
    if (wasSavingRef.current && !isSaving) {
      const statuses = Object.values(replaceStatusById)
      if (statuses.length === 0 || statuses.every((status) => status === 'saved' || status === 'idle')) {
        setSavedFlash(true)
        const timer = window.setTimeout(() => setSavedFlash(false), 2500)
        return () => window.clearTimeout(timer)
      }
    }
    wasSavingRef.current = isSaving
    return undefined
  }, [isSaving, replaceStatusById])

  return savedFlash
}

export function GallerySaveStatusPill({
  isSaving,
  showSaved,
  hasError,
}: {
  isSaving: boolean
  showSaved: boolean
  hasError?: boolean
}) {
  if (!isSaving && !showSaved && !hasError) {
    return null
  }

  return <GallerySectionStatus isSaving={isSaving} showSaved={showSaved} hasError={hasError} />
}

export function GalleryMediaInfoBar({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="coin-media-card__info">
      <span className="coin-media-card__info-title">{title}</span>
      {meta ? <span className="coin-media-card__info-meta">{meta}</span> : null}
    </div>
  )
}

export function GalleryUploadOverlay({ label }: { label: string }) {
  return (
    <div className="coin-media-upload-overlay" role="status" aria-live="polite">
      <span className="coin-media-upload-overlay__spinner" aria-hidden />
      <span className="coin-media-upload-overlay__label">{label}</span>
    </div>
  )
}

export function GalleryMediaIconButton({
  label,
  onClick,
  disabled,
  tone = 'neutral',
  variant = 'default',
  children,
  htmlFor,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  tone?: 'neutral' | 'danger' | 'primary'
  variant?: 'default' | 'overlay'
  children: ReactNode
  htmlFor?: string
}) {
  const className = [
    'coin-media-icon-btn',
    variant === 'overlay' ? 'coin-media-icon-btn--overlay' : '',
    tone === 'danger'
      ? 'coin-media-icon-btn--danger'
      : tone === 'primary'
        ? 'coin-media-icon-btn--primary'
        : '',
  ].join(' ')

  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        title={label}
        aria-label={label}
        className={[className, disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'].join(' ')}
      >
        {children}
      </label>
    )
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

function GalleryTileActionBar({
  ariaLabel,
  children,
}: {
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <div className="coin-media-card__actions">
      <div className="coin-media-card__actions-scrim" aria-hidden />
      <div className="coin-media-card__actions-group" role="group" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  )
}

export function GalleryAddCropTile({
  disabled,
  onAddFiles,
}: {
  disabled?: boolean
  onAddFiles: (files: File[]) => void
}) {
  const { t } = useTranslation()
  const inputId = useId()
  const [queue, setQueue] = useState<File[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cropOpen, setCropOpen] = useState(false)
  const [croppedBatch, setCroppedBatch] = useState<File[]>([])

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    setCroppedBatch([])
    setQueue(selected)
    setCurrentIndex(0)
    setCropOpen(true)
  }

  function handleCropSave(file: File) {
    const nextBatch = [...croppedBatch, file]
    const nextIndex = currentIndex + 1

    if (nextIndex < queue.length) {
      setCroppedBatch(nextBatch)
      setCurrentIndex(nextIndex)
      return
    }

    onAddFiles(nextBatch)
    setCropOpen(false)
    setQueue([])
    setCurrentIndex(0)
    setCroppedBatch([])
  }

  function handleClose() {
    setCropOpen(false)
    setQueue([])
    setCurrentIndex(0)
    setCroppedBatch([])
  }

  return (
    <>
      <label
        htmlFor={inputId}
        className={[
          'coin-media-upload-tile',
          disabled ? 'coin-media-upload-tile--disabled' : '',
        ].join(' ')}
      >
        <span className="coin-media-upload-tile__icon">
          <Plus className="h-5 w-5" aria-hidden />
        </span>
        <span className="coin-media-upload-tile__title">{t('widgets.addImages')}</span>
        <span className="coin-media-upload-tile__hint">{t('widgets.addImagesHelper')}</span>
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={handleSelect}
        />
      </label>

      {cropOpen ? (
        <Suspense fallback={null}>
          <ImageCropModal
            open={cropOpen}
            file={queue[currentIndex] ?? null}
            title={
              queue.length > 1
                ? t('widgets.cropGalleryImageProgress', {
                    current: currentIndex + 1,
                    total: queue.length,
                  })
                : t('widgets.cropGalleryImage')
            }
            onClose={handleClose}
            onSave={handleCropSave}
          />
        </Suspense>
      ) : null}
    </>
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
  onCancelReplace: _onCancelReplace,
  onRetryReplace,
  onPermanentDelete,
  onRequestRemove,
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
  onRequestRemove?: () => void
}) {
  const { t } = useTranslation()
  const replaceInputId = useId()
  const displayUrl = replacementPreviewUrl ?? image.url
  const hasReplacement = Boolean(replacementPreviewUrl)
  const isReplaceBusy = replaceStatus === 'uploading'
  const isReplaceFailed = replaceStatus === 'failed'
  const infoMeta =
    image.id > 0 ? t('form.imageAttachmentShort', { id: image.id }) : undefined

  return (
    <article
      className={[
        'coin-media-card group',
        isPendingRemoval
          ? 'border-red-200'
          : hasReplacement
            ? 'border-primary/35 ring-1 ring-primary/10'
            : '',
      ].join(' ')}
    >
      <div className="coin-media-card__frame">
        <img
          src={displayUrl}
          alt={t('detail.galleryAlt', { number: image.id })}
          className={[
            'coin-media-card__image',
            isPendingRemoval ? 'grayscale opacity-70' : isReplaceBusy ? 'coin-media-card__image--busy opacity-80' : '',
          ].join(' ')}
        />

        <div className="coin-media-card__shade" aria-hidden />

        {isReplaceBusy ? (
          <GalleryUploadOverlay label={t('form.galleryUploadingImage')} />
        ) : null}

        {isPendingRemoval ? (
          <div className="coin-media-upload-overlay" role="status">
            <p className="text-xs font-semibold uppercase tracking-wide">
              {t('form.imageRemoveOnSave')}
            </p>
            <GalleryMediaIconButton
              label={t('form.imageRemoveUndo')}
              tone="primary"
              variant="overlay"
              disabled={disabled}
              onClick={() => onToggleRemove(false)}
            >
              <Undo2 className="h-4 w-4" aria-hidden />
            </GalleryMediaIconButton>
          </div>
        ) : (
          <>
            {!isPendingRemoval && !isReplaceBusy ? (
              <GalleryTileActionBar ariaLabel={t('form.galleryImageActions')}>
                {!hasReplacement && onReplaceImage ? (
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
                    <GalleryMediaIconButton
                      label={t('form.galleryReplaceImage')}
                      htmlFor={replaceInputId}
                      tone="primary"
                      variant="overlay"
                      disabled={disabled || isReplaceBusy}
                    >
                      <Crop className="h-5 w-5" aria-hidden />
                    </GalleryMediaIconButton>
                  </>
                ) : null}

                {isReplaceFailed && onRetryReplace ? (
                  <GalleryMediaIconButton
                    label={t('detail.retry')}
                    tone="primary"
                    variant="overlay"
                    disabled={disabled}
                    onClick={onRetryReplace}
                  >
                    <RotateCcw className="h-5 w-5" aria-hidden />
                  </GalleryMediaIconButton>
                ) : null}

                {allowPermanentDelete && onPermanentDelete ? (
                  <GalleryMediaIconButton
                    label={t('detail.delete')}
                    tone="danger"
                    variant="overlay"
                    disabled={disabled || isReplaceBusy}
                    onClick={onPermanentDelete}
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </GalleryMediaIconButton>
                ) : (
                  <GalleryMediaIconButton
                    label={t('form.galleryRemoveImage')}
                    tone="danger"
                    variant="overlay"
                    disabled={disabled || isReplaceBusy}
                    onClick={() => (onRequestRemove ? onRequestRemove() : onToggleRemove(true))}
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </GalleryMediaIconButton>
                )}
              </GalleryTileActionBar>
            ) : null}

            {!isReplaceBusy ? (
              <GalleryMediaInfoBar title={t('form.galleryImageLabel')} meta={infoMeta} />
            ) : null}
          </>
        )}
      </div>

      {isReplaceFailed && replaceError ? (
        <p role="alert" className="sr-only">
          {replaceError}
        </p>
      ) : null}
    </article>
  )
}

export function GalleryPendingMediaCard({
  previewUrl,
  alt,
  title,
  meta,
  disabled,
  onRemove,
}: {
  previewUrl: string
  alt: string
  title: string
  meta?: string
  disabled?: boolean
  onRemove?: () => void
}) {
  const { t } = useTranslation()

  return (
    <article className="coin-media-card group border-primary/35 ring-1 ring-primary/10">
      <div className="coin-media-card__frame">
        <img src={previewUrl} alt={alt} className="coin-media-card__image" />
        <div className="coin-media-card__shade" aria-hidden />
        {onRemove ? (
          <GalleryTileActionBar ariaLabel={t('form.galleryImageActions')}>
            <GalleryMediaIconButton
              label={t('form.galleryRemoveImage')}
              tone="danger"
              variant="overlay"
              disabled={disabled}
              onClick={onRemove}
            >
              <Trash2 className="h-5 w-5" aria-hidden />
            </GalleryMediaIconButton>
          </GalleryTileActionBar>
        ) : null}
        <GalleryMediaInfoBar title={title} meta={meta} />
      </div>
    </article>
  )
}

function ExternalPendingGalleryCard({
  item,
  disabled,
  onRetry,
  onRemove,
}: {
  item: GalleryExternalPendingItem
  disabled?: boolean
  onRetry?: () => void
  onRemove?: () => void
}) {
  const { t } = useTranslation()
  const isUploading = item.status === 'uploading'
  const isFailed = item.status === 'failed'

  return (
    <article
      className={[
        'coin-media-card group',
        isFailed ? 'border-red-300' : 'border-primary/35 ring-1 ring-primary/10',
      ].join(' ')}
    >
      <div className="coin-media-card__frame">
        <img
          src={item.previewUrl}
          alt={item.fileName}
          className={['coin-media-card__image', isUploading ? 'coin-media-card__image--busy' : ''].join(' ')}
        />
        <div className="coin-media-card__shade" aria-hidden />

        {isUploading ? <GalleryUploadOverlay label={t('form.galleryUploading')} /> : null}

        {!isUploading ? (
          <GalleryTileActionBar ariaLabel={t('form.galleryImageActions')}>
            {isFailed && onRetry ? (
              <GalleryMediaIconButton
                label={t('detail.retry')}
                tone="primary"
                variant="overlay"
                disabled={disabled}
                onClick={onRetry}
              >
                <RotateCcw className="h-5 w-5" aria-hidden />
              </GalleryMediaIconButton>
            ) : null}
            {onRemove ? (
              <GalleryMediaIconButton
                label={t('form.galleryRemoveImage')}
                tone="danger"
                variant="overlay"
                disabled={disabled}
                onClick={onRemove}
              >
                <Trash2 className="h-5 w-5" aria-hidden />
              </GalleryMediaIconButton>
            ) : null}
          </GalleryTileActionBar>
        ) : null}

        {!isUploading ? (
          <GalleryMediaInfoBar
            title={t('form.galleryImageLabel')}
            meta={isFailed ? t('detail.failed') : t('form.galleryImageNew')}
          />
        ) : null}
      </div>

      {isFailed && item.error ? (
        <p role="alert" className="sr-only">
          {item.error}
        </p>
      ) : null}
    </article>
  )
}

function PendingGalleryCard({
  item,
  disabled,
  onRemove,
}: {
  item: PendingPreview
  disabled?: boolean
  onRemove?: () => void
}) {
  const { t } = useTranslation()

  return (
    <GalleryPendingMediaCard
      previewUrl={item.url}
      alt={item.file.name}
      title={t('form.galleryImageLabel')}
      meta={t('form.galleryImageNew')}
      disabled={disabled}
      onRemove={onRemove}
    />
  )
}

export function EditableGalleryGrid({
  images,
  removedIds,
  pendingFiles = [],
  externalPendingItems = [],
  disabled = false,
  embedded = false,
  showAddTile = false,
  headerMode,
  onToggleRemove,
  onRemovePendingFile,
  onRetryExternalPending,
  onDismissExternalPending,
  onAddFiles,
  replacementPreviews = {},
  onReplaceImage,
  onCancelReplace,
  replaceStatusById = {},
  replaceErrorById = {},
  onRetryReplace,
  allowPermanentDelete = false,
  onPermanentDelete,
  confirmRemove = true,
  pendingGalleryUploading = false,
}: EditableGalleryGridProps) {
  const { t } = useTranslation()
  const pendingPreviews = usePendingGalleryPreviews(pendingFiles)
  const [cropReplace, setCropReplace] = useState<{ imageId: number; file: File } | null>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null)

  const isReplaceUploading = Object.values(replaceStatusById).some((status) => status === 'uploading')
  const isExternalUploading = externalPendingItems.some((item) => item.status === 'uploading')
  const hasExternalFailed = externalPendingItems.some((item) => item.status === 'failed')
  const hasReplaceFailed = Object.values(replaceStatusById).some((status) => status === 'failed')
  const isGallerySaving = isReplaceUploading || pendingGalleryUploading || isExternalUploading
  const hasGalleryError = hasReplaceFailed || hasExternalFailed
  const isGalleryBusy = disabled || isGallerySaving
  const savedFlash = useGallerySavedFlash(isGallerySaving, replaceStatusById)
  const resolvedHeaderMode = headerMode ?? (embedded ? 'none' : 'inline')

  const headerStatus = (
    <GallerySectionStatus
      isSaving={isGallerySaving}
      showSaved={savedFlash && !isGallerySaving}
      hasError={hasGalleryError && !isGallerySaving}
    />
  )
  const hasContent =
    images.length > 0 ||
    pendingPreviews.length > 0 ||
    externalPendingItems.length > 0 ||
    (showAddTile && onAddFiles)

  if (!hasContent) {
    return null
  }

  const grid = (
    <div className={COIN_MEDIA_GRID_CLASS}>
      {images.map((image) => {
        const isPendingRemoval = removedIds.includes(image.id)
        const replacementPreviewUrl = replacementPreviews[image.id]

        return (
          <ExistingGalleryCard
            key={image.id}
            image={image}
            isPendingRemoval={isPendingRemoval}
            disabled={isGalleryBusy}
            replacementPreviewUrl={replacementPreviewUrl}
            replaceStatus={replaceStatusById[image.id]}
            replaceError={replaceErrorById[image.id]}
            allowPermanentDelete={allowPermanentDelete}
            onToggleRemove={(remove) => onToggleRemove(image.id, remove)}
            onRequestRemove={
              confirmRemove
                ? () => setPendingRemoveId(image.id)
                : undefined
            }
            onReplaceImage={
              onReplaceImage ? (file) => setCropReplace({ imageId: image.id, file }) : undefined
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

      {externalPendingItems.map((item) => (
        <ExternalPendingGalleryCard
          key={item.key}
          item={item}
          disabled={isGalleryBusy}
          onRetry={onRetryExternalPending ? () => onRetryExternalPending(item.key) : undefined}
          onRemove={onDismissExternalPending ? () => onDismissExternalPending(item.key) : undefined}
        />
      ))}

      {pendingPreviews.map((item) => (
        <PendingGalleryCard
          key={item.key}
          item={item}
          disabled={isGalleryBusy}
          onRemove={() => onRemovePendingFile?.(item.index)}
        />
      ))}

      {showAddTile && onAddFiles ? (
        <GalleryAddCropTile disabled={isGalleryBusy} onAddFiles={onAddFiles} />
      ) : null}
    </div>
  )

  const cropModal = cropReplace ? (
    <Suspense fallback={null}>
      <ImageCropModal
        open={Boolean(cropReplace)}
        file={cropReplace.file}
        title={t('widgets.cropGalleryReplacement')}
        onClose={() => setCropReplace(null)}
        onSave={(file) => {
          if (onReplaceImage) {
            onReplaceImage(cropReplace.imageId, file)
          }
          setCropReplace(null)
        }}
      />
    </Suspense>
  ) : null

  const removeDialog = (
    <ConfirmDialog
      open={pendingRemoveId !== null}
      title={t('form.galleryRemoveConfirmTitle')}
      description={t('form.imageRemoveConfirmBody')}
      confirmLabel={t('form.imageRemoveConfirmAction')}
      cancelLabel={t('common.cancel')}
      onCancel={() => setPendingRemoveId(null)}
      onConfirm={() => {
        if (pendingRemoveId !== null) {
          onToggleRemove(pendingRemoveId, true)
        }
        setPendingRemoveId(null)
      }}
    />
  )

  if (embedded || resolvedHeaderMode === 'none') {
    return (
      <>
        {grid}
        {cropModal}
        {removeDialog}
      </>
    )
  }

  return (
    <>
      <div className="gallery-section">
        <div className="gallery-section-head">
          <p className="gallery-section-head__title">{t('form.galleryImages')}</p>
          {headerStatus}
        </div>
        {grid}
      </div>
      {cropModal}
      {removeDialog}
    </>
  )
}
