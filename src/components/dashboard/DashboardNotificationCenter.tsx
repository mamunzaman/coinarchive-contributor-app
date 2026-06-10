import { Bell, CheckCircle2, FilePenLine, Info, TriangleAlert, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type {
  ContributorNotification,
  ContributorNotificationSeverity,
} from '../../lib/notifications'
import { Card } from '../ui/Card'

const READ_NOTIFICATIONS_KEY = 'caes_read_notifications'

type DashboardNotificationCenterProps = {
  notifications: ContributorNotification[]
  isLoading?: boolean
}

function readStoredNotificationIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeStoredNotificationIds(ids: string[]) {
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids))
}

function getSeverityClasses(severity: ContributorNotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'bg-primary/10 text-primary ring-primary/20'
    case 'warning':
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 'danger':
      return 'bg-red-50 text-red-700 ring-red-200'
    case 'info':
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

function NotificationIcon({ notification }: { notification: ContributorNotification }) {
  const className = 'h-4 w-4'

  if (notification.severity === 'success') {
    return <CheckCircle2 className={className} aria-hidden />
  }

  if (notification.severity === 'danger') {
    return <XCircle className={className} aria-hidden />
  }

  if (notification.severity === 'warning') {
    return <TriangleAlert className={className} aria-hidden />
  }

  if (notification.type === 'draft') {
    return <FilePenLine className={className} aria-hidden />
  }

  return <Info className={className} aria-hidden />
}

export function DashboardNotificationCenter({
  notifications,
  isLoading = false,
}: DashboardNotificationCenterProps) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(readStoredNotificationIds()))
  const [showAll, setShowAll] = useState(false)
  const visibleNotifications = showAll ? notifications : notifications.slice(0, 5)
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.has(notification.id)).length,
    [notifications, readIds],
  )

  useEffect(() => {
    writeStoredNotificationIds([...readIds])
  }, [readIds])

  function markRead(id: string) {
    setReadIds((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  function markAllRead() {
    setReadIds(new Set(notifications.map((notification) => notification.id)))
  }

  return (
    <Card className="!p-4 sm:!p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" aria-hidden />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
                {unreadCount}
              </span>
            ) : null}
          </span>
          <div>
            <h2 className="font-serif text-base font-semibold text-navy sm:text-lg">
              Notification Center
            </h2>
            <p className="text-sm text-navy-muted">Important updates from your submissions.</p>
          </div>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-navy transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-14 animate-pulse rounded-xl bg-panel" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border/60 bg-page px-3 py-4 text-sm text-navy-muted">
          No notifications yet.
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border/60">
            {visibleNotifications.map((notification) => {
              const isRead = readIds.has(notification.id)

              return (
                <li key={notification.id} className="py-2.5">
                  <Link
                    to={notification.href}
                    onClick={() => markRead(notification.id)}
                    className={[
                      'flex min-w-0 items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-page',
                      isRead ? 'opacity-75' : '',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1',
                        getSeverityClasses(notification.severity),
                      ].join(' ')}
                    >
                      <NotificationIcon notification={notification} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        {!isRead ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread notification" />
                        ) : null}
                        <span className="truncate text-sm font-semibold text-navy">
                          {notification.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-navy-muted">
                        {notification.message}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-navy-muted">
                      {notification.formattedDate}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {notifications.length > 5 ? (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              {showAll ? 'Show latest 5' : `View all (${notifications.length})`}
            </button>
          ) : null}
        </>
      )}
    </Card>
  )
}

