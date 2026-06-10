import type { CoinSubmissionDetail } from '../../lib/api'

type SubmissionCoinFacesProps = {
  submission: CoinSubmissionDetail
  compact?: boolean
  onImageClick?: (image: { src: string; alt: string; label: string }) => void
}

function CoinFaceCard({
  side,
  imageUrl,
  imageAlt,
  description,
  onImageClick,
}: {
  side: string
  imageUrl?: string | null
  imageAlt: string
  description?: string | null
  onImageClick?: (image: { src: string; alt: string; label: string }) => void
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-border/60 bg-[#faf8f5] p-3.5 shadow-sm">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {side}
      </p>
      {imageUrl ? (
        <button
          type="button"
          onClick={() => onImageClick?.({ src: imageUrl, alt: imageAlt, label: `${side} image preview` })}
          className="flex aspect-[4/3] items-center justify-center rounded-xl bg-white p-3 transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:p-4"
          aria-label={`Open ${side.toLowerCase()} image preview`}
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-h-72 w-full object-contain md:max-h-80 xl:max-h-[24rem]"
          />
        </button>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border/70 bg-white/80">
          <p className="text-xs italic text-navy-muted">Not provided</p>
        </div>
      )}
      {description?.trim() ? (
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-navy-muted">
          {description.trim()}
        </p>
      ) : null}
    </div>
  )
}

export function SubmissionCoinFaces({ submission, compact = false, onImageClick }: SubmissionCoinFacesProps) {
  const acf = submission.acf
  const obverse = submission.images.obverse
  const reverse = submission.images.reverse

  return (
    <div
      className={[
        compact ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2',
      ].join(' ')}
    >
      <CoinFaceCard
        side="Obverse"
        imageUrl={obverse?.url}
        imageAlt={`${submission.title} obverse`}
        description={acf?.coin_obverse_description}
        onImageClick={onImageClick}
      />
      <CoinFaceCard
        side="Reverse"
        imageUrl={reverse?.url}
        imageAlt={`${submission.title} reverse`}
        description={acf?.coin_reverse_description}
        onImageClick={onImageClick}
      />
    </div>
  )
}
