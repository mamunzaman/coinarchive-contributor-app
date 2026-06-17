import type { AccountActivityEvent } from '../services/profileApi'

const PASSWORD_EVENT_PATTERN = /password/i

export function isPasswordRelatedActivityEvent(event: AccountActivityEvent): boolean {
  const haystack = `${event.type} ${event.title} ${event.description}`.trim()
  return PASSWORD_EVENT_PATTERN.test(haystack)
}

export function findLatestPasswordActivityEvent(
  events: AccountActivityEvent[],
): AccountActivityEvent | null {
  const passwordEvents = events.filter(isPasswordRelatedActivityEvent)
  if (passwordEvents.length === 0) {
    return null
  }

  return [...passwordEvents].sort((left, right) => {
    const leftTime = Date.parse(left.date)
    const rightTime = Date.parse(right.date)
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime
    }
    return 0
  })[0]
}
