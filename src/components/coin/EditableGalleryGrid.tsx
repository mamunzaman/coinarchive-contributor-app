import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Crop,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react'
import { normalizeGalleryImageId, type SubmissionImage } from '../../lib/api'
import type { ImageCardStatus } from '../../hooks/useSubmissionImageAutosave'
import { useGallerySavedFlash } from '../../hooks/useGallerySavedFlash'
import { COIN_MEDIA_GRID_CLASS } from '../../lib/coinMediaGrid'
import type { GalleryExternalPendingItem } from '../../lib/galleryGridTypes'
import { runAfterCommit } from '../../lib/runAfterCommit'
import { validateImageFile } from '../../lib/validation'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  isGalleryOperationBusy,
  isGalleryOperationBusyInput,
  resolveGalleryOperationState,
  type GalleryOperationState,
} from './galleryOperationState'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

const EMPTY_PENDING_FILES: File[] = []

function galleryRemovingIdSet(removingIds: number[]): Set<number> {
  const ids = new Set<number>()

  for (const id of removingIds) {
    const normalized = normalizeGalleryImageId(id)
    if (normalized > 0) {
      ids.add(normalized)
    }
  }

  return ids
}

const ImageCropModal = lazy(() =>
  import('../ui/ImageCropModal').then((module) => ({ default: module.ImageCropModal })),
)

type PendingPreview = {
  key: string
  file: File
  url: string
  index: number
}

function pendingFilesSignature(files: File[]): string {
  if (files.length === 0) {
    return ''
  }

  return files
    .map((file, index) => `${file.name}-${file.size}-${file.lastModified}-${index}`)
    .join('|')
}

function pendingPreviewsEqual(current: PendingPreview[], next: PendingPreview[]): boolean {
  if (current.length !== next.length) {
    return false
  }

  return current.every((item, index) => item.key === next[index]?.key)
}

function usePendingGalleryPreviews(files: File[]): PendingPreview[] {
  const [previews, setPreviews] = useState<PendingPreview[]>([])
  const filesSignature = pendingFilesSignature(files)

  useEffect(() => {
    if (files.length === 0) {
      runAfterCommit(() => {
        setPreviews((current) => (current.length === 0 ? current : []))
      })
      return undefined
    }

    const next = files.map((file, index) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      file,
      url: URL.createObjectURL(file),
      index,
    }))

    runAfterCommit(() => {
      setPreviews((current) => (pendingPreviewsEqual(current, next) ? current : next))
    })

    return () => {
      for (const item of next) {
        URL.revokeObjectURL(item.url)
      }
    }
  }, [filesSignature, files.length])

  return previews
}

