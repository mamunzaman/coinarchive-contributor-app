import { Bell, CheckCircle2, FilePenLine, Info, TriangleAlert, XCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type {
  ContributorNotification,
  ContributorNotificationSeverity,
} from '../../lib/notifications'
import { Card } from '../ui/Card'

type DashboardNotificationCenterProps = {
  notifications: ContributorNotification[]
  readIds: Set<string>
  isLoading?: boolean
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

type DashboardNotificationBellProps = {
  notifications: ContributorNotification[]
  readIds: Set<string>
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
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
  readIds,
  isLoading = false,
  onMarkRead,
  onMarkAllRead,
}: DashboardNotificationCenterProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleNotifications = showAll ? notifications : notifications.slice(0, 5)
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.has(notification.id)).length,
    [notifications, readIds],
  )

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
            onClick={onMarkAllRead}
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
                    onClick={() => onMarkRead(notification.id)}
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

export function DashboardNotificationBell({
  notifications,
  readIds,
  onMarkRead,
  onMarkAllRead,
}: DashboardNotificationBellProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length
  const latestNotifications = notifications.slice(0, 5)

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex min-h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-navy transition-colors hover:border-primary/30 hover:bg-primary/5"
        aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Latest notifications"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-white p-3 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <p className="font-serif text-base font-semibold text-navy">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-semibold text-primary hover:text-primary-hover"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          {latestNotifications.length === 0 ? (
            <p className="rounded-xl bg-page px-3 py-4 text-sm text-navy-muted">No notifications yet.</p>
          ) : (
            <ul className="max-h-[22rem] divide-y divide-border/60 overflow-auto">
              {latestNotifications.map((notification) => {
                const isRead = readIds.has(notification.id)

                return (
                  <li key={notification.id} className="py-1.5">
                    <Link
                      to={notification.href}
                      onClick={() => {
                        onMarkRead(notification.id)
                        setOpen(false)
                      }}
                      className={[
                        'flex min-w-0 items-start gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-page',
                        isRead ? 'opacity-75' : '',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1',
                          getSeverityClasses(notification.severity),
                        ].join(' ')}
                      >
                        <NotificationIcon notification={notification} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          {!isRead ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread notification" />
                          ) : null}
                          <span className="truncate text-sm font-semibold text-navy">{notification.title}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-navy-muted">
                          {notification.message}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-navy-muted">
                          {notification.formattedDate}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

