/**
 * AdminCoinPreviewLayout
 * Renders the main body of the admin submission detail in a public editorial style,
 * mirroring the look of the live public coin detail page.
 * Image-editing controls are passed through but placed in a secondary admin section.
 */
import type { CoinSubmissionDetail } from '../../lib/api'
import { SafeHtmlContent } from '../ui/SafeHtmlContent'
import { SubmissionDetailImages } from '../coin/SubmissionDetailImages'
import { SubmissionMintInfo } from '../coin/SubmissionMintInfo'
import { SubmissionRevisionNotes } from '../coin/SubmissionRevisionNotes'
import { SubmissionRevisionComparison } from '../coin/SubmissionRevisionComparison'
import { SubmissionAdminInfo } from '../coin/SubmissionAdminInfo'
import type { SubmissionDetailImageEditState } from '../../hooks/useSubmissionImageAutosave'
import type { CoinFormValues } from '../../types/coinForm'

type ImageEditHandlers = {
  canEdit: boolean
  editState: SubmissionDetailImageEditState
  footerStatus: 'saved' | 'saving' | 'failed'
  onStartEdit: () => void
  onFinishEdit: () => void
  onObverseChange: (file: File | null) => void
  onReverseChange: (file: File | null) => void
  onGalleryAdd: (files: File[]) => void
  onGalleryRemove: (imageId: number) => void
  onUndoGalleryRemove: (imageId: number) => void
  onRetryObverse: () => void
  onRetryReverse: () => void
  onRevertObverse: () => void
  onRevertReverse: () => void
  onRetryGalleryUpload: (clientId: string) => void
  onDismissFailedGalleryUpload: (clientId: string) => void
  onGalleryReplace: (imageId: number, file: File) => void
  onCancelGalleryReplace: (imageId: number) => void
  onRetryGalleryReplace: (imageId: number) => void
  onGalleryPermanentDelete: (imageId: number) => void
  allowGalleryPermanentDelete?: boolean
}

