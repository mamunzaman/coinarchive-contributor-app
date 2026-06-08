import type { CoinSubmissionDetail } from '../../lib/api'
import type { SubmissionDetailImageEditState } from '../../hooks/useSubmissionImageAutosave'
import { SubmissionDetailImages } from './SubmissionDetailImages'
import { SubmissionDetailLivePreview } from './SubmissionDetailLivePreview'
import { SubmissionDetailsTable } from './SubmissionDetailsTable'

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

function AboutSection({ submission }: { submission: CoinSubmissionDetail }) {
  const acf = submission.acf
  const paragraphs = [
    submission.short_description,
    acf?.coin_historical_background,
    acf?.coin_collector_notes,
  ].filter((text) => hasValue(text)) as string[]

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-navy">About this coin</h2>
      {paragraphs.length > 0 ? (
        <div className="mt-4 flex flex-col gap-4">
          {paragraphs.map((text, index) => (
            <p key={index} className="text-base leading-relaxed text-navy">
              {text.trim()}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-navy-muted">
          No description has been added for this coin yet.
        </p>
      )}
    </section>
  )
}

type SubmissionDetailImageEditHandlers = {
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

type SubmissionDetailSectionsProps = {
  submission: CoinSubmissionDetail
  imageEdit: SubmissionDetailImageEditHandlers
}

export function SubmissionDetailSections({
  submission,
  imageEdit,
}: SubmissionDetailSectionsProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
      <SubmissionDetailImages submission={submission} layout="faces" {...imageEdit} />
      <div className="flex flex-col gap-10 lg:gap-12">
        <SubmissionDetailLivePreview submission={submission} editState={imageEdit.editState} />
        <AboutSection submission={submission} />
        <SubmissionDetailsTable submission={submission} />
      </div>
    </div>
  )
}

export type { SubmissionDetailImageEditHandlers }
