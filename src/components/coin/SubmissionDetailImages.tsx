import { Check, CircleAlert, Crop, Images, Loader2, RotateCcw, Undo2 } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SubmissionCoinFaces } from './SubmissionCoinFaces'
import { SubmissionDetailGallery } from './SubmissionDetailGallery'
import { DetailSectionCard } from './SubmissionDetailCard'
import { EditableGalleryGrid, GallerySaveStatusPill, useGallerySavedFlash } from './EditableGalleryGrid'
import { SubmissionImageZoomModal } from './SubmissionImageZoomModal'
import { Button } from '../ui/Button'
import { ICON_ACTION } from '../ui/ActionControls'
import type { CoinSubmissionDetail } from '../../lib/api'
import type {
  FaceAutosaveState,
  ImageCardStatus,
  SubmissionDetailImageEditState,
  UndoRemovalSnack,
} from '../../hooks/useSubmissionImageAutosave'
import {
  getVisibleGalleryImages,
  resolveFaceDisplayUrl,
} from '../../lib/submissionDetailImagePreview'
import { resolveSubmissionDetailFaceImageUrl } from '../../lib/imagePreview'

export type { SubmissionDetailImageEditState } from '../../hooks/useSubmissionImageAutosave'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

const ImageCropModal = lazy(() =>
  import('../ui/ImageCropModal').then((module) => ({ default: module.ImageCropModal })),
)

function ImageStatusBadge({ status }: { status: ImageCardStatus }) {
  const { t } = useTranslation()

  if (status === 'idle') {
    return null
  }

  const classes =
    status === 'uploading'
      ? 'bg-white/95 text-navy shadow-sm ring-1 ring-border'
      : status === 'saved'
        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
        : 'bg-red-50 text-red-700 ring-1 ring-red-200'

  const label =
    status === 'uploading'
      ? t('detail.uploading')
      : status === 'saved'
        ? t('detail.saved')
        : t('detail.failed')

  return (
    <span
      className={[
        'inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide',
        classes,
      ].join(' ')}
    >
      {status === 'uploading' ? (
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      ) : null}
      {label}
    </span>
  )
}

type LiveFaceEditorProps = {
  label: string
  side: string
  apiUrl?: string | null
  faceState: FaceAutosaveState
  name: string
  disabled: boolean
  onFileChange: (file: File | null) => void
  onRetry: () => void
  onRevert: () => void
}

