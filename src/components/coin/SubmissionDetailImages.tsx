import { SubmissionCoinFaces } from './SubmissionCoinFaces'
import { SubmissionDetailGallery } from './SubmissionDetailGallery'
import { Button } from '../ui/Button'
import type { CoinSubmissionDetail } from '../../lib/api'
import type {
  FaceAutosaveState,
  ImageCardStatus,
  PendingGalleryUpload,
  SubmissionDetailImageEditState,
  UndoRemovalSnack,
} from '../../hooks/useSubmissionImageAutosave'
import {
  getVisibleGalleryImages,
  resolveFaceDisplayUrl,
} from '../../lib/submissionDetailImagePreview'

export type { SubmissionDetailImageEditState } from '../../hooks/useSubmissionImageAutosave'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

function ImageStatusBadge({ status }: { status: ImageCardStatus }) {
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
    status === 'uploading' ? 'Uploading' : status === 'saved' ? 'Saved' : 'Failed'

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
}: LiveFaceEditorProps) {
  const displayUrl = resolveFaceDisplayUrl(apiUrl, faceState)
  const isUploading = faceState.status === 'uploading'
  const showActions = faceState.status === 'failed'

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">{side}</p>
        <ImageStatusBadge status={faceState.status} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
        <div className="border-b border-border/40 bg-muted/20 px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
        </div>

        {displayUrl ? (
          <div className="relative flex justify-center p-4 sm:p-6">
            <img
              src={displayUrl}
              alt={label}
              className={[
                'max-h-72 w-full max-w-sm object-contain sm:max-h-80 lg:max-h-96',
                isUploading ? 'opacity-90' : '',
              ].join(' ')}
            />
            {faceState.status !== 'idle' ? (
              <div className="absolute left-4 top-4">
                <ImageStatusBadge status={faceState.status} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-sm text-navy-muted">No image yet</p>
          </div>
        )}

        <div className="border-t border-border/40 px-4 py-4">
          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-page px-4 py-3 text-sm font-semibold text-navy transition-colors hover:border-primary/30 hover:bg-white">
            <input
              type="file"
              accept={ACCEPT}
              name={name}
              className="sr-only"
              disabled={disabled}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                event.target.value = ''
                onFileChange(file)
              }}
            />
            {isUploading ? 'Uploading…' : 'Replace image'}
          </label>
        </div>
      </div>

      {showActions ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          {faceState.error ? (
            <p role="alert" className="text-sm text-red-700">
              {faceState.error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onRetry} className="action-btn-primary min-h-10 flex-1">
              Retry
            </button>
            <button type="button" onClick={onRevert} className="action-btn-neutral min-h-10 flex-1">
              Revert
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function ExistingGalleryCard({
  imageUrl,
  imageAlt,
  disabled,
  onRemove,
}: {
  imageUrl: string
  imageAlt: string
  disabled: boolean
  onRemove: () => void
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/40 bg-white">
      <div className="p-2">
        <img src={imageUrl} alt={imageAlt} className="aspect-square w-full rounded-lg object-cover" />
      </div>
      <div className="border-t border-border/60 p-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-red-50 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

function PendingGalleryCard({
  item,
  onRetry,
  onRemove,
}: {
  item: PendingGalleryUpload
  onRetry: () => void
  onRemove: () => void
}) {
  const isUploading = item.status === 'uploading'
  const isFailed = item.status === 'failed'

  return (
    <div
      className={[
        'flex flex-col overflow-hidden rounded-xl border bg-white',
        isFailed ? 'border-red-300' : 'border-border/60',
      ].join(' ')}
    >
      <div className="relative p-2">
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className={[
            'aspect-square w-full rounded-lg object-cover',
            isUploading ? 'opacity-85' : '',
          ].join(' ')}
        />
        <div className="absolute left-3 top-3">
          <ImageStatusBadge status={item.status} />
        </div>
      </div>
      <div className="border-t border-border/60 px-3 py-2">
        <p className="truncate text-xs font-medium text-navy" title={item.file.name}>
          {item.file.name}
        </p>
      </div>
      <div className="mt-auto border-t border-border/60 p-3">
        {isFailed ? (
          <div className="flex flex-col gap-2">
            {item.error ? <p className="text-xs text-red-600">{item.error}</p> : null}
            <div className="flex gap-2">
              <button type="button" onClick={onRetry} className="action-btn-primary min-h-10 flex-1">
                Retry
              </button>
              <button type="button" onClick={onRemove} className="action-btn-neutral min-h-10 flex-1">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-red-50 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

function GalleryAddTile({ onAdd }: { onAdd: (files: File[]) => void }) {
  return (
    <label className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-dashed border-border/70 bg-white/60 transition-colors hover:border-primary/40 hover:bg-white">
      <div className="flex aspect-square flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          +
        </span>
        <span className="text-sm font-semibold text-navy">Add images</span>
        <span className="text-xs text-navy-muted">JPG, PNG, WEBP</span>
      </div>
      <input
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (files.length > 0) {
            onAdd(files)
          }
        }}
      />
    </label>
  )
}

function UndoRemovalBar({
  snack,
  onUndo,
}: {
  snack: UndoRemovalSnack
  onUndo: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-navy">{snack.label}</p>
      <button type="button" onClick={onUndo} className="action-btn-primary min-h-10 px-4">
        Undo
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
  layout?: 'faces' | 'gallery' | 'actions'
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
  layout = 'faces',
}: SubmissionDetailImagesProps) {
  const gallery = submission.images.gallery ?? []
  const visibleGallery = getVisibleGalleryImages(submission, editState)
  const isBusy = editState.activeSaveCount > 0

  if (layout === 'actions') {
    if (!editState.isEditing) {
      return null
    }

    const statusLabel =
      footerStatus === 'saving'
        ? 'Saving…'
        : footerStatus === 'failed'
          ? 'Some changes failed'
          : 'All changes saved'

    const statusClass =
      footerStatus === 'saving'
        ? 'text-navy-muted'
        : footerStatus === 'failed'
          ? 'text-red-600'
          : 'text-primary'

    return (
      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 border-t border-border/50 bg-[#faf8f5]/95 px-1 pb-1 pt-4 backdrop-blur-sm">
        {editState.undoSnack ? (
          <UndoRemovalBar
            snack={editState.undoSnack}
            onUndo={() => onUndoGalleryRemove(editState.undoSnack!.imageId)}
          />
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {footerStatus === 'saving' ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            ) : null}
            <p className={['text-sm font-medium', statusClass].join(' ')}>{statusLabel}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full sm:w-auto"
            disabled={isBusy}
            onClick={onFinishEdit}
          >
            Done
          </Button>
        </div>
      </div>
    )
  }

  if (layout === 'gallery') {
    if (editState.isEditing) {
      return (
        <section className="border-t border-border/50 pt-8">
          <h2 className="font-serif text-xl font-semibold text-navy">Gallery</h2>
          <p className="mt-1 text-sm text-navy-muted">
            New images appear instantly and save automatically.
          </p>

          <div className="mt-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleGallery.map((image) => (
                <ExistingGalleryCard
                  key={image.id}
                  imageUrl={image.url}
                  imageAlt={`${submission.title} gallery`}
                  disabled={isBusy}
                  onRemove={() => onGalleryRemove(image.id)}
                />
              ))}

              {editState.pendingGalleryUploads.map((item) => (
                <PendingGalleryCard
                  key={item.clientId}
                  item={item}
                  onRetry={() => onRetryGalleryUpload(item.clientId)}
                  onRemove={() => onDismissFailedGalleryUpload(item.clientId)}
                />
              ))}

              <GalleryAddTile onAdd={onGalleryAdd} />
            </div>
          </div>
        </section>
      )
    }

    if (gallery.length === 0) {
      return null
    }

    return <SubmissionDetailGallery title={submission.title} images={gallery} />
  }

  return (
    <div className="flex flex-col gap-6">
      {canEdit ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">
            Coin images
          </p>
          {!editState.isEditing ? (
            <button
              type="button"
              onClick={onStartEdit}
              className="action-btn-primary min-h-11 px-4"
            >
              Edit images
            </button>
          ) : (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Live editing
            </span>
          )}
        </div>
      ) : null}

      {editState.isEditing ? (
        <div className="flex flex-col gap-8">
          <LiveFaceEditor
            label="Current obverse"
            side="Obverse"
            apiUrl={submission.images.obverse?.url}
            faceState={editState.obverse}
            name="obverse_image"
            disabled={editState.obverse.status === 'uploading'}
            onFileChange={onObverseChange}
            onRetry={onRetryObverse}
            onRevert={onRevertObverse}
          />
          <LiveFaceEditor
            label="Current reverse"
            side="Reverse"
            apiUrl={submission.images.reverse?.url}
            faceState={editState.reverse}
            name="reverse_image"
            disabled={editState.reverse.status === 'uploading'}
            onFileChange={onReverseChange}
            onRetry={onRetryReverse}
            onRevert={onRevertReverse}
          />
        </div>
      ) : (
        <SubmissionCoinFaces submission={submission} />
      )}
    </div>
  )
}
