import { useTranslation } from 'react-i18next'
import type { AdminSubmissionListItem } from '../../lib/adminApi'
import { getAdminQueueSeoStatus } from '../../lib/adminQueueSeo'

type AdminQueueSeoBadgeProps = {
  submission: AdminSubmissionListItem
}

export function AdminQueueSeoBadge({ submission }: AdminQueueSeoBadgeProps) {
  const { t } = useTranslation()
  const status = getAdminQueueSeoStatus(submission)

  const toneClass =
    status.tone === 'good'
      ? 'admin-queue-badge--seo-good'
      : status.tone === 'warn'
        ? 'admin-queue-badge--seo-warn'
        : status.tone === 'missing'
          ? 'admin-queue-badge--seo-missing'
          : 'admin-queue-badge--seo-neutral'

  const label = t(status.labelKey, status.labelParams)

  return (
    <span
      className={['admin-queue-badge', toneClass].join(' ')}
      title={label}
      aria-label={label}
    >
      <span className="truncate">{label}</span>
    </span>
  )
}
