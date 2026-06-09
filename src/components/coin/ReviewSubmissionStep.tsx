import type { ReactNode } from 'react'
import { DuplicateWarningCard } from './DuplicateWarningCard'
import { CoinCodePreview } from './CoinCodePreview'
import { SafeHtmlContent } from '../ui/SafeHtmlContent'
import { computeCompletenessScore } from '../../lib/completenessScore'
import type { DuplicateMatch } from '../../lib/duplicateDetection'
import { formatRecordStatusLabel, formatStatusBoolean } from '../../lib/revisionComparison'
import {
  formatMintMarkDisplay,
  formatMintStatusLabel,
  getMintMarkLabel,
  REVIEW_DEFAULT_IMAGE_NOTE,
  REVIEW_EMPTY_VALUE,
  type CoinFormValues,
  type MintVariantRow,
} from '../../types/coinForm'
import { getImageReviewStateLabel, type ImagePreviewSource } from '../../lib/imagePreview'
import { CoinImagePreviewSlot } from './CoinImagePreviewSlot'
import {
  EMPTY_FORM_OPTIONS,
  isKnownTaxonomyOption,
  type FormOptions,
} from '../../types/formOptions'

const TAXONOMY_REVIEW_STALE_MESSAGE =
  'This taxonomy value is no longer available. Please choose a valid option before submitting.'

type ReviewSubmissionStepProps = {
  values: CoinFormValues
  isAdmin?: boolean
  formOptions?: FormOptions
  formOptionsReady?: boolean
  formOptionsLoading?: boolean
  duplicateMatches: DuplicateMatch[]
  obversePreviewUrl?: string | null
  reversePreviewUrl?: string | null
  obversePreviewSource?: ImagePreviewSource
  reversePreviewSource?: ImagePreviewSource
  galleryPreviewUrls?: string[]
  hasExistingObverse?: boolean
  hasExistingReverse?: boolean
  existingGalleryUrls?: string[]
}

function ReviewSectionCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={[
        'overflow-hidden rounded-xl border border-border/60 bg-white shadow-[var(--shadow-card)]',
        className,
      ].join(' ')}
    >
      <header className="border-b border-border/50 bg-[#faf9f7]/80 px-4 py-3 sm:px-5">
        <h3 className="font-serif text-base font-semibold text-navy sm:text-lg">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-navy-muted">{subtitle}</p> : null}
      </header>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  )
}

function ReviewDetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-6 md:grid-cols-2">{children}</dl>
}

function ReviewDetailRow({
  label,
  value,
  emptyLabel = REVIEW_EMPTY_VALUE,
  className = '',
}: {
  label: string
  value: string
  emptyLabel?: string
  className?: string
}) {
  const trimmed = value.trim()
  const isEmpty = !trimmed

  return (
    <div
      className={[
        'border-b border-border/40 py-3 first:pt-0 last:border-b-0 last:pb-0',
        className,
      ].join(' ')}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {label}
      </dt>
      <dd
        className={[
          'mt-1 text-sm leading-relaxed',
          isEmpty ? 'italic text-navy-muted' : 'text-navy',
        ].join(' ')}
      >
        {trimmed || emptyLabel}
      </dd>
    </div>
  )
}

function ReviewTextBlock({
  label,
  value,
  html = false,
  emptyLabel = REVIEW_EMPTY_VALUE,
  className = 'md:col-span-2',
}: {
  label: string
  value: string
  html?: boolean
  emptyLabel?: string
  className?: string
}) {
  const trimmed = value.trim()
  const isEmpty = !trimmed

  return (
    <div
      className={[
        'border-b border-border/40 py-3 first:pt-0 last:border-b-0 last:pb-0',
        className,
      ].join(' ')}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {label}
      </dt>
      <dd className="mt-1">
        {isEmpty ? (
          <span className="text-sm italic text-navy-muted">{emptyLabel}</span>
        ) : (
          <div className="max-h-36 overflow-y-auto rounded-lg bg-muted/25 px-3 py-2.5 text-sm leading-relaxed text-navy">
            {html ? <SafeHtmlContent html={trimmed} /> : <p className="whitespace-pre-wrap">{trimmed}</p>}
          </div>
        )}
      </dd>
    </div>
  )
}

