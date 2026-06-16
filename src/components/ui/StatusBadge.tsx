import {
  AlertCircle,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getSubmissionStatusLabelKey,
  normalizeSubmissionStatus,
} from '../../lib/submissionStatus'

type StatusBadgeProps = {
  status: string
}

function getStatusMeta(status: string): { classes: string; icon: LucideIcon } {
  const normalized = normalizeSubmissionStatus(status)

  if (normalized === 'approved') {
    return {
      classes: 'bg-primary/10 text-primary-hover ring-1 ring-primary/25',
      icon: CheckCircle2,
    }
  }

  if (normalized === 'rejected') {
    return {
      classes: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      icon: AlertCircle,
    }
  }

  if (normalized === 'needs_revision') {
    return {
      classes: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
      icon: AlertCircle,
    }
  }

  if (normalized === 'draft') {
    return {
      classes: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
      icon: Clock,
    }
  }

  return {
    classes: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    icon: Clock,
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation()
  const { classes, icon: Icon } = getStatusMeta(status)
  const label = t(getSubmissionStatusLabelKey(status))

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        classes,
      ].join(' ')}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  )
}
