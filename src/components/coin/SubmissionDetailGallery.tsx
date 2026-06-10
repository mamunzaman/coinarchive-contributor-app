import type { SubmissionImage } from '../../lib/api'
import { REVIEW_EMPTY_VALUE } from '../../types/coinForm'
import { DetailSectionCard } from './SubmissionDetailCard'

type SubmissionDetailGalleryProps = {
  title: string
  images: SubmissionImage[]
  showEmpty?: boolean
  editHref?: string
  onImageClick?: (image: { src: string; alt: string; label: string }) => void
}

export function SubmissionDetailGallery({
  title,
  images,
  showEmpty = true,
  editHref,
  onImageClick,
}: SubmissionDetailGalleryProps) {
  if (images.length === 0 && !showEmpty) {
    return null
  }

  return (
    <DetailSectionCard
      title="Gallery"
      subtitle={
        images.length > 0
          ? `${images.length} image${images.length === 1 ? '' : 's'}`
          : undefined
      }
      editHref={editHref}
    >
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              onClick={() =>
                onImageClick?.({
                  src: image.url,
                  alt: `${title} gallery ${index + 1}`,
                  label: `Gallery image ${index + 1} preview`,
                })
              }
              className="overflow-hidden rounded-lg border border-border/60 bg-[#faf8f5] p-1.5 transition-colors hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={`Open gallery image ${index + 1} preview`}
            >
              <img
                src={image.url}
                alt={`${title} gallery ${index + 1}`}
                className="aspect-square w-full rounded-md bg-white object-contain p-0.5"
              />
            </button>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm italic text-navy-muted">{REVIEW_EMPTY_VALUE}</p>
      )}
    </DetailSectionCard>
  )
}