function ReviewImageFace({
  label,
  previewUrl,
  previewSource,
  formOptionsLoading,
  hasExisting,
}: {
  label: string
  previewUrl?: string | null
  previewSource: ImagePreviewSource
  formOptionsLoading?: boolean
  hasExisting?: boolean
}) {
  const showPreview =
    formOptionsLoading ||
    Boolean(previewUrl) ||
    previewSource === 'default' ||
    hasExisting

  const stateLabel = formOptionsLoading
    ? 'Loading image preview…'
    : getImageReviewStateLabel(previewSource)

  return (
    <div className="rounded-xl border border-border/60 bg-[#faf8f5] p-3">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {label}
      </p>
      {showPreview ? (
        <div className="mx-auto w-full max-w-[9.5rem] sm:max-w-[10.5rem]">
          <CoinImagePreviewSlot
            previewUrl={previewUrl}
            previewSource={previewSource}
            formOptionsLoading={formOptionsLoading}
            alt={`${label} review`}
            size="catalogue"
            objectFit="contain"
            className="w-full rounded-lg shadow-none"
          />
        </div>
      ) : (
        <p className="py-5 text-center text-sm italic text-navy-muted">{REVIEW_EMPTY_VALUE}</p>
      )}
      <p className="mt-2 text-center text-[11px] leading-snug text-navy-muted">{stateLabel}</p>
      {previewSource === 'default' && previewUrl ? (
        <p className="mt-1 text-center text-[10px] text-navy-muted/80">{REVIEW_DEFAULT_IMAGE_NOTE}</p>
      ) : null}
    </div>
  )
}

function ReviewMintVariantBlock({ row, index }: { row: MintVariantRow; index: number }) {
  const city = getMintMarkLabel(row.mintMarkCode) ?? ''

  return (
    <div className="rounded-lg border border-border/50 bg-[#faf8f5] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        Variant {index + 1}
      </p>
      <div className="mt-2 space-y-0">
        <ReviewDetailRow
          label="Mint mark"
          value={formatMintMarkDisplay(row.mintMarkCode) || row.mintMarkCode}
        />
        <ReviewDetailRow label="Mint city / location" value={city} />
        <ReviewDetailRow label="Variant mintage" value={row.mintMintage} />
        <ReviewTextBlock label="Variant notes" value={row.mintNotes} className="" />
      </div>
    </div>
  )
}

function isStaleTaxonomyValue(
  value: string,
  options: FormOptions['countries'],
  formOptionsReady: boolean,
): boolean {
  const trimmed = value.trim()
  return (
    formOptionsReady &&
    options.length > 0 &&
    Boolean(trimmed) &&
    !isKnownTaxonomyOption(trimmed, options)
  )
}

