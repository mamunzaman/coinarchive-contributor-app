export function formatSubmittedDate(date: string): string {
  const parsed = new Date(date.includes('T') ? date : date.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatActivityDateTime(
  date: string | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (!date?.trim()) {
    return fallback
  }

  const parsed = new Date(date.includes('T') ? date : date.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed.toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
