import { Check, CircleAlert, Crop, Loader2, Trash2, Undo2 } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SubmissionCoinFaces } from './SubmissionCoinFaces'
import { SubmissionDetailGallery } from './SubmissionDetailGallery'
import { DetailSectionCard } from './SubmissionDetailCard'
import {
  EditableGalleryGrid,
  GalleryMediaIconButton,
  GalleryMediaInfoBar,
  GallerySaveStatusPill,
  GalleryTileActionBar,
  CoinFaceEditHint,
  normalizeGalleryImageId,
  useGallerySavedFlash,
} from './EditableGalleryGrid'
import {
  isGalleryOperationBusyInput,
  resolveGalleryOperationState,
} from './galleryOperationState'
import { SubmissionImageZoomModal } from './SubmissionImageZoomModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, type CoinSubmissionDetail, type SubmissionImage } from '../../lib/api'
import {
  refreshSubmissionImagesDetail,
  submitSubmissionImageUpdate,
  type SubmissionImageSaveScope,
} from '../../lib/submissionImageSave'
import type {
  FaceAutosaveState,
  ImageCardStatus,
  SubmissionDetailImageEditState,
  UndoRemovalSnack,
} from '../../hooks/useSubmissionImageAutosave'
import {
  resolveFaceDisplayUrl,
} from '../../lib/submissionDetailImagePreview'
import { resolveSubmissionDetailFaceImageUrl } from '../../lib/imagePreview'
import { runAfterCommit } from '../../lib/runAfterCommit'
import type { FaceFeedbackFlash, FaceImageVisualState } from '../../lib/faceImageUtils'
import { getFaceOverlayLabel, isFaceOperationActive } from '../../lib/faceImageUtils'
import { useFaceSectionSavedFlash } from '../../hooks/useFaceSectionSavedFlash'
import {
  FaceCardEmptyPlaceholder,
  FaceCardErrorBanner,
  FaceCardFeedbackPill,
  FaceCardOperationOverlay,
} from '../ui/croppableFaceUploadParts'

export type { SubmissionDetailImageEditState } from '../../hooks/useSubmissionImageAutosave'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

type FaceTrashAction = {
  show: boolean
  label: string
  mode: 'revert' | 'remove'
}

function resolveFaceTrashAction(
  faceState: FaceAutosaveState,
  apiUrl: string | null | undefined,
  attachmentId: number | null | undefined,
  revertLabel: string,
  removeLabel: string,
): FaceTrashAction | null {
  const hasPendingChange = Boolean(faceState.pendingFile || faceState.previewUrl)
  const isFailed = faceState.status === 'failed'

  if (hasPendingChange || isFailed) {
    return { show: true, label: revertLabel, mode: 'revert' }
  }

  if (attachmentId && attachmentId > 0 && apiUrl) {
    return { show: true, label: removeLabel, mode: 'remove' }
  }

  return null
}

function resolveDetailFaceVisualState(
  side: 'obverse' | 'reverse',
  faceState: FaceAutosaveState,
  apiUrl: string | null | undefined,
  removingSide: 'obverse' | 'reverse' | null,
  revertingSide: 'obverse' | 'reverse' | null,
  confirmPendingSide: 'obverse' | 'reverse' | null,
): FaceImageVisualState {
  if (confirmPendingSide === side && removingSide !== side) {
    if (faceState.status === 'uploading') {
      return 'saving'
    }
    if (faceState.status === 'saved') {
      return 'saved'
    }
    if (faceState.status === 'failed') {
      return 'failed'
    }
    if (!apiUrl && !faceState.previewUrl) {
      return 'removed'
    }
    return 'idle'
  }

  if (removingSide === side) {
    return 'removing'
  }
  if (revertingSide === side) {
    return 'reverting'
  }
  if (faceState.status === 'uploading') {
    return 'saving'
  }
  if (faceState.status === 'saved') {
    return 'saved'
  }
  if (faceState.status === 'failed') {
    return 'failed'
  }
  if (!apiUrl && !faceState.previewUrl) {
    return 'removed'
  }
  return 'idle'
}

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
  sideKey: 'obverse' | 'reverse'
  label: string
  side: string
  apiUrl?: string | null
  faceState: FaceAutosaveState
  visualState: FaceImageVisualState
  feedbackFlash: FaceFeedbackFlash | null
  operationError?: string | null
  confirmPending?: boolean
  name: string
  disabled: boolean
  onFileChange: (file: File | null) => void
  onRetry: () => void
  onRevert: () => void
  showTrash?: boolean
  trashLabel?: string
  onTrash?: () => void
}

