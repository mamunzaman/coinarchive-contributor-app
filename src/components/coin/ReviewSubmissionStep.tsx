import { DuplicateWarningCard } from './DuplicateWarningCard'
import { computeCompletenessScore } from '../../lib/completenessScore'
import type { DuplicateMatch } from '../../lib/duplicateDetection'
import type { CoinFormValues } from '../../types/coinForm'

type ReviewSubmissionStepProps = {
  values: CoinFormValues
  duplicateMatches: DuplicateMatch[]
  obversePreviewUrl?: string | null
  reversePreviewUrl?: string | null
  galleryPreviewUrls?: string[]
  hasExistingObverse?: boolean
  hasExistingReverse?: boolean
  existingGalleryUrls?: string[]
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) {
    return null
  }

  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-navy-muted">{label}</dt>
      <dd className="mt-1 text-sm text-navy">{value}</dd>
    </div>
  )
}

export function ReviewSubmissionStep({
  values,
  duplicateMatches,
  obversePreviewUrl,
  reversePreviewUrl,
  galleryPreviewUrls = [],
  hasExistingObverse = false,
  hasExistingReverse = false,
  existingGalleryUrls = [],
}: ReviewSubmissionStepProps) {
  const hasObverse = Boolean(obversePreviewUrl || hasExistingObverse)
  const hasReverse = Boolean(reversePreviewUrl || hasExistingReverse)
  const hasGallery = galleryPreviewUrls.length > 0 || existingGalleryUrls.length > 0

  const completeness = computeCompletenessScore({
    values,
    hasObverse,
    hasReverse,
    hasGallery,
  })

  const mintSummary = values.hasMintVariants
    ? values.mintVariants
        .filter((row) => row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim())
        .map(
          (row) =>
            `${row.mintMarkCode || '—'} · mintage ${row.mintMintage || '—'}${row.mintNotes ? ` · ${row.mintNotes}` : ''}`,
        )
        .join('; ')
    : values.singleMintMark.trim()

  const allGalleryUrls = [...galleryPreviewUrls, ...existingGalleryUrls]

  return (
    <section className="flex flex-col gap-6">
      <DuplicateWarningCard matches={duplicateMatches} />

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-sm font-medium text-navy">Review your submission before sending for archive review.</p>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-navy">Images</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-muted">Obverse</p>
            {obversePreviewUrl ? (
              <img
                src={obversePreviewUrl}
                alt="Obverse review"
                className="aspect-square w-full rounded-xl border border-border/60 bg-white object-contain p-2"
              />
            ) : (
              <p className="text-sm text-navy-muted">No obverse image</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-muted">Reverse</p>
            {reversePreviewUrl ? (
              <img
                src={reversePreviewUrl}
                alt="Reverse review"
                className="aspect-square w-full rounded-xl border border-border/60 bg-white object-contain p-2"
              />
            ) : (
              <p className="text-sm text-navy-muted">No reverse image</p>
            )}
          </div>
        </div>
        {allGalleryUrls.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-muted">Gallery</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {allGalleryUrls.map((url, index) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="aspect-square rounded-lg border border-border/60 bg-white object-contain p-1"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-navy">Coin details</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailRow label="Title" value={values.title} />
          <DetailRow label="Country" value={values.country} />
          <DetailRow label="Year" value={values.year} />
          <DetailRow label="Denomination" value={values.denomination} />
          <DetailRow label="Coin type" value={values.coin_type} />
          <DetailRow label="Theme" value={values.coin_theme} />
        </dl>
      </div>

      {mintSummary ? (
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy">Mint information</h3>
          <p className="mt-2 text-sm text-navy">{mintSummary}</p>
        </div>
      ) : null}

      <div>
        <h3 className="font-serif text-lg font-semibold text-navy">Description</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-navy">
          {values.short_description || 'No short description provided.'}
        </p>
      </div>

      {completeness.missingRecommended.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-semibold text-amber-950">Missing recommended fields</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {completeness.missingRecommended.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-navy-muted">
        Use <strong>Back</strong> to edit any section, or <strong>Submit for review</strong> when ready.
      </p>
    </section>
  )
}
