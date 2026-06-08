import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminStatCards } from '../../components/admin/AdminStatCards'
import { AdminSubmissionQueueTable } from '../../components/admin/AdminSubmissionQueueTable'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { RoleBadge } from '../../components/ui/RoleBadge'
import {
  getAdminDashboardStats,
  getAdminSubmissions,
  getPendingAdminSubmissions,
  sortAdminSubmissionsByUpdated,
  type AdminDashboardStats,
  type AdminSubmissionListItem,
} from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { getAuthContributor, getAuthToken } from '../../lib/auth'

const EMPTY_STATS: AdminDashboardStats = {
  pending: 0,
  approved: 0,
  rejected: 0,
  contributors: 0,
}

export function AdminDashboardPage() {
  const contributor = getAuthContributor()
  const [submissions, setSubmissions] = useState<AdminSubmissionListItem[]>([])
  const [stats, setStats] = useState<AdminDashboardStats>(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingDevFallback, setUsingDevFallback] = useState(false)

  async function loadDashboard() {
    setIsLoading(true)
    setError(null)

    const token = getAuthToken()
    if (!token) {
      setError('Your session has expired. Please sign in again.')
      setIsLoading(false)
      return
    }

    try {
      const [submissionsResponse, statsResponse] = await Promise.all([
        getAdminSubmissions(token),
        getAdminDashboardStats(token),
      ])

      setSubmissions(submissionsResponse.submissions)
      setStats(statsResponse)
      setUsingDevFallback(import.meta.env.DEV && !submissionsResponse.submissions.some((item) => item.contributor_name))
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
    void loadDashboard()
  }, [])

  const queuePreview = useMemo(
    () => getPendingAdminSubmissions(submissions, 8),
    [submissions],
  )

  const recentSubmissions = useMemo(
    () => sortAdminSubmissionsByUpdated(submissions).slice(0, 8),
    [submissions],
  )

  const tableRows = queuePreview.length > 0 ? queuePreview : recentSubmissions

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <Card className="!p-5 sm:!p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Administration
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-navy-muted">
              Review contributor submissions, monitor catalogue activity, and manage approvals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role="admin" />
            {contributor?.display_name ? (
              <span className="text-sm text-navy-muted">{contributor.display_name}</span>
            ) : null}
          </div>
        </div>
      </Card>

      {usingDevFallback ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          Admin API endpoints are not available yet. Showing limited preview data in development.
        </div>
      ) : null}

      {error ? (
        <Card className="!p-5">
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void loadDashboard()}>
            Try again
          </Button>
        </Card>
      ) : null}

      <AdminStatCards stats={stats} isLoading={isLoading} />

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-navy">Submission queue</h2>
            <p className="mt-1 text-sm text-navy-muted">
              {queuePreview.length > 0
                ? 'Pending items awaiting review.'
                : 'Recent submissions across the archive.'}
            </p>
          </div>
          <Link to="/admin/submissions">
            <Button type="button" variant="secondary">
              View all submissions
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border/70 bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="mt-3 text-sm text-navy-muted">Loading queue…</p>
          </div>
        ) : (
          <AdminSubmissionQueueTable submissions={tableRows} />
        )}
      </section>
    </div>
  )
}