function LiveFaceEditor({
  sideKey,
  label,
  side,
  apiUrl,
  faceState,
  visualState,
  feedbackFlash,
  operationError,
  confirmPending = false,
  name,
  disabled,
  onFileChange,
  onRetry,
  onRevert,
  showTrash = false,
  trashLabel,
  onTrash,
  compact = false,
}: LiveFaceEditorProps & { compact?: boolean }) {
  const { t } = useTranslation()
  const inputId = `${name}-replace`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const displayUrl = resolveFaceDisplayUrl(apiUrl, faceState)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const visibleDisplayUrl = displayUrl && failedUrl !== displayUrl ? displayUrl : null
  const isRemoved = visualState === 'removed'
  const operationActive = !confirmPending && isFaceOperationActive(visualState)
  const overlayLabel = operationActive ? getFaceOverlayLabel(visualState, t) : null
  const actionsDisabled = disabled || operationActive
  const replaceAriaLabel =
    sideKey === 'obverse' ? t('form.replaceObverse') : t('form.replaceReverse')
  const uploadAriaLabel =
    sideKey === 'obverse' ? t('form.uploadObverseImage') : t('form.uploadReverseImage')
  const showFailedActions = visualState === 'failed'

  function openFilePicker() {
    if (actionsDisabled) {
      return
    }
    fileInputRef.current?.click()
  }

  function handleFilePick(file: File) {
    setPendingFile(file)
    setCropOpen(true)
  }

  return (
    <section className={compact ? 'flex flex-col gap-2' : 'flex flex-col gap-4'}>
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">{side}</p>
          <ImageStatusBadge status={faceState.status} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white min-w-0 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        {compact ? (
          <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/20 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
              {side}
            </p>
            <ImageStatusBadge status={faceState.status} />
          </div>
        ) : null}

        <div
          className={[
            'coin-face-card__preview',
            visibleDisplayUrl && !isRemoved ? 'group coin-face-card__preview--actions' : '',
            operationActive ? 'coin-face-card__preview--busy' : '',
          ].join(' ')}
        >
          {visibleDisplayUrl && !isRemoved ? (
            <>
              <img
                src={visibleDisplayUrl}
                alt={label}
                onError={() => setFailedUrl(visibleDisplayUrl)}
                className="coin-face-card__media h-full w-full rounded-2xl object-contain p-1.5"
              />

              <GalleryMediaInfoBar title={side} meta={label} />

              {feedbackFlash ? <FaceCardFeedbackPill flash={feedbackFlash} /> : null}
              {visualState === 'saved' && !feedbackFlash ? (
                <FaceCardFeedbackPill flash="saved" />
              ) : null}

              {overlayLabel ? <FaceCardOperationOverlay label={overlayLabel} /> : null}

              {!operationActive ? <CoinFaceEditHint /> : null}

              {!operationActive ? (
                <GalleryTileActionBar ariaLabel={t('form.faceImageActions', { side })}>
                  <input
                    ref={fileInputRef}
                    id={inputId}
                    type="file"
                    accept={ACCEPT}
                    name={name}
                    className="sr-only"
                    disabled={actionsDisabled}
                    aria-label={replaceAriaLabel}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      event.target.value = ''
                      if (file) {
                        handleFilePick(file)
                      }
                    }}
                  />
                  <GalleryMediaIconButton
                    label={replaceAriaLabel}
                    tone="primary"
                    variant="overlay"
                    disabled={actionsDisabled}
                    onClick={openFilePicker}
                  >
                    <Crop className="h-5 w-5" aria-hidden />
                  </GalleryMediaIconButton>

                  {showTrash && onTrash && trashLabel ? (
                    <GalleryMediaIconButton
                      label={trashLabel}
                      tone="danger"
                      variant="overlay"
                      disabled={actionsDisabled}
                      onClick={onTrash}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </GalleryMediaIconButton>
                  ) : null}
                </GalleryTileActionBar>
              ) : null}
            </>
          ) : (
            <FaceCardEmptyPlaceholder
              side={sideKey}
              inputId={inputId}
              disabled={actionsDisabled}
              uploadAriaLabel={uploadAriaLabel}
              onFileSelect={handleFilePick}
            />
          )}
        </div>

        {operationError || showFailedActions ? (
          <div className="border-t border-border/40 p-3">
            <FaceCardErrorBanner
              message={operationError ?? faceState.error ?? t('form.faceImageUpdateFailed')}
              onRetry={showFailedActions ? onRetry : undefined}
              retryLabel={t('form.faceTryAgain')}
            />
            {showFailedActions ? (
              <button
                type="button"
                onClick={onRevert}
                className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-xs font-medium text-navy-muted hover:text-navy"
              >
                <Undo2 className="h-3.5 w-3.5" aria-hidden />
                <span>{t('detail.revert')}</span>
              </button>
            ) : null}
          </div>
        ) : null}
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
        <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('detail.undo')}</span>
      </button>
    </div>
  )
}

