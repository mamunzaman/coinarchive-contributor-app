import { Pencil, Sparkles } from 'lucide-react'
import { DuplicateWarningCard } from './DuplicateWarningCard'
import { SafeHtmlContent } from '../ui/SafeHtmlContent'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { computeCompletenessScore } from '../../lib/completenessScore'
import type { DuplicateCheckStatus } from '../../lib/duplicateCheck'
import type { DuplicateMatch } from '../../lib/duplicateDetection'
import { formatRecordStatusLabel, formatStatusBoolean } from '../../lib/revisionComparison'
import { formatMintMarkDisplay, type CoinFormValues } from '../../types/coinForm'
import type { ImagePreviewSource } from '../../lib/imagePreview'
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
  duplicateCheckStatus?: DuplicateCheckStatus
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
  titleManualOverride?: boolean
  titleError?: string
  onTitleChange?: (value: string) => void
  onRegenerateTitle?: () => void
  disabled?: boolean
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

function DetailHtmlRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) {
    return null
  }

  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-navy-muted">{label}</dt>
      <dd className="mt-1 text-sm text-navy">
        <SafeHtmlContent html={value} />
      </dd>
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

type CoinTitleSourceValues = CoinFormValues & {
  commemorative_subject?: string
  coin_name?: string
  theme?: string
  series?: string
  description?: string
}

function getTitleSourceFields(values: CoinFormValues): string[] {
  const source = values as CoinTitleSourceValues
  const fields = [
    { label: 'Country', value: values.country },
    { label: 'Year', value: values.year },
    { label: 'Denomination', value: values.denomination },
    { label: 'Coin Type', value: values.coin_type },
  ].filter((field) => field.value.trim())

  const hasSubject = [
    source.commemorative_subject,
    source.coin_name,
    source.theme,
    values.coin_theme,
    source.series,
    source.description,
    values.short_description,
  ].some((value) => value?.trim())

  return hasSubject ? [...fields.map((field) => field.label), 'Theme'] : fields.map((field) => field.label)
}

