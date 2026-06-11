import { Eye, LayoutList, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { CoinSubmission } from '../../lib/api'
import type { CompletenessResult } from '../../lib/completenessScore'
import { CompletionIndicator } from './CompletionIndicator'
import { formatSubmittedDate } from '../../lib/format'
import { canEditSubmission, getSubmissionPreviewUrl } from '../../lib/submissionListUtils'
import { ICON_ACTION, LabeledActionLink } from '../ui/ActionControls'
import { StatusBadge } from '../ui/StatusBadge'

type DashboardRecentSubmissionsProps = {
  submissions: CoinSubmission[]
  completenessById?: Map<number, CompletenessResult>
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function DashboardRecentSubmissions({
  submissions,
  completenessById,
}: DashboardRecentSubmissionsProps) {
  const { t } = useTranslation()

  if (submissions.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="font-serif text-lg font-semibold text-navy sm:text-xl">
            {t('dashboard.recent.title')}
          </h2>
          <p className="mt-1 text-sm text-navy-muted">{t('dashboard.recent.subtitle')}</p>
        </div>
        <Link
          to="/my-submissions"
          className="action-btn-primary inline-flex shrink-0 items-center gap-2"
        >
          <LayoutList className={ICON_ACTION} aria-hidden />
          <span>{t('dashboard.recent.viewAll')}</span>
        </Link>
      </div>
      <ul className="divide-y divide-border/60">
        {submissions.map((submission) => {
          const previewUrl = getSubmissionPreviewUrl(submission)
          const editable = canEditSubmission(submission)
          const detailPath = `/my-submissions/${submission.id}`
          const editPath = `/my-submissions/${submission.id}/edit`
          const completeness = completenessById?.get(submission.id)

          return (
            <li
              key={submission.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-panel">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={`${submission.title} thumbnail`}
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-xl text-primary">
                      ◎
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{submission.title}</p>
                  <p className="mt-0.5 text-sm text-navy-muted">
                    {formatSubmittedDate(submission.date)} · ID {submission.id}
                  </p>
                  {completeness ? (
                    <p className="mt-0.5 text-xs text-navy-muted">
                      <span className="font-medium text-navy">{formatStatusLabel(submission.status)}</span>
                      <span aria-hidden> · </span>
                      <CompletionIndicator variant="compact" result={completeness} showRequired={false} />
                    </p>
                  ) : (
                    <div className="mt-1.5">
                      <StatusBadge status={submission.status} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <LabeledActionLink
                  to={detailPath}
                  label={t('dashboard.recent.view')}
                  icon={Eye}
                  className="action-btn-primary min-h-11 min-w-[4.5rem]"
                />
                {editable ? (
                  <LabeledActionLink
                    to={editPath}
                    label={t('dashboard.recent.edit')}
                    icon={Pencil}
                    className="action-btn-neutral min-h-11 min-w-[4.5rem]"
                  />
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
