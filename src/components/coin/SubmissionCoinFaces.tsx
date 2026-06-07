import type { CoinSubmissionDetail } from '../../lib/api'

type SubmissionCoinFacesProps = {
  submission: CoinSubmissionDetail
}

function FaceLabel({ letter, side }: { letter: string; side: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-serif text-2xl font-semibold text-navy">{letter}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-muted">
        {side}
      </span>
    </div>
  )
}

function CoinFacePlaceholder({ letter, side }: { letter: string; side: string }) {
  return (
    <div className="flex aspect-square w-full max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/60">
      <FaceLabel letter={letter} side={side} />
      <p className="mt-4 text-sm text-navy-muted">No image available</p>
    </div>
  )
}

type CoinFaceBlockProps = {
  letter: string
  side: string
  imageUrl?: string | null
  imageAlt: string
  description?: string | null
}

function CoinFaceBlock({ letter, side, imageUrl, imageAlt, description }: CoinFaceBlockProps) {
  return (
    <section className="flex flex-col gap-4">
      <FaceLabel letter={letter} side={side} />
      {imageUrl ? (
        <div className="flex justify-center rounded-2xl bg-white p-4 sm:p-6">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-h-72 w-full max-w-sm object-contain sm:max-h-80 lg:max-h-96"
          />
        </div>
      ) : (
        <CoinFacePlaceholder letter={letter} side={side} />
      )}
      {description?.trim() ? (
        <p className="max-w-md text-sm leading-relaxed text-navy-muted">{description.trim()}</p>
      ) : null}
    </section>
  )
}

export function SubmissionCoinFaces({ submission }: SubmissionCoinFacesProps) {
  const acf = submission.acf
  const obverse = submission.images.obverse
  const reverse = submission.images.reverse

  return (
    <div className="flex flex-col gap-10 lg:gap-12">
      <CoinFaceBlock
        letter="O"
        side="Obverse"
        imageUrl={obverse?.url}
        imageAlt={`${submission.title} obverse`}
        description={acf?.coin_obverse_description}
      />
      <CoinFaceBlock
        letter="R"
        side="Reverse"
        imageUrl={reverse?.url}
        imageAlt={`${submission.title} reverse`}
        description={acf?.coin_reverse_description}
      />
    </div>
  )
}
