import type { CoinSubmissionDetail } from '../../lib/api'

type SubmissionCoinFacesProps = {
  submission: CoinSubmissionDetail
  compact?: boolean
}

function CoinFaceCard({
  side,
  imageUrl,
  imageAlt,
  description,
}: {
  side: string
  imageUrl?: string | null
  imageAlt: string
  description?: string | null
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-[#faf8f5] p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {side}
      </p>
      {imageUrl ? (
        <div className="flex items-center justify-center rounded-lg bg-white p-2">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-h-40 w-full object-contain sm:max-h-44 md:max-h-48"
          />
        </div>
      ) : (
        <div className="flex aspect-square max-h-40 items-center justify-center rounded-lg border border-dashed border-border/70 bg-white/80 sm:max-h-44 md:max-h-48">
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

export function SubmissionCoinFaces({ submission, compact = false }: SubmissionCoinFacesProps) {
  const acf = submission.acf
  const obverse = submission.images.obverse
  const reverse = submission.images.reverse

  return (
    <div
      className={[
        compact ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-6 sm:grid sm:grid-cols-2 sm:gap-4',
      ].join(' ')}
    >
      <CoinFaceCard
        side="Obverse"
        imageUrl={obverse?.url}
        imageAlt={`${submission.title} obverse`}
        description={acf?.coin_obverse_description}
      />
      <CoinFaceCard
        side="Reverse"
        imageUrl={reverse?.url}
        imageAlt={`${submission.title} reverse`}
        description={acf?.coin_reverse_description}
      />
    </div>
  )
}