type AdminCoinPreviewLayoutProps = {
  submission: CoinSubmissionDetail
  imageEdit: ImageEditHandlers
  hasRevisionNotes: boolean
  baselineValues: CoinFormValues | null
  editDraftValues?: CoinFormValues | null
  galleryChanged: boolean
  obverseDraftFile?: boolean
  reverseDraftFile?: boolean
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function CoinFaceImage({
  label,
  shortLabel,
  url,
}: {
  label: string
  shortLabel: string
  url?: string | null
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-lg font-semibold text-slate-300">{shortLabel}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        {url ? (
          <img
            src={url}
            alt={label}
            className="mx-auto block max-h-64 w-full max-w-[280px] object-contain p-4"
          />
        ) : (
          <div className="flex h-48 items-center justify-center text-slate-200">
            <span className="font-serif text-6xl">◎</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CoinDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5">
      <dt className="shrink-0 text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="text-right text-sm text-slate-700">{value}</dd>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminCoinPreviewLayout({
  submission,
  imageEdit,
  hasRevisionNotes,
  baselineValues,
  editDraftValues,
  galleryChanged,
  obverseDraftFile,
  reverseDraftFile,
}: AdminCoinPreviewLayoutProps) {
  const acf = submission.acf
  const obverseUrl = submission.images.obverse?.url ?? null
  const reverseUrl = submission.images.reverse?.url ?? null
  const galleryImages = submission.images.gallery ?? []
  const yearStr = submission.year ? String(submission.year) : null

  const shortDescription = submission.short_description?.trim()
  const historicalBackground = acf?.coin_historical_background?.trim()
  const collectorNotes = acf?.coin_collector_notes?.trim()

  // Coin details table rows — only show if value exists
  const detailRows: Array<{ label: string; value: string }> = [
    submission.country?.trim() ? { label: 'Country of issue', value: submission.country } : null,
    yearStr ? { label: 'Year', value: yearStr } : null,
    submission.denomination?.trim() ? { label: 'Denomination', value: submission.denomination } : null,
    submission.coin_type?.trim() ? { label: 'Coin type', value: submission.coin_type } : null,
    acf?.coin_theme?.trim() ? { label: 'Theme', value: acf.coin_theme } : null,
    acf?.coin_mintage?.trim() ? { label: 'Mintage', value: acf.coin_mintage } : null,
    acf?.coin_material?.trim() ? { label: 'Material', value: acf.coin_material } : null,
    acf?.coin_weight_g ? { label: 'Weight', value: `${acf.coin_weight_g} g` } : null,
    acf?.coin_diameter_mm ? { label: 'Diameter', value: `${acf.coin_diameter_mm} mm` } : null,
    acf?.coin_code?.trim() ? { label: 'Coin code', value: acf.coin_code } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <div className="min-w-0">

      {/* ── 1. Hero ── */}
      <div className="border-b border-slate-100 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="min-w-0 flex-1 font-serif text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl lg:text-[1.9rem]">
            {submission.title}
          </h1>
          {yearStr ? (
            <p
              className="shrink-0 font-serif text-5xl font-semibold tabular-nums text-slate-200 sm:text-6xl"
              aria-label={`Year ${yearStr}`}
            >
              {yearStr}
            </p>
          ) : null}
        </div>

        {/* Meta chips row */}
        {detailRows.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              submission.country,
              submission.coin_type,
              submission.denomination,
            ]
              .filter(Boolean)
              .map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {chip}
                </span>
              ))}
          </div>
        ) : null}
      </div>

      {/* ── 2. Obverse / Reverse + About ── */}
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.3fr] md:gap-10">

        {/* LEFT — coin faces, editorial style */}
        <div className="flex flex-col gap-6">
          <CoinFaceImage label="Obverse" shortLabel="O" url={obverseUrl} />
          <CoinFaceImage label="Reverse" shortLabel="R" url={reverseUrl} />
        </div>

        {/* RIGHT — about + coin details */}
        <div className="flex flex-col gap-6">
          {shortDescription ? (
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-800">About this coin</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{shortDescription}</p>
              {collectorNotes ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-500 italic">{collectorNotes}</p>
              ) : null}
            </div>
          ) : null}

          {detailRows.length > 0 ? (
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-800">Coin Details</h2>
              <dl className="mt-3">
                {detailRows.map((row) => (
                  <CoinDetailRow key={row.label} label={row.label} value={row.value} />
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── 3. Historical Background (full-width editorial section) ── */}
      {historicalBackground ? (
        <div className="mt-10 border-t border-slate-100 pt-8">
          <h2 className="font-serif text-xl font-semibold text-slate-800">Historical Background</h2>
          <div className="prose prose-sm mt-4 max-w-none text-slate-600">
            <SafeHtmlContent html={historicalBackground} />
          </div>
        </div>
      ) : (
        <div className="mt-10 border-t border-slate-100 pt-8">
          <h2 className="font-serif text-xl font-semibold text-slate-800">Historical Background</h2>
          <p className="mt-3 text-sm text-slate-400">No historical background provided.</p>
        </div>
      )}

      {/* ── 4. Gallery (compact, secondary) ── */}
      {galleryImages.length > 0 ? (
        <div className="mt-10 border-t border-slate-100 pt-8">
          <h2 className="font-serif text-xl font-semibold text-slate-800">Gallery</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {galleryImages.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <img
                  src={image.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── 5. Mint Variants (tinted band) ── */}
      {acf ? (
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Mint information
            </h2>
          </div>
          <div className="p-5">
            <SubmissionMintInfo acf={acf} />
          </div>
        </div>
      ) : null}

      {/* ── 6. Admin-only: revision notes + comparison ── */}
      {hasRevisionNotes ? (
        <div className="mt-8">
          <SubmissionRevisionNotes submission={submission} />
        </div>
      ) : null}

      {hasRevisionNotes && baselineValues ? (
        <div className="mt-4">
          <SubmissionRevisionComparison
            previousValues={baselineValues}
            currentValues={editDraftValues ?? baselineValues}
            imageChanges={{
              obverseChanged: Boolean(obverseDraftFile),
              reverseChanged: Boolean(reverseDraftFile),
              galleryChanged,
            }}
          />
        </div>
      ) : null}

      {/* ── 7. Admin-only: image editing controls ── */}
      {imageEdit.canEdit ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-amber-50/60 px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700">
              Admin · Edit images
            </p>
          </div>
          <div className="p-5">
            <SubmissionDetailImages
              submission={submission}
              layout="gallery"
              {...imageEdit}
            />
            <SubmissionDetailImages
              submission={submission}
              layout="actions"
              {...imageEdit}
            />
          </div>
        </div>
      ) : null}

      {/* ── 8. Admin notes ── */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white" id="review-admin">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Admin notes
          </h2>
        </div>
        <div className="p-5">
          <SubmissionAdminInfo acf={acf} />
        </div>
      </div>

    </div>
  )
}
