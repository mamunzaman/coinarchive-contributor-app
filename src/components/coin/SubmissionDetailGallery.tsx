import type { SubmissionImage } from '../../lib/api'
import { REVIEW_EMPTY_VALUE } from '../../types/coinForm'
import { DetailSectionCard } from './SubmissionDetailCard'

type SubmissionDetailGalleryProps = {
  title: string
  images: SubmissionImage[]
  showEmpty?: boolean
}

export function SubmissionDetailGallery({
  title,
  images,
  showEmpty = true,
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
    >
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-lg border border-border/60 bg-[#faf8f5] p-1.5"
            >
              <img
                src={image.url}
                alt={`${title} gallery ${index + 1}`}
                className="aspect-square w-full rounded-md bg-white object-contain p-0.5"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm italic text-navy-muted">{REVIEW_EMPTY_VALUE}</p>
      )}
    </DetailSectionCard>
  )
}
