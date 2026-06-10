import { useEffect, useState } from 'react'
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

function GalleryImageButton({
  image,
  title,
  index,
  onImageClick,
}: {
  image: SubmissionImage
  title: string
  index: number
  onImageClick?: (image: { src: string; alt: string; label: string }) => void
}) {
  const [hasError, setHasError] = useState(false)
  const displayUrl = hasError ? null : image.url
  const alt = `${title} gallery ${index + 1}`

  useEffect(() => {
    setHasError(false)
  }, [image.url])

  return (
    <button
      type="button"
      onClick={() =>
        displayUrl
          ? onImageClick?.({
              src: displayUrl,
              alt,
              label: `Gallery image ${index + 1} preview`,
            })
          : undefined
      }
      disabled={!displayUrl}
      className="overflow-hidden rounded-lg border border-border/60 bg-[#faf8f5] p-1.5 transition-colors hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-default disabled:hover:border-border/60 disabled:hover:bg-[#faf8f5]"
      aria-label={`Open gallery image ${index + 1} preview`}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={alt}
          onError={() => setHasError(true)}
          className="aspect-square w-full rounded-md bg-white object-contain p-0.5"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-md bg-white font-serif text-2xl text-primary/35">
          ◎
        </div>
      )}
    </button>
  )
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
            <GalleryImageButton
              key={image.id}
              image={image}
              title={title}
              index={index}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm italic text-navy-muted">{REVIEW_EMPTY_VALUE}</p>
      )}
    </DetailSectionCard>
  )
}
