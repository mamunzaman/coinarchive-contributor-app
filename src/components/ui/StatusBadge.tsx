type StatusBadgeProps = {
  status: string
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isPositive = status === 'approved' || status === 'publish' || status === 'published'
  const isRejected =
    status === 'rejected' || status === 'trash' || status === 'failed' || status === 'declined'

  let classes =
    'bg-amber-50 text-amber-800 ring-1 ring-amber-200'

  if (isPositive) {
    classes = 'bg-primary/10 text-primary-hover ring-1 ring-primary/25'
  } else if (isRejected) {
    classes = 'bg-red-50 text-red-700 ring-1 ring-red-200'
  }

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        classes,
      ].join(' ')}
    >
      {formatStatus(status)}
    </span>
  )
}
