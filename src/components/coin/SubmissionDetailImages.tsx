import { ExistingImageReplaceField } from './ExistingImageReplaceField'
import { EditableGalleryGrid } from './EditableGalleryGrid'
import { SubmissionCoinFaces } from './SubmissionCoinFaces'
import { SubmissionDetailGallery } from './SubmissionDetailGallery'
import { Button } from '../ui/Button'
import { MultiImageUploadField, validateGalleryFiles } from '../ui/MultiImageUploadField'
import type { CoinSubmissionDetail } from '../../lib/api'
import { validateImageFile } from '../../lib/validation'

export type SubmissionDetailImageEditState = {
  isEditing: boolean
  obverseFile: File | null
  reverseFile: File | null
  galleryFiles: File[]
  removedGalleryImageIds: number[]
  obverseError: string | null
  reverseError: string | null
  galleryError: string | null
  isSaving: boolean
  saveError: string | null
}

export const EMPTY_IMAGE_EDIT_STATE: SubmissionDetailImageEditState = {
  isEditing: false,
  obverseFile: null,
  reverseFile: null,
  galleryFiles: [],
  removedGalleryImageIds: [],
  obverseError: null,
  reverseError: null,
  galleryError: null,
  isSaving: false,
  saveError: null,
}

export function hasPendingImageChanges(state: SubmissionDetailImageEditState): boolean {
  return Boolean(
    state.obverseFile ||
      state.reverseFile ||
      state.galleryFiles.length > 0 ||
      state.removedGalleryImageIds.length > 0,
  )
}

export function validateImageEditState(state: SubmissionDetailImageEditState): Pick<
  SubmissionDetailImageEditState,
  'obverseError' | 'reverseError' | 'galleryError'
> {
  return {
    obverseError: state.obverseFile ? validateImageFile(state.obverseFile) : null,
    reverseError: state.reverseFile ? validateImageFile(state.reverseFile) : null,
    galleryError: validateGalleryFiles(state.galleryFiles),
  }
}

type SubmissionDetailImagesProps = {
  submission: CoinSubmissionDetail
  canEdit: boolean
  editState: SubmissionDetailImageEditState
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onObverseChange: (file: File | null) => void
  onReverseChange: (file: File | null) => void
  onGalleryChange: (files: File[]) => void
  onGalleryRemoveToggle: (id: number, remove: boolean) => void
  layout?: 'faces' | 'gallery' | 'actions'
}

export function SubmissionDetailImages({
  submission,
  canEdit,
  editState,
  onStartEdit,
  onCancelEdit,
  onSave,
  onObverseChange,
  onReverseChange,
  onGalleryChange,
  onGalleryRemoveToggle,
  layout = 'faces',
}: SubmissionDetailImagesProps) {
  const gallery = submission.images.gallery ?? []
  const hasGallery = gallery.length > 0
  const pendingChanges = hasPendingImageChanges(editState)

  if (layout === 'actions') {
    if (!editState.isEditing) {
      return null
    }

    return (
      <div className="flex flex-col gap-3 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-end">
        {editState.saveError ? (
          <p role="alert" className="sm:mr-auto text-sm text-red-600">
            {editState.saveError}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={editState.isSaving}
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={editState.isSaving || !pendingChanges}
            onClick={onSave}
          >
            {editState.isSaving ? 'Saving…' : 'Save image changes'}
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
            Remove existing photos or add new gallery images.
          </p>
          <div className="mt-5 flex flex-col gap-5">
            <EditableGalleryGrid
              images={gallery}
              removedIds={editState.removedGalleryImageIds}
              disabled={editState.isSaving}
              onToggleRemove={onGalleryRemoveToggle}
            />
            <MultiImageUploadField
              label="Add gallery images"
              files={editState.galleryFiles}
              error={editState.galleryError ?? undefined}
              disabled={editState.isSaving}
              onFilesChange={onGalleryChange}
            />
          </div>
        </section>
      )
    }

    if (!hasGallery) {
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
              Editing images
            </span>
          )}
        </div>
      ) : null}

      {editState.isEditing ? (
        <div className="flex flex-col gap-8">
          <ExistingImageReplaceField
            label="Current obverse"
            replaceLabel="Replace obverse image"
            currentUrl={submission.images.obverse?.url}
            name="obverse_image"
            fileName={editState.obverseFile?.name ?? null}
            error={editState.obverseError ?? undefined}
            disabled={editState.isSaving}
            onFileChange={onObverseChange}
          />
          <ExistingImageReplaceField
            label="Current reverse"
            replaceLabel="Replace reverse image"
            currentUrl={submission.images.reverse?.url}
            name="reverse_image"
            fileName={editState.reverseFile?.name ?? null}
            error={editState.reverseError ?? undefined}
            disabled={editState.isSaving}
            onFileChange={onReverseChange}
          />
        </div>
      ) : (
        <SubmissionCoinFaces submission={submission} />
      )}
    </div>
  )
}