export function ReviewSubmissionStep({
  values,
  isAdmin = false,
  formOptions = EMPTY_FORM_OPTIONS,
  formOptionsReady = false,
  formOptionsLoading = false,
  duplicateMatches,
  obversePreviewUrl,
  reversePreviewUrl,
  obversePreviewSource = 'none',
  reversePreviewSource = 'none',
  galleryPreviewUrls = [],
  hasExistingObverse = false,
  hasExistingReverse = false,
  existingGalleryUrls = [],
}: ReviewSubmissionStepProps) {
  const hasObverse = Boolean(obversePreviewUrl || hasExistingObverse || obversePreviewSource === 'default')
  const hasReverse = Boolean(reversePreviewUrl || hasExistingReverse || reversePreviewSource === 'default')
  const hasGallery = galleryPreviewUrls.length > 0 || existingGalleryUrls.length > 0

  const completeness = computeCompletenessScore({
    values,
    hasObverse,
    hasReverse,
    hasGallery,
  })

  const mintRows = values.hasMintVariants
    ? values.mintVariants.filter(
        (row) => row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim(),
      )
    : []

  const allGalleryUrls = [...galleryPreviewUrls, ...existingGalleryUrls]
  const galleryCount = allGalleryUrls.length

  const staleTaxonomyWarnings = [
    {
      label: 'Country',
      stale: isStaleTaxonomyValue(values.country, formOptions.countries, formOptionsReady),
    },
    {
      label: 'Denomination',
      stale: isStaleTaxonomyValue(values.denomination, formOptions.values, formOptionsReady),
    },
    {
      label: 'Coin type',
      stale: isStaleTaxonomyValue(values.coin_type, formOptions.types, formOptionsReady),
    },
  ].filter((item) => item.stale)

  return (
    <section className="flex flex-col gap-5 md:gap-6">
      <DuplicateWarningCard matches={duplicateMatches} prominent />

      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5 sm:px-5">
        <p className="text-sm font-medium text-navy">
          Final audit — review every field collected across the wizard before submitting.
        </p>
        <p className="mt-1 text-xs text-navy-muted">
          Use <strong>Back</strong> to edit any step. Empty optional fields show as{' '}
          <span className="italic">{REVIEW_EMPTY_VALUE}</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-navy">Review all details before submitting</p>
        <p className="text-xs font-semibold text-primary">{completeness.score}% catalogue readiness</p>
      </div>

      <CoinCodePreview
        variant="review"
        country={values.country}
        year={values.year}
        denomination={values.denomination}
        coinType={values.coin_type}
        releaseDate={values.released_date}
        countries={formOptions.countries}
      />

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <ReviewSectionCard
          title="Images"
          subtitle="Obverse, reverse, and gallery collected on the Images step"
          className="md:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReviewImageFace
              label="Obverse"
              previewUrl={obversePreviewUrl}
              previewSource={obversePreviewSource}
              formOptionsLoading={formOptionsLoading}
              hasExisting={hasExistingObverse}
            />
            <ReviewImageFace
              label="Reverse"
              previewUrl={reversePreviewUrl}
              previewSource={reversePreviewSource}
              formOptionsLoading={formOptionsLoading}
              hasExisting={hasExistingReverse}
            />
            <div className="rounded-xl border border-border/60 bg-[#faf8f5] p-3 sm:col-span-2 lg:col-span-1">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
                  Gallery
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-navy-muted ring-1 ring-border/60">
                  {galleryCount} {galleryCount === 1 ? 'image' : 'images'}
                </span>
              </div>
              {galleryCount > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  {allGalleryUrls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      className="aspect-square rounded-lg border border-border/60 bg-white object-contain p-1"
                    />
                  ))}
                </div>
              ) : (
                <p className="py-5 text-center text-sm italic text-navy-muted">{REVIEW_EMPTY_VALUE}</p>
              )}
            </div>
          </div>
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Core identity & taxonomy"
          subtitle="Required classification fields from the identity step"
          className="md:col-span-2"
        >
          <ReviewDetailGrid>
            <ReviewDetailRow label="Title" value={values.title} />
            <ReviewDetailRow label="Country" value={values.country} />
            <ReviewDetailRow label="Year" value={values.year} />
            <ReviewDetailRow label="Denomination" value={values.denomination} />
            <ReviewDetailRow label="Coin type" value={values.coin_type} />
            <ReviewDetailRow label="Released date" value={values.released_date} />
            <ReviewDetailRow label="Coin theme" value={values.coin_theme} className="md:col-span-2" />
          </ReviewDetailGrid>
          {staleTaxonomyWarnings.length > 0 ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950"
            >
              <p className="font-semibold">Taxonomy needs attention</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                {staleTaxonomyWarnings.map((item) => (
                  <li key={item.label}>
                    <span className="font-medium">{item.label}:</span> {TAXONOMY_REVIEW_STALE_MESSAGE}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Mint information"
          subtitle="Single mint or multi-mint variant data"
          className="md:col-span-2"
        >
          <ReviewDetailGrid>
            <ReviewDetailRow
              label="Mint status"
              value={formatMintStatusLabel(values.hasMintVariants)}
            />
            <ReviewDetailRow label="Total mintage" value={values.coin_mintage} />
            <ReviewDetailRow
              label="Mint marks available"
              value={values.mintMarksAvailable}
              className="md:col-span-2"
            />
          </ReviewDetailGrid>

          {values.hasMintVariants ? (
            mintRows.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {mintRows.map((row, index) => (
                  <ReviewMintVariantBlock key={`${row.mintMarkCode}-${index}`} row={row} index={index} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm italic text-navy-muted">
                Multiple mint mode enabled — {REVIEW_EMPTY_VALUE.toLowerCase()} for variant rows
              </p>
            )
          ) : (
            <div className="mt-4 rounded-lg border border-border/50 bg-[#faf8f5] px-3 py-3">
              <ReviewDetailGrid>
                <ReviewDetailRow
                  label="Mint mark"
                  value={formatMintMarkDisplay(values.singleMintMark) || values.singleMintMark}
                />
                <ReviewDetailRow
                  label="Mint city / location"
                  value={getMintMarkLabel(values.singleMintMark) ?? ''}
                />
              </ReviewDetailGrid>
            </div>
          )}
        </ReviewSectionCard>

        <ReviewSectionCard title="Specifications" subtitle="Physical and material attributes">
          <ReviewDetailGrid>
            <ReviewDetailRow label="Material" value={values.coin_material} />
            <ReviewDetailRow label="Quality" value={values.coin_quality} />
            <ReviewDetailRow label="Weight (g)" value={values.coin_weight_g} />
            <ReviewDetailRow label="Diameter (mm)" value={values.coin_diameter_mm} />
            <ReviewDetailRow label="Thickness (mm)" value={values.coin_thickness_mm} />
            <ReviewDetailRow
              label="Edge inscription"
              value={values.coin_edge_inscription}
              className="md:col-span-2"
            />
          </ReviewDetailGrid>
        </ReviewSectionCard>

        <ReviewSectionCard title="Descriptions & notes" subtitle="Text content from the descriptions step">
          <ReviewDetailGrid>
            <ReviewTextBlock label="Short description" value={values.short_description} />
            <ReviewTextBlock
              label="Historical background"
              value={values.coin_historical_background}
              html
            />
            <ReviewTextBlock
              label="Obverse description"
              value={values.coin_obverse_description}
              html
            />
            <ReviewTextBlock
              label="Reverse description"
              value={values.coin_reverse_description}
              html
            />
            <ReviewTextBlock label="Collector notes" value={values.coin_collector_notes} html />
          </ReviewDetailGrid>
        </ReviewSectionCard>

        {isAdmin ? (
          <ReviewSectionCard
            title="Status & visibility"
            subtitle="Admin catalogue and record settings"
            className="md:col-span-2"
          >
            <ReviewDetailGrid>
              <ReviewDetailRow
                label="Published in catalogue"
                value={formatStatusBoolean(values.coin_is_published_catalogue)}
              />
              <ReviewDetailRow label="Featured coin" value={formatStatusBoolean(values.coin_is_featured)} />
              <ReviewDetailRow label="App enabled" value={formatStatusBoolean(values.coin_is_app_enabled)} />
              <ReviewDetailRow
                label="Record status"
                value={formatRecordStatusLabel(values.coin_record_status)}
              />
            </ReviewDetailGrid>
          </ReviewSectionCard>
        ) : null}
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
        When ready, use <strong>Submit for review</strong>. WordPress assigns the final coin code
        suffix — the preview above is not sent with your submission.
      </p>
    </section>
  )
}
