import { Check, ChevronRight, Images } from 'lucide-react'
import type { ImagePreviewSource } from '../../lib/imagePreview'
import { getImageWorkspaceStatusLabel } from '../../lib/imagePreview'

export type ImageWorkspaceSummaryProps = {
  obverseUrl?: string | null
  reverseUrl?: string | null
  obverseSource?: ImagePreviewSource
  reverseSource?: ImagePreviewSource
  hasObverse: boolean
  hasReverse: boolean
  galleryCount: number
  onJumpToImages?: () => void
}

function ImageSlot({
  label,
  ready,
  previewUrl,
  source = 'none',
  onJump,
}: {
  label: string
  ready: boolean
  previewUrl?: string | null
  source?: ImagePreviewSource
  onJump?: () => void
}) {
  const statusLabel = getImageWorkspaceStatusLabel(source, ready)
  const statusTone = source === 'default'
    ? 'text-slate-600'
    : ready
      ? 'text-emerald-700'
      : 'text-amber-800'

  const content = (
    <>
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-lg border border-border/60 bg-white object-contain p-0.5 sm:h-10 sm:w-10"
        />
      ) : (
        <span
          aria-hidden="true"
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed sm:h-10 sm:w-10',
            ready ? 'border-emerald-200/80 bg-emerald-50/60' : 'border-border/70 bg-panel/80',
          ].join(' ')}
        >
          {ready ? (
            <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
          ) : (
            <span className="h-2 w-2 rounded-full bg-amber-400/90" />
          )}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-navy">{label}</span>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusTone}`}>
          {ready ? <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
          {statusLabel}
        </span>
      </span>
    </>
  )

  if (onJump) {
    return (
      <button
        type="button"
        onClick={onJump}
        className="inline-flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-page/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={`${label} ${statusLabel.toLowerCase()}. Go to Images step.`}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className="inline-flex min-w-0 items-center gap-2.5 px-1 py-0.5"
      aria-label={`${label} ${statusLabel.toLowerCase()}`}
    >
      {content}
    </div>
  )
}

export function ImageWorkspaceSummary({
  obverseUrl,
  reverseUrl,
  obverseSource = 'none',
  reverseSource = 'none',
  hasObverse,
  hasReverse,
  galleryCount,
  onJumpToImages,
}: ImageWorkspaceSummaryProps) {
  const clampedGalleryCount = Math.max(0, galleryCount)

  return (
    <div
      role="region"
      aria-label="Image workspace summary"
      className="rounded-xl border border-border/60 bg-white/92 px-3 py-2.5 shadow-[var(--shadow-card)] backdrop-blur-sm sm:px-4 sm:py-3"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 md:flex-nowrap md:gap-4">
        <ImageSlot
          label="Obverse"
          ready={hasObverse}
          previewUrl={obverseUrl}
          source={obverseSource}
          onJump={onJumpToImages}
        />
        <span className="hidden h-8 w-px shrink-0 bg-border/50 md:block" aria-hidden />
        <ImageSlot
          label="Reverse"
          ready={hasReverse}
          previewUrl={reverseUrl}
          source={reverseSource}
          onJump={onJumpToImages}
        />
        <span className="hidden h-8 w-px shrink-0 bg-border/50 md:block" aria-hidden />
        <div
          className="inline-flex min-w-0 items-center gap-2.5 px-1 py-0.5"
          aria-label={`Gallery ${clampedGalleryCount} images`}
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-panel/60 sm:h-10 sm:w-10"
          >
            <Images className="h-4 w-4 text-navy-muted" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-navy">Gallery</span>
            <span className="text-[11px] font-medium text-navy-muted">{clampedGalleryCount}</span>
          </span>
        </div>

        {onJumpToImages ? (
          <button
            type="button"
            onClick={onJumpToImages}
            className={[
              'inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors',
              'hover:bg-primary/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              'md:ml-auto',
            ].join(' ')}
          >
            Images
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}
