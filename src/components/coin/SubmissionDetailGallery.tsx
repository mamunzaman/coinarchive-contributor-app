import type { SubmissionImage } from '../../lib/api'

type SubmissionDetailGalleryProps = {
  title: string
  images: SubmissionImage[]
}

export function SubmissionDetailGallery({ title, images }: SubmissionDetailGalleryProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <section className="border-t border-border/50 pt-8">
      <h2 className="font-serif text-xl font-semibold text-navy">Gallery</h2>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="overflow-hidden rounded-xl border border-border/40 bg-white p-2"
          >
            <img
              src={image.url}
              alt={`${title} gallery`}
              className="aspect-square w-full rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
