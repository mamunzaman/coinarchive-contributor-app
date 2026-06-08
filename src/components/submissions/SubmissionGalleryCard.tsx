import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { CoinSubmission } from '../../lib/api'
import { formatSubmittedDate } from '../../lib/format'
import {
  canDeleteSubmission,
  canEditSubmission,
  getSubmissionPreviewUrl,
} from '../../lib/submissionListUtils'
import {
  LabeledActionButton,
  LabeledActionLink,
} from '../ui/ActionControls'
import { StatusBadge } from '../ui/StatusBadge'

type SubmissionGalleryCardProps = {
  submission: CoinSubmission
  onDelete?: (submission: CoinSubmission) => void
}

export function SubmissionGalleryCard({ submission, onDelete }: SubmissionGalleryCardProps) {
  const previewUrl = getSubmissionPreviewUrl(submission)
  const editable = canEditSubmission(submission)
  const deletable = canDeleteSubmission(submission)
  const detailPath = `/my-submissions/${submission.id}`
  const editPath = `/my-submissions/${submission.id}/edit`

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-panel sm:aspect-[4/3]">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 font-serif text-2xl text-primary shadow-sm">
              ◎
            </span>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">No preview</p>
          </div>
        )}
        <div className="absolute right-3 top-3">
          <StatusBadge status={submission.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-muted">
            Post ID · {submission.id}
          </p>
          <h2 className="mt-1 line-clamp-2 font-serif text-lg font-semibold leading-snug text-navy">
            {submission.title}
          </h2>
        </div>

        <p className="text-sm text-navy-muted">Submitted {formatSubmittedDate(submission.date)}</p>

        <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <LabeledActionLink to={detailPath} label="View" icon={Eye} />
            {editable ? (
              <LabeledActionLink
                to={editPath}
                label="Edit"
                icon={Pencil}
                className="action-btn-neutral min-h-11 flex-1"
              />
            ) : null}
          </div>
          {deletable && onDelete ? (
            <LabeledActionButton
              label="Delete"
              icon={Trash2}
              variant="danger"
              className="w-full"
              onClick={() => onDelete(submission)}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}