function LiveFaceEditor({
  label,
  side,
  apiUrl,
  faceState,
  name,
  disabled,
  onFileChange,
  onRetry,
  onRevert,
  compact = false,
}: LiveFaceEditorProps & { compact?: boolean }) {
  const { t } = useTranslation()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const displayUrl = resolveFaceDisplayUrl(apiUrl, faceState)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const visibleDisplayUrl = displayUrl && failedUrl !== displayUrl ? displayUrl : null
  const isUploading = faceState.status === 'uploading'
  const showActions = faceState.status === 'failed'

  useEffect(() => {
    setFailedUrl(null)
  }, [displayUrl])

  return (
    <section className={compact ? 'flex flex-col gap-2' : 'flex flex-col gap-4'}>
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">{side}</p>
          <ImageStatusBadge status={faceState.status} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/50 bg-white min-w-0">
        {compact ? (
          <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/20 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
              {side}
            </p>
            <ImageStatusBadge status={faceState.status} />
          </div>
        ) : (
          <div className="border-b border-border/40 bg-muted/20 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
          </div>
        )}

        {visibleDisplayUrl ? (
          <div className={['submission-coin-face__frame relative flex aspect-[4/3] min-h-0 w-full items-center justify-center overflow-hidden', compact ? 'p-2' : 'p-3 sm:p-4'].join(' ')}>
            <img
              src={visibleDisplayUrl}
              alt={label}
              onError={() => setFailedUrl(visibleDisplayUrl)}
              className="max-h-full max-w-full object-contain"
            />
            {!compact && faceState.status !== 'idle' ? (
              <div className="absolute left-4 top-4">
                <ImageStatusBadge status={faceState.status} />
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={[
              'flex flex-col items-center justify-center text-center',
              compact ? 'aspect-[4/3] px-2 py-6' : 'aspect-[4/3] px-4 py-10',
            ].join(' ')}
          >
            <p className="text-xs italic text-navy-muted">{t('detail.notProvided')}</p>
          </div>
        )}

        <div className={['border-t border-border/40', compact ? 'px-2 py-2' : 'px-4 py-4'].join(' ')}>
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-page px-3 py-2.5 text-xs font-semibold text-navy transition-colors hover:border-primary/30 hover:bg-white sm:text-sm">
            <input
              type="file"
              accept={ACCEPT}
              name={name}
              className="sr-only"
              disabled={disabled}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                event.target.value = ''
                if (file) {
                  setPendingFile(file)
                  setCropOpen(true)
                }
              }}
            />
            <Crop className={ICON_ACTION} aria-hidden />
            <span>{isUploading ? t('detail.uploadingEllipsis') : t('detail.replaceCrop')}</span>
          </label>
        </div>
      </div>

      {cropOpen ? (
        <Suspense fallback={null}>
          <ImageCropModal
            open={cropOpen}
            file={pendingFile}
            title={t('detail.cropTitle', { side: side.toLowerCase() })}
            onClose={() => {
              setCropOpen(false)
              setPendingFile(null)
            }}
            onSave={(file) => {
              onFileChange(file)
              setPendingFile(null)
            }}
          />
        </Suspense>
      ) : null}

      {showActions ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          {faceState.error ? (
            <p role="alert" className="text-sm text-red-700">
              {faceState.error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onRetry} className="action-btn-primary inline-flex min-h-10 flex-1 items-center justify-center gap-2">
              <RotateCcw className={ICON_ACTION} aria-hidden />
              <span>{t('detail.retry')}</span>
            </button>
            <button type="button" onClick={onRevert} className="action-btn-neutral inline-flex min-h-10 flex-1 items-center justify-center gap-2">
              <Undo2 className={ICON_ACTION} aria-hidden />
              <span>{t('detail.revert')}</span>
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function UndoRemovalBar({
  snack,
  onUndo,
}: {
  snack: UndoRemovalSnack
  onUndo: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-navy">{snack.label}</p>
      <button type="button" onClick={onUndo} className="action-btn-primary inline-flex min-h-10 items-center gap-2 px-4">
        <Undo2 className={ICON_ACTION} aria-hidden />
        <span>{t('detail.undo')}</span>
      </button>
    </div>
  )
}

type SubmissionDetailImagesProps = {
  submission: CoinSubmissionDetail
  canEdit: boolean
  editState: SubmissionDetailImageEditState
  footerStatus: 'saved' | 'saving' | 'failed'
  onStartEdit: () => void
  onFinishEdit: () => void
  onObverseChange: (file: File | null) => void
  onReverseChange: (file: File | null) => void
  onGalleryAdd: (files: File[]) => void
  onGalleryRemove: (imageId: number) => void
  onUndoGalleryRemove: (imageId: number) => void
  onRetryObverse: () => void
  onRetryReverse: () => void
  onRevertObverse: () => void
  onRevertReverse: () => void
  onRetryGalleryUpload: (clientId: string) => void
  onDismissFailedGalleryUpload: (clientId: string) => void
  onGalleryReplace: (imageId: number, file: File) => void
  onCancelGalleryReplace: (imageId: number) => void
  onRetryGalleryReplace: (imageId: number) => void
  onGalleryPermanentDelete: (imageId: number) => void
  allowGalleryPermanentDelete?: boolean
  layout?: 'faces' | 'gallery' | 'actions'
  compactHero?: boolean
  editHref?: string
}

export function SubmissionDetailImages({
  submission,
  canEdit,
  editState,
  footerStatus,
  onStartEdit,
  onFinishEdit,
  onObverseChange,
  onReverseChange,
  onGalleryAdd,
  onGalleryRemove,
  onUndoGalleryRemove,
  onRetryObverse,
  onRetryReverse,
  onRevertObverse,
  onRevertReverse,
  onRetryGalleryUpload,
  onDismissFailedGalleryUpload,
  onGalleryReplace,
  onCancelGalleryReplace,
  onRetryGalleryReplace,
  onGalleryPermanentDelete,
  allowGalleryPermanentDelete = false,
  layout = 'faces',
  compactHero = false,
  editHref,
}: SubmissionDetailImagesProps) {
  const { t } = useTranslation()
  const gallery = submission.images.gallery ?? []
  const visibleGallery = getVisibleGalleryImages(submission, editState)
  const isBusy = editState.activeSaveCount > 0
  const [zoomImage, setZoomImage] = useState<{
    src: string
    alt: string
    label: string
  } | null>(null)

  const galleryReplacementPreviews: Record<number, string> = {}
  const replaceStatusById: Record<number, ImageCardStatus> = {}
  const replaceErrorById: Record<number, string> = {}

  for (const [id, state] of Object.entries(editState.galleryReplaceStates)) {
    const imageId = Number(id)
    if (state.previewUrl) {
      galleryReplacementPreviews[imageId] = state.previewUrl
    }
    replaceStatusById[imageId] = state.status
    if (state.error) {
      replaceErrorById[imageId] = state.error
    }
  }

  const isReplaceUploading = Object.values(replaceStatusById).some((status) => status === 'uploading')
  const isExternalGalleryUploading = editState.pendingGalleryUploads.some(
    (item) => item.status === 'uploading',
  )
  const isGallerySectionSaving = isReplaceUploading || isExternalGalleryUploading
  const hasGallerySectionError =
    Object.values(replaceStatusById).some((status) => status === 'failed') ||
    editState.pendingGalleryUploads.some((item) => item.status === 'failed')
  const gallerySavedFlash = useGallerySavedFlash(isGallerySectionSaving, replaceStatusById)

  if (layout === 'actions') {
    if (!editState.isEditing) {
      return null
    }

    const statusLabel =
      footerStatus === 'saving'
        ? t('detail.saving')
        : footerStatus === 'failed'
          ? t('detail.someChangesFailed')
          : t('detail.allChangesSaved')

    const statusIcon =
      footerStatus === 'saving' ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : footerStatus === 'failed' ? (
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Check className="h-4 w-4 shrink-0" aria-hidden />
      )

    return (
      <div className="coin-save-footer">
        {editState.undoSnack ? (
          <div className="coin-save-footer__inner mb-3">
            <UndoRemovalBar
              snack={editState.undoSnack}
              onUndo={() => onUndoGalleryRemove(editState.undoSnack!.imageId)}
            />
          </div>
        ) : null}

        <div className="coin-save-footer__inner">
          <div
            className={[
              'coin-save-footer__status',
              `coin-save-footer__status--${footerStatus}`,
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            {statusIcon}
            <span className="truncate">{statusLabel}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="coin-save-footer__done"
            disabled={isBusy}
            onClick={onFinishEdit}
          >
            <Check className={ICON_ACTION} aria-hidden />
            <span>{t('detail.done')}</span>
          </Button>
        </div>
      </div>
    )
  }

  if (layout === 'gallery') {
    if (editState.isEditing) {
      const externalPendingItems = editState.pendingGalleryUploads
        .filter((item) => item.status === 'uploading' || item.status === 'failed')
        .map((item) => ({
          key: item.clientId,
          previewUrl: item.previewUrl,
          fileName: item.file.name,
          status: item.status as 'uploading' | 'failed',
          error: item.error ?? undefined,
        }))

      return (
        <DetailSectionCard
          title={t('detail.gallery')}
          subtitle={t('detail.gallerySubtitle')}
          editHref={editHref}
          titleAccessory={
            <GallerySaveStatusPill
              isSaving={isGallerySectionSaving}
              showSaved={gallerySavedFlash && !isGallerySectionSaving}
              hasError={hasGallerySectionError && !isGallerySectionSaving}
            />
          }
        >
          <EditableGalleryGrid
            embedded
            headerMode="none"
            showAddTile
            images={visibleGallery}
            removedIds={editState.hiddenGalleryIds}
            disabled={isBusy}
            externalPendingItems={externalPendingItems}
            replacementPreviews={galleryReplacementPreviews}
            replaceStatusById={replaceStatusById}
            replaceErrorById={replaceErrorById}
            allowPermanentDelete={allowGalleryPermanentDelete}
            onToggleRemove={(imageId, remove) =>
              remove ? onGalleryRemove(imageId) : onUndoGalleryRemove(imageId)
            }
            onReplaceImage={onGalleryReplace}
            onCancelReplace={onCancelGalleryReplace}
            onRetryReplace={onRetryGalleryReplace}
            onPermanentDelete={onGalleryPermanentDelete}
            onAddFiles={onGalleryAdd}
            onRetryExternalPending={onRetryGalleryUpload}
            onDismissExternalPending={onDismissFailedGalleryUpload}
          />
        </DetailSectionCard>
      )
    }

    return (
      <>
        <SubmissionDetailGallery
          title={submission.title}
          images={gallery}
          showEmpty={false}
          editHref={editHref}
          onImageClick={setZoomImage}
        />
        <SubmissionImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
      </>
    )
  }

  return (
    <div className={compactHero ? 'submission-detail-images submission-detail-images--compact flex flex-col gap-3' : 'submission-detail-images flex flex-col gap-6'}>
      {canEdit ? (
        <div className="submission-detail-images__toolbar flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
              {t('detail.coinImages')}
            </p>
            {editHref && !editState.isEditing ? (
              <Link
                to={editHref}
                className="inline-flex min-h-9 items-center rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                {t('detail.edit')}
              </Link>
            ) : null}
          </div>
          {!editState.isEditing ? (
            <button
              type="button"
              onClick={onStartEdit}
              className="action-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 sm:w-auto"
            >
              <Images className={ICON_ACTION} aria-hidden />
              <span>{t('detail.editImages')}</span>
            </button>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t('detail.liveEditing')}
            </span>
          )}
        </div>
      ) : null}

      {editState.isEditing ? (
        <div className="submission-coin-faces min-w-0 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <LiveFaceEditor
            label={t('form.currentObverse')}
            side={t('form.obverse')}
            apiUrl={resolveSubmissionDetailFaceImageUrl(submission, 'obverse')}
            faceState={editState.obverse}
            name="obverse_image"
            disabled={editState.obverse.status === 'uploading'}
            onFileChange={onObverseChange}
            onRetry={onRetryObverse}
            onRevert={onRevertObverse}
            compact={compactHero}
          />
          <LiveFaceEditor
            label={t('form.currentReverse')}
            side={t('form.reverse')}
            apiUrl={resolveSubmissionDetailFaceImageUrl(submission, 'reverse')}
            faceState={editState.reverse}
            name="reverse_image"
            disabled={editState.reverse.status === 'uploading'}
            onFileChange={onReverseChange}
            onRetry={onRetryReverse}
            onRevert={onRevertReverse}
            compact={compactHero}
          />
        </div>
      ) : (
        <>
          <SubmissionCoinFaces
            submission={submission}
            compact={compactHero}
            onImageClick={setZoomImage}
          />
          <SubmissionImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
        </>
      )}
    </div>
  )
}
