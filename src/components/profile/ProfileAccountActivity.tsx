import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  MonitorSmartphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ApiError,
  getAccountActivity,
  type AccountActivityEvent,
  type AccountActivityEventSeverity,
  type AccountActivityResponse,
  type AccountActivitySession,
} from '../../lib/api'
import { formatActivityDateTime } from '../../lib/format'
import { Card } from '../ui/Card'
import { RoleBadge } from '../ui/RoleBadge'
import { StatusBadge } from '../ui/StatusBadge'

type ProfileAccountActivityProps = {
  token: string | null
}

function resolveSummaryRole(role: string): 'admin' | 'contributor' {
  return role.trim().toLowerCase() === 'admin' ? 'admin' : 'contributor'
}

function getSeverityMeta(severity: AccountActivityEventSeverity): {
  icon: LucideIcon
  badgeClass: string
} {
  switch (severity) {
    case 'success':
      return {
        icon: CheckCircle2,
        badgeClass: 'bg-primary/10 text-primary-hover ring-1 ring-primary/25',
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
      }
    case 'danger':
      return {
        icon: AlertCircle,
        badgeClass: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      }
    default:
      return {
        icon: Info,
        badgeClass: 'bg-muted text-navy-muted ring-1 ring-border/70',
      }
  }
}

function AccountActivitySkeleton() {
  return (
    <Card className="profile-page__activity-card" aria-busy="true" aria-live="polite">
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-panel" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-panel" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-xl bg-panel" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl bg-panel" />
          <div className="h-40 animate-pulse rounded-xl bg-panel" />
        </div>
      </div>
    </Card>
  )
}

function SummaryChip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="profile-page__activity-chip rounded-xl border border-border/60 bg-panel/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
      <div className="mt-1.5 text-sm font-semibold text-navy">{children}</div>
    </div>
  )
}

function ActivitySeverityBadge({ severity }: { severity: AccountActivityEventSeverity }) {
  const { t } = useTranslation()
  const { badgeClass } = getSeverityMeta(severity)

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        badgeClass,
      ].join(' ')}
    >
      {t(`profile.activity.severity.${severity}`)}
    </span>
  )
}

function ActivityEventItem({
  event,
  locale,
  dateFallback,
}: {
  event: AccountActivityEvent
  locale: string
  dateFallback: string
}) {
  const { icon: Icon, badgeClass } = getSeverityMeta(event.severity)
  const formattedDate = formatActivityDateTime(event.date, locale, dateFallback)

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span
        className={[
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          badgeClass,
        ].join(' ')}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-medium text-navy">{event.title}</p>
          <ActivitySeverityBadge severity={event.severity} />
        </div>
        {event.description ? (
          <p className="mt-1 text-sm leading-relaxed text-navy-muted">{event.description}</p>
        ) : null}
        <p className="mt-1.5 text-xs text-navy-muted">
          <time dateTime={event.date || undefined}>{formattedDate}</time>
        </p>
      </div>
    </li>
  )
}

function ActivitySessionItem({
  session,
  locale,
  dateFallback,
}: {
  session: AccountActivitySession
  locale: string
  dateFallback: string
}) {
  const { t } = useTranslation()

  return (
    <li className="rounded-xl border border-border/60 bg-panel/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-navy-muted" aria-hidden />
          <p className="text-sm font-medium text-navy">{session.label}</p>
        </div>
        {session.is_current ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-hover ring-1 ring-primary/25">
            {t('profile.activity.currentSession')}
          </span>
        ) : null}
      </div>
      <dl className="mt-2 space-y-1 text-xs text-navy-muted">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
          <dt>{t('profile.activity.created')}</dt>
          <dd className="font-medium text-navy">
            {formatActivityDateTime(session.created_at, locale, dateFallback)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
          <dt>{t('profile.activity.lastSeen')}</dt>
          <dd className="font-medium text-navy">
            {formatActivityDateTime(session.last_seen_at, locale, dateFallback)}
          </dd>
        </div>
      </dl>
    </li>
  )
}

function AccountActivityContent({ data }: { data: AccountActivityResponse }) {
  const { t, i18n } = useTranslation()
  const sectionId = useId()
  const locale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US'
  const dateFallback = t('profile.activity.notAvailable')
  const summaryRole = resolveSummaryRole(data.summary.role)

  return (
    <Card className="profile-page__activity-card" aria-labelledby={sectionId}>
      <div className="space-y-5">
        <div>
          <h2 id={sectionId} className="font-serif text-lg font-semibold text-navy">
            {t('profile.activity.title')}
          </h2>
          <p className="mt-1 text-sm text-navy-muted">{t('profile.activity.subtitle')}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryChip label={t('profile.activity.activeSessions')}>
            <span className="tabular-nums">{data.summary.active_sessions}</span>
          </SummaryChip>
          <SummaryChip label={t('profile.activity.accountStatus')}>
            {data.summary.account_status ? (
              <StatusBadge status={data.summary.account_status} />
            ) : (
              dateFallback
            )}
          </SummaryChip>
          <SummaryChip label={t('profile.activity.role')}>
            {data.summary.role ? (
              <RoleBadge role={summaryRole} />
            ) : (
              dateFallback
            )}
          </SummaryChip>
          <SummaryChip label={t('profile.activity.emailVerified')}>
            {data.summary.email_verified
              ? t('profile.activity.verified')
              : t('profile.activity.notVerified')}
          </SummaryChip>
        </div>

        <div className="profile-page__activity-columns grid gap-5 lg:grid-cols-2">
          <section aria-labelledby={`${sectionId}-events`}>
            <h3 id={`${sectionId}-events`} className="text-sm font-semibold text-navy">
              {t('profile.activity.eventsTitle')}
            </h3>
            {data.events.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border/70 bg-panel/30 px-4 py-5 text-sm text-navy-muted">
                {t('profile.activity.noEvents')}
              </p>
            ) : (
              <ol className="mt-3 space-y-0">
                {data.events.map((event) => (
                  <ActivityEventItem
                    key={event.id}
                    event={event}
                    locale={locale}
                    dateFallback={dateFallback}
                  />
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby={`${sectionId}-sessions`}>
            <h3 id={`${sectionId}-sessions`} className="text-sm font-semibold text-navy">
              {t('profile.activity.sessionsTitle')}
            </h3>
            {data.sessions.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border/70 bg-panel/30 px-4 py-5 text-sm text-navy-muted">
                {t('profile.activity.noSessions')}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.sessions.map((session) => (
                  <ActivitySessionItem
                    key={session.id}
                    session={session}
                    locale={locale}
                    dateFallback={dateFallback}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Card>
  )
}

export function ProfileAccountActivity({ token }: ProfileAccountActivityProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AccountActivityResponse | null>(null)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      setError(t('profile.activity.loadFailed'))
      setData(null)
      return
    }

    const activeToken = token
    if (!activeToken) {
      setIsLoading(false)
      setError(t('profile.activity.loadFailed'))
      setData(null)
      return
    }

    let cancelled = false

    async function loadActivity() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getAccountActivity(activeToken)
        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setError(t('dashboard.sessionExpired'))
          } else {
            setError(t('profile.activity.loadFailed'))
          }
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadActivity()

    return () => {
      cancelled = true
    }
  }, [token, t])

  if (isLoading) {
    return <AccountActivitySkeleton />
  }

  if (error || !data) {
    return (
      <Card className="profile-page__activity-card profile-page__activity-card--warning" role="alert">
        <p className="text-sm font-medium text-amber-900">{error ?? t('profile.activity.loadFailed')}</p>
      </Card>
    )
  }

  return <AccountActivityContent data={data} />
}
