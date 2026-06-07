import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardContributorTips } from '../components/dashboard/DashboardContributorTips'
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions'
import { DashboardRecentSubmissions } from '../components/dashboard/DashboardRecentSubmissions'
import { DashboardStatCards } from '../components/dashboard/DashboardStatCards'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RoleBadge } from '../components/ui/RoleBadge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ApiError, getMySubmissions, type CoinSubmission } from '../lib/api'
import { getAuthContributor, getAuthToken, getContributorRole } from '../lib/auth'
import {
  computeSubmissionStats,
  getLatestPendingSubmission,
  getRecentSubmissions,
} from '../lib/submissionStats'

export function DashboardPage() {
  const contributor = getAuthContributor()
  const role = getContributorRole()

  const [submissions, setSubmissions] = useState<CoinSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadSubmissions() {
    setIsLoading(true)
    setError(null)

    const token = getAuthToken()
    if (!token) {
      setError('Your session has expired. Please sign in again.')
      setIsLoading(false)
      return
    }

    try {
      const response = await getMySubmissions(token)
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
  }, [])

  const stats = useMemo(() => computeSubmissionStats(submissions), [submissions])
  const recentSubmissions = useMemo(() => getRecentSubmissions(submissions, 5), [submissions])
  const latestPending = useMemo(() => getLatestPendingSubmission(submissions), [submissions])

  if (!contributor) {
    return null
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                {contributor.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="section-label">Signed in as</p>
                <h2 className="mt-0.5 font-serif text-xl font-semibold text-navy">
                  {contributor.display_name}
                </h2>
                <p className="mt-0.5 text-sm text-navy-muted">{contributor.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={contributor.status} />
              <RoleBadge role={role} />
            </div>
          </div>

          <DashboardQuickActions latestPending={latestPending} />
        </div>
      </Card>

      <div>
        <p className="section-label">Overview</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
          Contributor Dashboard
        </h1>
        <p className="mt-2 max-w-xl text-sm text-navy-muted">
          Track your coin submissions and add new entries to the archive.
        </p>
      </div>

      {error ? (
        <Card>
          <div className="flex flex-col gap-4 py-4 text-center">
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            {isLoading ? (
              <Card>
                <div className="flex flex-col gap-4 px-2 py-10">
                  <div className="h-5 w-40 animate-pulse rounded bg-panel" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="flex items-center gap-4">
                        <div className="h-16 w-16 animate-pulse rounded-xl bg-panel" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-panel" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-panel" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : submissions.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center gap-6 px-4 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-serif text-3xl text-primary">◎</span>
                  </div>
                  <div className="max-w-md space-y-2">
                    <h2 className="font-serif text-xl font-semibold text-navy">No submissions yet</h2>
                    <p className="text-sm leading-relaxed text-navy-muted">
                      Your submitted coins will appear here once you start contributing to the archive.
                    </p>
                  </div>
                  <Link
                    to="/new-coin"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    Submit new coin
                  </Link>
                </div>
              </Card>
            ) : (
              <DashboardRecentSubmissions submissions={recentSubmissions} />
            )}
          </div>

          <DashboardContributorTips />
        </div>
      ) : null}
    </div>
  )
}