function areGalleryListsEqual(
  left: SubmissionImage[],
  right: SubmissionImage[],
): boolean {
  if (left.length !== right.length) {
    return false
  }

  return left.every(
    (image, index) => image.id === right[index]?.id && image.url === right[index]?.url,
  )
}

function galleryListKey(images: SubmissionImage[]): string {
  return images.map((image) => `${image.id}:${image.url}`).join('|')
}

function withNormalizedGalleryIds(images: SubmissionImage[]): SubmissionImage[] {
  return images.map((image) => ({
    ...image,
    id: normalizeGalleryImageId(image.id),
  }))
}

function buildActiveGalleryKeepingIds(hiddenIds: number[], removingIds: number[]): Set<number> {
  const ids = new Set<number>()

  for (const id of hiddenIds) {
    const normalized = normalizeGalleryImageId(id)
    if (normalized > 0) {
      ids.add(normalized)
    }
  }

  for (const id of removingIds) {
    const normalized = normalizeGalleryImageId(id)
    if (normalized > 0) {
      ids.add(normalized)
    }
  }

  return ids
}

function preserveActiveGalleryImages(
  merged: SubmissionImage[],
  previous: SubmissionImage[],
  keepingIds: ReadonlySet<number>,
): SubmissionImage[] {
  if (keepingIds.size === 0) {
    return merged
  }

  const mergedById = new Map<number, SubmissionImage>()

  for (const image of merged) {
    const id = normalizeGalleryImageId(image.id)
    if (id > 0) {
      mergedById.set(id, { ...image, id })
    }
  }

  const output: SubmissionImage[] = []
  const seen = new Set<number>()

  for (const image of previous) {
    const id = normalizeGalleryImageId(image.id)
    if (id <= 0) {
      continue
    }

    if (mergedById.has(id)) {
      output.push(mergedById.get(id)!)
      seen.add(id)
      continue
    }

    if (keepingIds.has(id)) {
      output.push({ ...image, id })
      seen.add(id)
    }
  }

  for (const image of merged) {
    const id = normalizeGalleryImageId(image.id)
    if (id > 0 && !seen.has(id)) {
      output.push({ ...image, id })
    }
  }

  return withNormalizedGalleryIds(output)
}

function mergeGalleryDisplay(
  previous: SubmissionImage[],
  incoming: SubmissionImage[],
  excludedIds: ReadonlySet<number> = new Set(),
  keepingIds: ReadonlySet<number> = new Set(),
): SubmissionImage[] {
  const filteredPrevious = previous.filter(
    (image) => !excludedIds.has(normalizeGalleryImageId(image.id)),
  )
  const filteredIncoming = incoming.filter(
    (image) => !excludedIds.has(normalizeGalleryImageId(image.id)),
  )

  let merged: SubmissionImage[]

  if (filteredIncoming.length === 0) {
    if (incoming.length === 0 && excludedIds.size === 0 && filteredPrevious.length > 0) {
      merged = []
    } else {
      merged = filteredIncoming
    }
  } else {
    const incomingIdSet = new Set(filteredIncoming.map((image) => normalizeGalleryImageId(image.id)))
    const previousIdSet = new Set(filteredPrevious.map((image) => normalizeGalleryImageId(image.id)))
    const serverRemovedIds = filteredPrevious.some(
      (image) => !incomingIdSet.has(normalizeGalleryImageId(image.id)),
    )
    const serverAddedIds = filteredIncoming.some(
      (image) => !previousIdSet.has(normalizeGalleryImageId(image.id)),
    )

    if (serverRemovedIds || filteredIncoming.length < filteredPrevious.length) {
      merged = areGalleryListsEqual(filteredPrevious, filteredIncoming)
        ? filteredPrevious
        : filteredIncoming
    } else if (filteredIncoming.length > filteredPrevious.length || serverAddedIds) {
      merged = areGalleryListsEqual(filteredPrevious, filteredIncoming)
        ? filteredPrevious
        : filteredIncoming
    } else {
      merged = areGalleryListsEqual(filteredPrevious, filteredIncoming)
        ? filteredPrevious
        : filteredIncoming
    }
  }

  return withNormalizedGalleryIds(
    preserveActiveGalleryImages(merged, previous, keepingIds),
  )
}