export function ReviewSubmissionStep({
  values,
  isAdmin = false,
  formOptions = EMPTY_FORM_OPTIONS,
  formOptionsReady = false,
  duplicateCheckStatus = 'clear',
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
  titleManualOverride = false,
  titleError,
  onTitleChange,
  onRegenerateTitle,
  disabled = false,
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
            `${formatMintMarkDisplay(row.mintMarkCode) || '—'} · mintage ${row.mintMintage || '—'}${row.mintNotes ? ` · ${row.mintNotes}` : ''}`,
        )
        .join('; ')
    : values.singleMintMark.trim()

  const allGalleryUrls = [...galleryPreviewUrls, ...existingGalleryUrls]
  const titleSourceFields = getTitleSourceFields(values)

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
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-xl border border-border/60 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <h3 className="font-serif text-base font-semibold text-navy sm:text-lg">SEO Post Title</h3>
                <span
                  className={[
                    'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:text-xs',
                    titleManualOverride
                      ? 'bg-amber-50 text-amber-950 ring-1 ring-amber-200'
                      : 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200',
                  ].join(' ')}
                >
                  {titleManualOverride ? (
                    <Pencil className="size-3 shrink-0" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-3 shrink-0" aria-hidden="true" />
                  )}
                  {titleManualOverride ? 'Manually edited' : 'Auto-generated'}
                </span>
                {titleManualOverride ? (
                  <span className="text-[11px] text-navy-muted sm:text-xs">Custom title</span>
                ) : null}
              </div>
              {titleSourceFields.length > 0 ? (
                <p className="mt-1.5 text-[11px] leading-snug text-navy-muted sm:text-xs">
                  <span className="font-medium text-navy-muted/90">Generated from:</span>{' '}
                  {titleSourceFields.join(' • ')}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-navy-muted sm:text-xs">
                Used as the page title and search engine title.
              </p>
            </div>
            {titleManualOverride && onRegenerateTitle ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onRegenerateTitle}
                disabled={disabled}
                className="w-full shrink-0 px-2.5 py-1.5 text-xs lg:w-auto"
              >
                Reset to Auto Title
              </Button>
            ) : null}
          </div>
          <div className="mt-2">
            <TextField
              label="Post title"
              name="post_title"
              value={values.title}
              onChange={(event) => onTitleChange?.(event.target.value)}
              error={titleError}
              disabled={disabled || !onTitleChange}
              className="px-3 py-2 text-base font-semibold text-navy"
              required
            />
          </div>
        </div>

        <DuplicateWarningCard matches={duplicateMatches} status={duplicateCheckStatus} prominent />
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-sm font-medium text-navy">Review your submission before sending for archive review.</p>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-navy">Images</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-muted">Obverse</p>
            {formOptionsLoading || obversePreviewUrl || obversePreviewSource === 'default' || hasExistingObverse ? (
              <>
                <CoinImagePreviewSlot
                  previewUrl={obversePreviewUrl}
                  previewSource={obversePreviewSource}
                  formOptionsLoading={formOptionsLoading}
                  alt="Obverse review"
                  size="catalogue"
                  objectFit="contain"
                  className="w-full rounded-xl shadow-none"
                />
                {obversePreviewSource === 'default' && obversePreviewUrl ? (
                  <p className="mt-1.5 text-xs text-navy-muted">WordPress default (not uploaded from this form)</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-navy-muted">No obverse image</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-muted">Reverse</p>
            {formOptionsLoading || reversePreviewUrl || reversePreviewSource === 'default' || hasExistingReverse ? (
              <>
                <CoinImagePreviewSlot
                  previewUrl={reversePreviewUrl}
                  previewSource={reversePreviewSource}
                  formOptionsLoading={formOptionsLoading}
                  alt="Reverse review"
                  size="catalogue"
                  objectFit="contain"
                  className="w-full rounded-xl shadow-none"
                />
                {reversePreviewSource === 'default' && reversePreviewUrl ? (
                  <p className="mt-1.5 text-xs text-navy-muted">WordPress default (not uploaded from this form)</p>
                ) : null}
              </>
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
        <h3 className="font-serif text-lg font-semibold text-navy">Taxonomy</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailRow label="Country" value={values.country} />
          <DetailRow label="Denomination" value={values.denomination} />
          <DetailRow label="Coin type" value={values.coin_type} />
        </dl>
        {staleTaxonomyWarnings.length > 0 ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p className="font-semibold">Taxonomy needs attention</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {staleTaxonomyWarnings.map((item) => (
                <li key={item.label}>
                  <span className="font-medium">{item.label}:</span> {TAXONOMY_REVIEW_STALE_MESSAGE}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-navy">Coin details</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailRow label="Year" value={values.year} />
          <DetailRow label="Theme" value={values.coin_theme} />
          <DetailRow label="Released date" value={values.released_date} />
          <DetailRow label="Quality" value={values.coin_quality} />
        </dl>
      </div>

      {mintSummary ? (
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy">Mint information</h3>
          <p className="mt-2 text-sm text-navy">{mintSummary}</p>
        </div>
      ) : null}

      {isAdmin ? (
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy">Status & visibility</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailRow
              label="Published in catalogue"
              value={formatStatusBoolean(values.coin_is_published_catalogue)}
            />
            <DetailRow label="Featured coin" value={formatStatusBoolean(values.coin_is_featured)} />
            <DetailRow label="App enabled" value={formatStatusBoolean(values.coin_is_app_enabled)} />
            <DetailRow
              label="Record status"
              value={formatRecordStatusLabel(values.coin_record_status)}
            />
          </dl>
        </div>
      ) : null}

      <div>
        <h3 className="font-serif text-lg font-semibold text-navy">Description</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-navy">
          {values.short_description || 'No short description provided.'}
        </p>
      </div>

      {values.coin_historical_background.trim() ? (
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy">Historical background</h3>
          <div className="mt-2 text-sm text-navy">
            <SafeHtmlContent html={values.coin_historical_background} />
          </div>
        </div>
      ) : null}

      {(values.coin_obverse_description.trim() ||
        values.coin_reverse_description.trim() ||
        values.coin_collector_notes.trim()) ? (
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy">Additional notes</h3>
          <dl className="mt-4 grid gap-4">
            <DetailHtmlRow label="Obverse" value={values.coin_obverse_description} />
            <DetailHtmlRow label="Reverse" value={values.coin_reverse_description} />
            <DetailHtmlRow label="Collector notes" value={values.coin_collector_notes} />
          </dl>
        </div>
      ) : null}

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
