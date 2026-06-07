import type { SubmissionImage } from '../../lib/api'

type EditableGalleryGridProps = {
  images: SubmissionImage[]
  removedIds: number[]
  disabled?: boolean
  onToggleRemove: (id: number, remove: boolean) => void
}

export function EditableGalleryGrid({
  images,
  removedIds,
  disabled = false,
  onToggleRemove,
}: EditableGalleryGridProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">Gallery</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image) => {
          const isPendingRemoval = removedIds.includes(image.id)

          return (
            <div
              key={image.id}
              className={[
                'flex flex-col overflow-hidden rounded-lg border bg-white',
                isPendingRemoval ? 'border-red-300 opacity-60' : 'border-border/60',
              ].join(' ')}
            >
              <img
                src={image.url}
                alt="Gallery image"
                className={[
                  'aspect-square w-full object-cover',
                  isPendingRemoval ? 'grayscale' : '',
                ].join(' ')}
              />
              <div className="flex flex-col gap-1 border-t border-border/60 p-2">
                {isPendingRemoval ? (
                  <p className="text-xs font-medium text-red-600">Pending removal</p>
                ) : null}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleRemove(image.id, !isPendingRemoval)}
                  className={[
                    'text-xs font-semibold transition-colors disabled:opacity-50',
                    isPendingRemoval
                      ? 'text-navy hover:text-primary'
                      : 'text-red-600 hover:text-red-700',
                  ].join(' ')}
                >
                  {isPendingRemoval ? 'Undo' : 'Remove'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