type SubmissionDetailImagesProps = {
  submission: CoinSubmissionDetail
  canEdit: boolean
  editState: SubmissionDetailImageEditState
  footerStatus: 'saved' | 'saving' | 'failed'
  onStartEdit?: () => void
  onFinishEdit?: () => void
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
  layout?: 'faces' | 'gallery'
  compactHero?: boolean
  editHref?: string
  onSubmissionUpdated?: (submission: CoinSubmissionDetail) => void
  imageSaveScope?: SubmissionImageSaveScope
  sectionVariant?: 'contributor' | 'admin'
}

export function SubmissionDetailImages({
  submission,
  canEdit,
  editState,
  footerStatus,
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
  onSubmissionUpdated,
  imageSaveScope = 'contributor',
  sectionVariant = 'contributor',
}: SubmissionDetailImagesProps) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [activeSubmission, setActiveSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [confirmRemoveSide, setConfirmRemoveSide] = useState<'obverse' | 'reverse' | null>(null)
  const [removingSide, setRemovingSide] = useState<'obverse' | 'reverse' | null>(null)
  const [revertingSide, setRevertingSide] = useState<'obverse' | 'reverse' | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removeErrorSide, setRemoveErrorSide] = useState<'obverse' | 'reverse' | null>(null)
  const [faceFeedback, setFaceFeedback] = useState<{
    side: 'obverse' | 'reverse'
    flash: FaceFeedbackFlash
  } | null>(null)
  const [displayGallery, setDisplayGallery] = useState<SubmissionImage[]>(
    () => submission.images.gallery ?? [],
  )
  const prevPendingGalleryRef = useRef(editState.pendingGalleryUploads)
  const prevRemovingGalleryRef = useRef(editState.removingGalleryIds)
  const excludedGalleryIdsRef = useRef<Set<number>>(new Set())
  const displaySubmission = activeSubmission ?? submission
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
    const imageId = normalizeGalleryImageId(id)
    if (imageId <= 0) {
      continue
    }
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
  const externalPendingItems = useMemo(
    () =>
      editState.pendingGalleryUploads
        .filter((item) => item.status === 'uploading' || item.status === 'failed')
        .map((item) => ({
          key: item.clientId,
          previewUrl: item.previewUrl,
          fileName: item.file.name,
          status: item.status as 'uploading' | 'failed',
          error: item.error ?? undefined,
        })),
    [editState.pendingGalleryUploads],
  )

  const submissionGallery = submission.images.gallery ?? []
  const submissionGalleryKey = galleryListKey(submissionGallery)
  const activeGalleryKeepingIds = useMemo(
    () => buildActiveGalleryKeepingIds(editState.hiddenGalleryIds, editState.removingGalleryIds),
    [editState.hiddenGalleryIds, editState.removingGalleryIds],
  )

  useEffect(() => {
    runAfterCommit(() => {
      setActiveSubmission(null)
      setRemoveError(null)
      setRemoveErrorSide(null)
      setFaceFeedback(null)
    })
  }, [submission])

  useEffect(() => {
    runAfterCommit(() => {
      setDisplayGallery(submissionGallery)
      excludedGalleryIdsRef.current.clear()
    })
  }, [submission.id])

  useEffect(() => {
    setDisplayGallery((previous) =>
      mergeGalleryDisplay(
        previous,
        submissionGallery,
        excludedGalleryIdsRef.current,
        activeGalleryKeepingIds,
      ),
    )

    for (const id of [...excludedGalleryIdsRef.current]) {
      if (!submissionGallery.some((image) => normalizeGalleryImageId(image.id) === id)) {
        excludedGalleryIdsRef.current.delete(id)
      }
    }
  }, [submissionGalleryKey, submissionGallery, activeGalleryKeepingIds])

  useEffect(() => {
    const previous = prevRemovingGalleryRef.current
    const current = editState.removingGalleryIds
    const finishedRemovals = previous.filter(
      (id) =>
        !current.some((entry) => normalizeGalleryImageId(entry) === normalizeGalleryImageId(id)),
    )
    prevRemovingGalleryRef.current = current

    if (finishedRemovals.length === 0) {
      return
    }

    for (const id of finishedRemovals) {
      const normalizedId = normalizeGalleryImageId(id)
      if (
        normalizedId > 0 &&
        !submissionGallery.some((image) => normalizeGalleryImageId(image.id) === normalizedId)
      ) {
        excludedGalleryIdsRef.current.add(normalizedId)
      }
    }

    setDisplayGallery((prev) =>
      mergeGalleryDisplay(
        prev.filter(
          (image) =>
            !finishedRemovals.some(
              (id) => normalizeGalleryImageId(id) === normalizeGalleryImageId(image.id),
            ),
        ),
        submissionGallery,
        excludedGalleryIdsRef.current,
        new Set(),
      ),
    )

    if (!token) {
      return
    }

    void refreshSubmissionImagesDetail(submission.id, token, submission, imageSaveScope)
      .then((refreshedSubmission) => {
        const refreshedGallery = refreshedSubmission.images.gallery ?? []

        for (const id of finishedRemovals) {
          const normalizedId = normalizeGalleryImageId(id)
          if (normalizedId <= 0) {
            continue
          }

          if (refreshedGallery.every((image) => normalizeGalleryImageId(image.id) !== normalizedId)) {
            excludedGalleryIdsRef.current.add(normalizedId)
          } else {
            excludedGalleryIdsRef.current.delete(normalizedId)
          }
        }

        setDisplayGallery((prev) =>
          mergeGalleryDisplay(prev, refreshedGallery, excludedGalleryIdsRef.current, new Set()),
        )
        onSubmissionUpdated?.(refreshedSubmission)
      })
      .catch(() => {
        for (const id of finishedRemovals) {
          const normalizedId = normalizeGalleryImageId(id)
          if (normalizedId > 0) {
            excludedGalleryIdsRef.current.delete(normalizedId)
          }
        }
        setDisplayGallery((prev) =>
          mergeGalleryDisplay(
            prev,
            submissionGallery,
            excludedGalleryIdsRef.current,
            activeGalleryKeepingIds,
          ),
        )
      })
  }, [
    activeGalleryKeepingIds,
    editState.removingGalleryIds,
    onSubmissionUpdated,
    submission.id,
    submissionGallery,
    token,
    imageSaveScope,
  ])

  useEffect(() => {
    const previous = prevPendingGalleryRef.current
    const current = editState.pendingGalleryUploads
    const finishedUploads = previous.filter(
      (item) =>
        item.status === 'uploading' &&
        !current.some((entry) => entry.clientId === item.clientId),
    )

    prevPendingGalleryRef.current = current

    if (finishedUploads.length === 0 || !token) {
      return
    }

    void refreshSubmissionImagesDetail(submission.id, token, submission, imageSaveScope)
      .then((refreshedSubmission) => {
        const refreshedGallery = refreshedSubmission.images.gallery ?? []
        setDisplayGallery((previous) =>
          mergeGalleryDisplay(
            previous,
            refreshedGallery,
            excludedGalleryIdsRef.current,
            activeGalleryKeepingIds,
          ),
        )
        onSubmissionUpdated?.(refreshedSubmission)
      })
      .catch(() => {
        setDisplayGallery((previous) =>
          mergeGalleryDisplay(
            previous,
            submissionGallery,
            excludedGalleryIdsRef.current,
            activeGalleryKeepingIds,
          ),
        )
      })
  }, [
    activeGalleryKeepingIds,
    editState.pendingGalleryUploads,
    imageSaveScope,
    onSubmissionUpdated,
    submission.id,
    submissionGallery,
    token,
  ])

  const gallery = displayGallery

  useEffect(() => {
    if (!faceFeedback) {
      return
    }
    const timer = window.setTimeout(() => setFaceFeedback(null), 2500)
    return () => window.clearTimeout(timer)
  }, [faceFeedback])

  function flashFaceFeedback(side: 'obverse' | 'reverse', flash: FaceFeedbackFlash) {
    setFaceFeedback({ side, flash })
  }

  function runRevert(side: 'obverse' | 'reverse', revert: () => void) {
    setRevertingSide(side)
    setRemoveError(null)
    revert()
    window.setTimeout(() => setRevertingSide(null), 500)
  }

  async function confirmRemoveFace() {
    if (!confirmRemoveSide || !token) {
      return
    }

    const base = activeSubmission ?? submission
    const attachmentId =
      confirmRemoveSide === 'obverse'
        ? base.images.obverse?.id
        : base.images.reverse?.id

    if (!attachmentId || attachmentId <= 0) {
      setConfirmRemoveSide(null)
      return
    }

    const removedSide = confirmRemoveSide
    setConfirmRemoveSide(null)
    setRemovingSide(removedSide)
    setRemoveError(null)
    setRemoveErrorSide(null)

    try {
      const result = await submitSubmissionImageUpdate(
        submission.id,
        base,
        token,
        removedSide === 'obverse'
          ? { removeObverseImageIds: [attachmentId] }
          : { removeReverseImageIds: [attachmentId] },
        imageSaveScope,
      )

      if (!result.ok) {
        setRemoveErrorSide(removedSide)
        setRemoveError(result.message)
        return
      }

      setActiveSubmission(result.submission)
      onSubmissionUpdated?.(result.submission)
      if (removedSide === 'obverse') {
        onRevertObverse()
      } else {
        onRevertReverse()
      }
      flashFaceFeedback(removedSide, 'removed')
    } catch (err) {
      setRemoveErrorSide(removedSide)
      setRemoveError(
        err instanceof ApiError ? err.message : t('form.faceImageUpdateFailed'),
      )
    } finally {
      setRemovingSide(null)
    }
  }

  const obverseSideLabel = t('form.obverse')
  const reverseSideLabel = t('form.reverse')
  const obverseApiUrl = resolveSubmissionDetailFaceImageUrl(displaySubmission, 'obverse')
  const reverseApiUrl = resolveSubmissionDetailFaceImageUrl(displaySubmission, 'reverse')
  const obverseTrash = resolveFaceTrashAction(
    editState.obverse,
    obverseApiUrl,
    displaySubmission.images.obverse?.id,
    t('detail.revert'),
    t('imagePreview.removeImageAria', { side: obverseSideLabel }),
  )
  const reverseTrash = resolveFaceTrashAction(
    editState.reverse,
    reverseApiUrl,
    displaySubmission.images.reverse?.id,
    t('detail.revert'),
    t('imagePreview.removeImageAria', { side: reverseSideLabel }),
  )
  const confirmRemoveSideLabel =
    confirmRemoveSide === 'obverse' ? obverseSideLabel : reverseSideLabel

  const isFaceSaving =
    editState.obverse.status === 'uploading' ||
    editState.reverse.status === 'uploading' ||
    removingSide !== null ||
    revertingSide !== null
  const isGalleryUploading = isExternalGalleryUploading
  const galleryUploadCount = editState.pendingGalleryUploads.filter(
    (item) => item.status === 'uploading',
  ).length
  const galleryTileRemovingIds = useMemo(() => {
    const ids = new Set<number>()

    for (const id of editState.removingGalleryIds) {
      const normalized = normalizeGalleryImageId(id)
      if (normalized > 0) {
        ids.add(normalized)
      }
    }

    return Array.from(ids)
  }, [editState.removingGalleryIds])
  const galleryRemovingCount = galleryTileRemovingIds.length
  const hasFaceError =
    editState.obverse.status === 'failed' ||
    editState.reverse.status === 'failed' ||
    Boolean(removeError)
  const isGalleryRemovalPending = galleryTileRemovingIds.length > 0
  const hasGallerySectionError =
    Object.values(replaceStatusById).some((status) => status === 'failed') ||
    editState.pendingGalleryUploads.some((item) => item.status === 'failed') ||
    (footerStatus === 'failed' && !hasFaceError && !isGalleryRemovalPending)

  const galleryBusyInput = useMemo(
    () => ({
      removingCount: galleryTileRemovingIds.length,
      hasPendingUploading: isGalleryUploading,
      hasReplaceUploading: isReplaceUploading,
      activeSaveCount: editState.activeSaveCount,
      isFaceSaving,
      hasGalleryFailures: hasGallerySectionError,
    }),
    [
      editState.activeSaveCount,
      galleryTileRemovingIds.length,
      hasGallerySectionError,
      isFaceSaving,
      isGalleryUploading,
      isReplaceUploading,
    ],
  )

  const isGalleryBusyForFlash = isGalleryOperationBusyInput(galleryBusyInput)
  const gallerySavedFlash = useGallerySavedFlash(isGalleryBusyForFlash, hasGallerySectionError)
  const galleryOperationState = resolveGalleryOperationState({
    ...galleryBusyInput,
    showSavedFlash: gallerySavedFlash,
  })
  const faceSavedFlash = useFaceSectionSavedFlash(
    isFaceSaving,
    editState.obverse.status,
    editState.reverse.status,
  )
  const showFaceSectionStatus =
    isFaceSaving || (faceSavedFlash && !isFaceSaving) || hasFaceError
  const faceSectionStatusLabel = removingSide
    ? t('form.faceRemovingImage')
    : revertingSide
      ? t('form.faceRevertingImage')
      : isFaceSaving
        ? t('form.faceSavingStatus')
        : hasFaceError
          ? t('form.faceImageUpdateFailed')
          : t('detail.allChangesSaved')

  const obverseVisualState = resolveDetailFaceVisualState(
    'obverse',
    editState.obverse,
    obverseApiUrl,
    removingSide,
    revertingSide,
    confirmRemoveSide,
  )
  const reverseVisualState = resolveDetailFaceVisualState(
    'reverse',
    editState.reverse,
    reverseApiUrl,
    removingSide,
    revertingSide,
    confirmRemoveSide,
  )
  const obverseOperationError =
    removeErrorSide === 'obverse' ? removeError : null
  const reverseOperationError =
    removeErrorSide === 'reverse' ? removeError : null

  if (layout === 'gallery') {
    if (canEdit) {
      return (
        <div className="coin-gallery-direct-edit flex flex-col gap-3">
          {editState.undoSnack ? (
            <UndoRemovalBar
              snack={editState.undoSnack}
              onUndo={() => onUndoGalleryRemove(editState.undoSnack!.imageId)}
            />
          ) : null}

          <DetailSectionCard
            title={t('detail.gallery')}
            subtitle={t('detail.gallerySubtitle')}
            editHref={editHref}
            titleAccessory={
              <div className="flex flex-wrap items-center justify-end gap-2">
                {editState.galleryNotice ? (
                  <span
                    className="gallery-section-status inline-flex shrink-0 items-center rounded-full bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200/80"
                    role="alert"
                    aria-live="polite"
                  >
                    {t(editState.galleryNotice)}
                  </span>
                ) : null}
                <GallerySaveStatusPill
                  operationState={galleryOperationState}
                  uploadCount={galleryUploadCount}
                  removingCount={galleryRemovingCount}
                />
              </div>
            }
          >
            <EditableGalleryGrid
              embedded
              headerMode="none"
              showAddTile
              images={gallery}
              removedIds={[]}
              removingIds={galleryTileRemovingIds}
              disabled={isBusy}
              pendingGalleryUploading={isExternalGalleryUploading}
              externalPendingItems={externalPendingItems}
              replacementPreviews={galleryReplacementPreviews}
              replaceStatusById={replaceStatusById}
              replaceErrorById={replaceErrorById}
              allowPermanentDelete={allowGalleryPermanentDelete}
              onToggleRemove={(imageId, remove) => {
                const normalizedId = normalizeGalleryImageId(imageId)
                if (normalizedId <= 0) {
                  return
                }

                if (remove) {
                  onGalleryRemove(normalizedId)
                } else {
                  onUndoGalleryRemove(normalizedId)
                }
              }}
              onReplaceImage={onGalleryReplace}
              onCancelReplace={onCancelGalleryReplace}
              onRetryReplace={onRetryGalleryReplace}
              onPermanentDelete={onGalleryPermanentDelete}
              onAddFiles={onGalleryAdd}
              onRetryExternalPending={onRetryGalleryUpload}
              onDismissExternalPending={onDismissFailedGalleryUpload}
            />
          </DetailSectionCard>
        </div>
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
        sectionVariant === 'admin' ? (
          <div className="admin-review-images-header flex flex-col gap-1.5">
            <h2 className="font-serif text-lg font-semibold text-navy sm:text-xl">
              {t('admin.reviewDesk.imagesSectionTitle')}
            </h2>
            <p className="text-sm text-navy-muted">{t('admin.reviewDesk.imagesSectionHelper')}</p>
          </div>
        ) : (
          <div className="submission-detail-images__toolbar flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
              {t('detail.coinImages')}
            </p>
            {editHref ? (
              <Link
                to={editHref}
                className="inline-flex min-h-9 items-center rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                {t('detail.edit')}
              </Link>
            ) : null}
          </div>
        )
      ) : null}

      {canEdit ? (
        <>
          <div className="submission-coin-faces min-w-0 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <LiveFaceEditor
              sideKey="obverse"
              label={t('form.currentObverse')}
              side={obverseSideLabel}
              apiUrl={obverseApiUrl}
              faceState={editState.obverse}
              visualState={obverseVisualState}
              feedbackFlash={
                faceFeedback?.side === 'obverse' ? faceFeedback.flash : null
              }
              operationError={obverseOperationError}
              confirmPending={confirmRemoveSide === 'obverse'}
              name="obverse_image"
              disabled={
                editState.obverse.status === 'uploading' ||
                removingSide !== null ||
                revertingSide !== null
              }
              onFileChange={onObverseChange}
              onRetry={onRetryObverse}
              onRevert={() => runRevert('obverse', onRevertObverse)}
              showTrash={Boolean(obverseTrash?.show)}
              trashLabel={obverseTrash?.label}
              onTrash={
                obverseTrash?.mode === 'revert'
                  ? () => runRevert('obverse', onRevertObverse)
                  : () => setConfirmRemoveSide('obverse')
              }
              compact={compactHero}
            />
            <LiveFaceEditor
              sideKey="reverse"
              label={t('form.currentReverse')}
              side={reverseSideLabel}
              apiUrl={reverseApiUrl}
              faceState={editState.reverse}
              visualState={reverseVisualState}
              feedbackFlash={
                faceFeedback?.side === 'reverse' ? faceFeedback.flash : null
              }
              operationError={reverseOperationError}
              confirmPending={confirmRemoveSide === 'reverse'}
              name="reverse_image"
              disabled={
                editState.reverse.status === 'uploading' ||
                removingSide !== null ||
                revertingSide !== null
              }
              onFileChange={onReverseChange}
              onRetry={onRetryReverse}
              onRevert={() => runRevert('reverse', onRevertReverse)}
              showTrash={Boolean(reverseTrash?.show)}
              trashLabel={reverseTrash?.label}
              onTrash={
                reverseTrash?.mode === 'revert'
                  ? () => runRevert('reverse', onRevertReverse)
                  : () => setConfirmRemoveSide('reverse')
              }
              compact={compactHero}
            />
          </div>
          {showFaceSectionStatus ? (
            <div
              className={[
                'coin-face-section-status',
                isFaceSaving
                  ? 'coin-face-section-status--saving'
                  : hasFaceError
                    ? 'coin-face-section-status--error'
                    : 'coin-face-section-status--saved',
              ].join(' ')}
              role="status"
              aria-live="polite"
            >
              {isFaceSaving ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              ) : hasFaceError ? (
                <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Check className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span>{faceSectionStatusLabel}</span>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <SubmissionCoinFaces
            submission={displaySubmission}
            compact={compactHero}
            onImageClick={setZoomImage}
          />
          <SubmissionImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
        </>
      )}

      <ConfirmDialog
        open={confirmRemoveSide !== null}
        title={t('form.imageRemoveConfirmTitle', { side: confirmRemoveSideLabel })}
        description={t('form.imageRemoveConfirmBody')}
        confirmLabel={t('form.imageRemoveConfirmAction')}
        cancelLabel={t('common.cancel')}
        onCancel={() => {
          setConfirmRemoveSide(null)
          setRemoveError(null)
          setRemoveErrorSide(null)
        }}
        onConfirm={() => {
          void confirmRemoveFace()
        }}
      />
    </div>
  )
}