type EditableGalleryGridProps = {
  images: SubmissionImage[]
  removedIds: number[]
  removingIds?: number[]
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

function dedupeGalleryFiles(files: File[]): File[] {
  const seen = new Set<string>()
  const unique: File[] = []

  for (const file of files) {
    const key = `${file.name}-${file.size}-${file.lastModified}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    unique.push(file)
  }

  return unique
}

function filterValidGalleryFiles(files: File[]): File[] {
  return files.filter((file) => !validateImageFile(file))
}

function GallerySectionStatus({
  operationState,
  uploadCount = 0,
  removingCount = 0,
}: {
  operationState: GalleryOperationState
  uploadCount?: number
  removingCount?: number
}) {
  const { t } = useTranslation()

  if (operationState === 'error') {
    return (
      <span className="gallery-section-status gallery-section-status--error" role="alert" aria-live="polite">
        {t('form.galleryUpdateFailed')}
      </span>
    )
  }

  if (operationState === 'success') {
    return (
      <span className="gallery-section-status gallery-section-status--saved" role="status" aria-live="polite">
        {t('form.galleryImagesSaved')}
      </span>
    )
  }

  if (operationState === 'idle') {
    return null
  }

  const label =
    operationState === 'uploading'
      ? uploadCount > 1
        ? t('form.galleryUploadingImages')
        : t('form.galleryUploadingImage')
      : operationState === 'removing'
        ? removingCount > 1
          ? t('form.galleryRemovingImage')
          : t('form.galleryTileRemovingImage')
        : t('form.gallerySaving')

  return (
    <span className="gallery-section-status gallery-section-status--saving" role="status" aria-live="polite">
      <span className="gallery-section-status__spinner" aria-hidden />
      {label}
    </span>
  )
}

export function GallerySaveStatusPill({
  operationState,
  uploadCount,
  removingCount,
}: {
  operationState: GalleryOperationState
  uploadCount?: number
  removingCount?: number
}) {
  if (operationState === 'idle') {
    return null
  }

  return (
    <GallerySectionStatus
      operationState={operationState}
      uploadCount={uploadCount}
      removingCount={removingCount}
    />
  )
}

export function GalleryMediaInfoBar({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="coin-media-card__info">
      <span className="coin-media-card__info-title">{title}</span>
      {meta ? <span className="coin-media-card__info-meta">{meta}</span> : null}
    </div>
  )
}

export function GalleryErrorOverlay({ label }: { label: string }) {
  return (
    <div className="coin-media-upload-overlay coin-media-upload-overlay--error" role="alert" aria-live="polite">
      <span className="coin-media-upload-overlay__label">{label}</span>
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

export { GalleryTileActionBar }

export function CoinFaceEditHint() {
  const { t } = useTranslation()

  return (
    <span className="coin-face-edit-hint" aria-hidden="true">
      <span className="coin-face-edit-hint__desktop">{t('form.hoverToEdit')}</span>
      <span className="coin-face-edit-hint__touch">{t('form.tapToEdit')}</span>
    </span>
  )
}

type GalleryCropQueueItem = {
  id: string
  file: File
}

function createGalleryCropQueueItem(file: File, index: number): GalleryCropQueueItem {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
  }
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
  const [queue, setQueue] = useState<GalleryCropQueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cropOpen, setCropOpen] = useState(false)
  const [croppedBatch, setCroppedBatch] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null)
  const isSelectingRef = useRef(false)
  const tileDisabled = disabled || cropOpen || isProcessing

  const currentItem = queue[currentIndex] ?? null
  const currentFile = currentItem?.file ?? null

  function resetCropSession() {
    setCropOpen(false)
    setQueue([])
    setCurrentIndex(0)
    setCroppedBatch([])
    setIsProcessing(false)
    isSelectingRef.current = false
  }

  function handleCancelCropBatch() {
    resetCropSession()
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    if (disabled || cropOpen || isSelectingRef.current) {
      event.target.value = ''
      return
    }

    const selected = dedupeGalleryFiles(Array.from(event.target.files ?? []))
    event.target.value = ''

    if (selected.length === 0) {
      return
    }

    const validFiles = filterValidGalleryFiles(selected)
    if (validFiles.length === 0) {
      setSelectionNotice(t('form.galleryInvalidFilesSkipped'))
      return
    }

    if (validFiles.length < selected.length) {
      setSelectionNotice(t('form.gallerySomeFilesSkipped'))
    } else {
      setSelectionNotice(null)
    }

    isSelectingRef.current = true
    setIsProcessing(true)
    setCroppedBatch([])
    setQueue(validFiles.map((file, index) => createGalleryCropQueueItem(file, index)))
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

    if (import.meta.env.DEV) {
      console.debug('[GalleryBatchUpload]', nextBatch.length, nextBatch.map((item) => item.name))
    }

    onAddFiles(nextBatch)
    resetCropSession()
  }

  return (
    <>
      <label
        htmlFor={inputId}
        className={[
          'coin-media-upload-tile',
          tileDisabled ? 'coin-media-upload-tile--disabled' : '',
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
          disabled={tileDisabled}
          onChange={handleSelect}
        />
      </label>

      {selectionNotice ? (
        <p className="coin-gallery-crop-notice text-xs text-navy-muted" role="status">
          {selectionNotice}
        </p>
      ) : null}

      {cropOpen && currentFile ? (
        <Suspense fallback={null}>
          <ImageCropModal
            key={currentItem?.id}
            open={cropOpen}
            file={currentFile}
            title={t('widgets.cropGalleryImage')}
            stepProgress={
              queue.length > 1
                ? { current: currentIndex + 1, total: queue.length }
                : undefined
            }
            closeOnSave={false}
            onClose={handleCancelCropBatch}
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
  isRemoving,
  disabled,
  replacementPreviewUrl,
  replaceStatus,
  replaceError,
  allowPermanentDelete,
  onToggleRemove,
  onReplaceImage,
  onRetryReplace,
  onPermanentDelete,
  onRequestRemove,
}: {
  image: SubmissionImage
  isPendingRemoval: boolean
  isRemoving?: boolean
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
  const showRemovingOverlay = isRemoving
  const showUploadingOverlay = !showRemovingOverlay && isReplaceBusy
  const showFailedOverlay = !showRemovingOverlay && !showUploadingOverlay && isReplaceFailed
  const isInteractionLocked = showRemovingOverlay || showUploadingOverlay
  const isTileBusy = isInteractionLocked
  const infoMeta =
    image.id > 0 ? t('form.imageAttachmentShort', { id: image.id }) : undefined

  return (
    <article
      className={[
        'coin-media-card group',
        showRemovingOverlay ? 'coin-media-card--removing' : '',
        showUploadingOverlay ? 'coin-media-card--uploading' : '',
        showFailedOverlay ? 'coin-media-card--failed' : '',
        isPendingRemoval && !isTileBusy ? 'border-red-200' : '',
        hasReplacement && !isTileBusy ? 'border-primary/35 ring-1 ring-primary/10' : '',
      ].join(' ')}
      aria-busy={isTileBusy}
    >
      <div
        className={[
          'coin-media-card__frame',
          isTileBusy ? 'coin-media-card__frame--locked' : '',
        ].join(' ')}
      >
        <img
          src={displayUrl}
          alt={t('detail.galleryAlt', { number: image.id })}
          className={[
            'coin-media-card__image',
            isTileBusy || isPendingRemoval ? 'coin-media-card__image--busy opacity-80' : '',
          ].join(' ')}
        />

        <div className="coin-media-card__shade" aria-hidden />

        {showRemovingOverlay ? (
          <GalleryUploadOverlay label={t('form.galleryTileRemovingImage')} />
        ) : showUploadingOverlay ? (
          <GalleryUploadOverlay label={t('form.galleryUploadingImage')} />
        ) : showFailedOverlay ? (
          <GalleryErrorOverlay label={replaceError ?? t('form.galleryUpdateFailed')} />
        ) : null}

        {!isTileBusy && isPendingRemoval ? (
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
        ) : !isInteractionLocked && !isPendingRemoval ? (
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

        {!isTileBusy && !isPendingRemoval ? (
          <GalleryMediaInfoBar title={t('form.galleryImageLabel')} meta={infoMeta} />
        ) : null}
      </div>

      {isReplaceFailed && replaceError ? (
        <p role="alert" className="coin-media-card__error">
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
        isUploading ? 'coin-media-card--uploading' : '',
        isFailed ? 'coin-media-card--failed border-red-300' : 'border-primary/35 ring-1 ring-primary/10',
      ].join(' ')}
      aria-busy={isUploading}
    >
      <div
        className={[
          'coin-media-card__frame',
          isUploading ? 'coin-media-card__frame--locked' : '',
        ].join(' ')}
      >
        <img
          src={item.previewUrl}
          alt={item.fileName}
          className={[
            'coin-media-card__image',
            isUploading || isFailed ? 'coin-media-card__image--busy opacity-80' : '',
          ].join(' ')}
        />
        <div className="coin-media-card__shade" aria-hidden />

        {isUploading ? <GalleryUploadOverlay label={t('form.galleryUploadingImage')} /> : null}

        {isFailed ? (
          <GalleryErrorOverlay label={item.error ?? t('form.galleryUpdateFailed')} />
        ) : null}

        {isFailed ? (
          <GalleryTileActionBar ariaLabel={t('form.galleryImageActions')}>
            {onRetry ? (
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

        {!isUploading && !isFailed ? (
          <GalleryMediaInfoBar
            title={t('form.galleryImageLabel')}
            meta={t('form.galleryImageNew')}
          />
        ) : null}
      </div>

      {isFailed && item.error ? (
        <p role="alert" className="coin-media-card__error">
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
  removingIds = [],
  pendingFiles = EMPTY_PENDING_FILES,
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
  const [pendingPermanentDeleteId, setPendingPermanentDeleteId] = useState<number | null>(null)

  const isReplaceUploading = Object.values(replaceStatusById).some((status) => status === 'uploading')
  const isExternalUploading =
    externalPendingItems.some((item) => item.status === 'uploading') || pendingGalleryUploading
  const hasExternalFailed = externalPendingItems.some((item) => item.status === 'failed')
  const hasReplaceFailed = Object.values(replaceStatusById).some((status) => status === 'failed')
  const removingIdSet = useMemo(() => galleryRemovingIdSet(removingIds), [removingIds])
  const hasGalleryError = hasReplaceFailed || hasExternalFailed
  const galleryUploadCount = externalPendingItems.filter((item) => item.status === 'uploading').length

  const galleryBusyInput = useMemo(
    () => ({
      removingCount: removingIds.length,
      hasPendingUploading: isExternalUploading,
      hasReplaceUploading: isReplaceUploading,
      activeSaveCount: disabled ? 1 : 0,
      isFaceSaving: false,
      hasGalleryFailures: hasGalleryError,
    }),
    [
      disabled,
      hasGalleryError,
      isExternalUploading,
      isReplaceUploading,
      removingIds.length,
    ],
  )

  const isGalleryBusyForFlash = isGalleryOperationBusyInput(galleryBusyInput)
  const savedFlash = useGallerySavedFlash(isGalleryBusyForFlash, hasGalleryError)
  const operationState = resolveGalleryOperationState({
    ...galleryBusyInput,
    showSavedFlash: savedFlash,
  })
  const isGalleryBusy = disabled || isGalleryOperationBusy(operationState)
  const resolvedHeaderMode = headerMode ?? (embedded ? 'none' : 'inline')

  const headerStatus = (
    <GallerySectionStatus
      operationState={operationState}
      uploadCount={galleryUploadCount}
      removingCount={removingIds.length}
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
        const imageId = normalizeGalleryImageId(image.id)
        const isPendingRemoval = removedIds.some(
          (id) => normalizeGalleryImageId(id) === imageId,
        )
        const isRemoving = imageId > 0 && removingIdSet.has(imageId)
        const replacementPreviewUrl = replacementPreviews[imageId]
        const replaceStatus = replaceStatusById[imageId]
        const replaceError = replaceErrorById[imageId]

        return (
          <ExistingGalleryCard
            key={imageId}
            image={image}
            isPendingRemoval={isPendingRemoval}
            isRemoving={isRemoving}
            disabled={isGalleryBusy || isRemoving}
            replacementPreviewUrl={replacementPreviewUrl}
            replaceStatus={replaceStatus}
            replaceError={replaceError}
            allowPermanentDelete={allowPermanentDelete}
            onToggleRemove={(remove) => onToggleRemove(imageId, remove)}
            onRequestRemove={
              confirmRemove
                ? () => setPendingRemoveId(imageId)
                : undefined
            }
            onReplaceImage={
              onReplaceImage ? (file) => setCropReplace({ imageId, file }) : undefined
            }
            onCancelReplace={
              onCancelReplace && replacementPreviewUrl
                ? () => onCancelReplace(imageId)
                : undefined
            }
            onRetryReplace={
              onRetryReplace && replaceStatus === 'failed'
                ? () => onRetryReplace(imageId)
                : undefined
            }
            onPermanentDelete={
              onPermanentDelete
                ? () => setPendingPermanentDeleteId(imageId)
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

  const permanentDeleteDialog = (
    <ConfirmDialog
      open={pendingPermanentDeleteId !== null}
      title={t('form.galleryPermanentDeleteConfirmTitle')}
      description={t('form.galleryPermanentDeleteConfirmBody')}
      confirmLabel={t('detail.delete')}
      cancelLabel={t('common.cancel')}
      onCancel={() => setPendingPermanentDeleteId(null)}
      onConfirm={() => {
        if (pendingPermanentDeleteId !== null && onPermanentDelete) {
          onPermanentDelete(pendingPermanentDeleteId)
        }
        setPendingPermanentDeleteId(null)
      }}
    />
  )

  if (embedded || resolvedHeaderMode === 'none') {
    return (
      <>
        {grid}
        {cropModal}
        {removeDialog}
        {permanentDeleteDialog}
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
      {permanentDeleteDialog}
    </>
  )
}

export { COIN_MEDIA_GRID_CLASS } from '../../lib/coinMediaGrid'
export { normalizeGalleryImageId } from '../../lib/api'
export { useGallerySavedFlash } from '../../hooks/useGallerySavedFlash'
