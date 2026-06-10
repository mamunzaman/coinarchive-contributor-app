import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardActivityCenter } from '../components/dashboard/DashboardActivityCenter'
import { DashboardQualityAlerts } from '../components/dashboard/DashboardQualityAlerts'
import { DashboardSavedDrafts } from '../components/dashboard/DashboardSavedDrafts'
import { DashboardContributorTips } from '../components/dashboard/DashboardContributorTips'
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions'
import { DashboardRecentSubmissions } from '../components/dashboard/DashboardRecentSubmissions'
import { DashboardStatCards } from '../components/dashboard/DashboardStatCards'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ICON_ACTION } from '../components/ui/ActionControls'
import { RoleBadge } from '../components/ui/RoleBadge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ApiError, getMySubmissions, type CoinSubmission } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  computeSubmissionStats,
  getLatestNeedsRevisionSubmission,
  getLatestPendingSubmission,
  getRecentSubmissions,
} from '../lib/submissionStats'
import { buildActivityFeed, computeActivitySummary } from '../lib/activityCenter'
import { buildQualityAlerts } from '../lib/qualityAlerts'
import { computeSubmissionListCompleteness } from '../lib/completenessScore'

function RecentSubmissionsSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="space-y-4">
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-4">
            <div className="h-[4.5rem] w-[4.5rem] animate-pulse rounded-lg bg-panel" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-panel" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-panel" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptySubmissionsCard() {
  return (
    <Card className="!p-6 text-center sm:!p-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <span className="font-serif text-2xl text-primary">◎</span>
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-lg font-semibold text-navy">No submissions yet</h2>
          <p className="text-sm text-navy-muted">
            Start your first catalogue entry to see activity here.
          </p>
        </div>
        <Link
          to="/new-coin"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className={ICON_ACTION} aria-hidden />
          <span>Submit new coin</span>
        </Link>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const { user, token } = useAuth()
  const role = user?.role === 'admin' ? 'admin' : 'contributor'

  const [submissions, setSubmissions] = useState<CoinSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadSubmissions() {
    setIsLoading(true)
    setError(null)

    const activeToken = token
    if (!activeToken) {
      setError('Your session has expired. Please sign in again.')
      setIsLoading(false)
      return
    }

    try {
      const response = await getMySubmissions(activeToken)
      setSubmissions(response.submissions ?? [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSubmissions()
  }, [token])

  const stats = useMemo(() => computeSubmissionStats(submissions), [submissions])
  const recentSubmissions = useMemo(() => getRecentSubmissions(submissions, 5), [submissions])
  const latestPending = useMemo(() => getLatestPendingSubmission(submissions), [submissions])
  const latestNeedsRevision = useMemo(
    () => getLatestNeedsRevisionSubmission(submissions),
    [submissions],
  )
  const apiDraftSubmissions = useMemo(
    () => submissions.filter((submission) => submission.status === 'draft'),
    [submissions],
  )
  const activitySummary = useMemo(() => computeActivitySummary(submissions), [submissions])
  const activityFeed = useMemo(() => buildActivityFeed(submissions), [submissions])
  const qualityAlerts = useMemo(() => buildQualityAlerts(submissions), [submissions])
  const recentCompletenessById = useMemo(() => {
    const map = new Map<number, ReturnType<typeof computeSubmissionListCompleteness>>()

    for (const submission of recentSubmissions) {
      map.set(submission.id, computeSubmissionListCompleteness(submission))
    }

    return map
  }, [recentSubmissions])

  const draftApiSubmissions = error ? [] : apiDraftSubmissions

  function renderRecentSubmissions() {
    if (isLoading) {
      return <RecentSubmissionsSkeleton />
    }

    if (submissions.length === 0) {
      return <EmptySubmissionsCard />
    }

    return (
      <DashboardRecentSubmissions
        submissions={recentSubmissions}
        completenessById={recentCompletenessById}
      />
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <Card className="!p-4 sm:!p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary sm:h-12 sm:w-12">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="section-label">Signed in as</p>
                <h2 className="mt-1 font-serif text-lg font-semibold text-navy sm:text-xl">
                  {user.display_name}
                </h2>
                <p className="mt-0.5 text-sm text-navy-muted">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={user.status} />
              <RoleBadge role={role} />
            </div>
          </div>

          <DashboardQuickActions
            latestPending={latestPending}
            latestNeedsRevision={latestNeedsRevision}
          />
        </div>
      </Card>

      <div className="lg:hidden">
        <DashboardSavedDrafts apiDraftSubmissions={draftApiSubmissions} />
      </div>

      {error ? (
        <Card className="!p-4">
          <div className="flex flex-col gap-3 py-2 text-center">
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadSubmissions()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : null}

      {!error ? <DashboardStatCards stats={stats} isLoading={isLoading} /> : null}

      {!error ? (
        <div className="mt-2 flex flex-col gap-5 lg:mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
          <div className="order-4 min-w-0 lg:order-none lg:col-start-1 lg:row-start-1">
            <DashboardActivityCenter
              summary={activitySummary}
              feed={activityFeed}
              isLoading={isLoading}
            />
          </div>

          <div className="order-5 min-w-0 lg:order-none lg:col-start-1 lg:row-start-2">
            {renderRecentSubmissions()}
          </div>

          <aside className="order-5 hidden w-full max-w-[340px] flex-col gap-5 justify-self-end lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:flex xl:sticky xl:top-20 xl:self-start">
            <DashboardSavedDrafts apiDraftSubmissions={draftApiSubmissions} />
            <DashboardQualityAlerts alerts={qualityAlerts} isLoading={isLoading} />
            <DashboardContributorTips />
          </aside>

          <div className="order-6 lg:hidden">
            <DashboardQualityAlerts alerts={qualityAlerts} isLoading={isLoading} />
          </div>

          <div className="order-7 lg:hidden">
            <DashboardContributorTips />
          </div>
        </div>
      ) : null}
    </div>
  )
}
