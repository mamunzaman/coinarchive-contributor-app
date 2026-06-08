import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ContributorStatisticsCards } from '../components/profile/ContributorStatisticsCards'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RoleBadge } from '../components/ui/RoleBadge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ApiError, getMySubmissions } from '../lib/api'
import { computeContributorStatistics } from '../lib/contributorStats'
import {
  clearAuthSession,
  getAuthContributor,
  getAuthToken,
  getContributorRole,
} from '../lib/auth'

export function ProfilePage() {
  const navigate = useNavigate()
  const contributor = getAuthContributor()
  const role = getContributorRole()
  const hasSession = Boolean(getAuthToken())

  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<Awaited<
    ReturnType<typeof getMySubmissions>
  >['submissions']>([])

  useEffect(() => {
    async function loadStats() {
      setIsLoadingStats(true)
      setStatsError(null)

      const token = getAuthToken()
      if (!token) {
        setStatsError('Your session has expired. Please sign in again.')
        setIsLoadingStats(false)
        return
      }

      try {
        const response = await getMySubmissions(token)
        setSubmissions(response.submissions ?? [])
      } catch (err) {
        if (err instanceof ApiError) {
          setStatsError(err.message)
        } else {
          setStatsError('Unable to load contributor statistics.')
        }
      } finally {
        setIsLoadingStats(false)
      }
    }

    void loadStats()
  }, [])

  const contributorStats = useMemo(
    () => computeContributorStatistics(submissions),
    [submissions],
  )

  function handleLogout() {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  if (!contributor) {
    return null
  }

  const permissions =
    role === 'admin'
      ? [
          'Approve contributor accounts',
          'Access admin approval tools',
          'Submit and manage coin entries',
        ]
      : ['Submit coin entries to the archive', 'View your submission dashboard']

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <p className="section-label">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-navy-muted">
          Your account details, permissions, and session information.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-xl font-semibold text-primary">
              {contributor.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-navy">
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
      </Card>

      <Card>
        {statsError ? (
          <p role="alert" className="text-sm text-red-600">
            {statsError}
          </p>
        ) : (
          <ContributorStatisticsCards stats={contributorStats} isLoading={isLoadingStats} />
        )}
      </Card>

      <Card>
        <h2 className="font-serif text-lg font-semibold text-navy">Account Information</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-muted">
              Display name
            </dt>
            <dd className="mt-1 text-sm font-medium text-navy">{contributor.display_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-muted">Email</dt>
            <dd className="mt-1 text-sm font-medium text-navy">{contributor.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-muted">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={contributor.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-muted">Role</dt>
            <dd className="mt-1">
              <RoleBadge role={role} />
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="font-serif text-lg font-semibold text-navy">Permissions</h2>
        <ul className="mt-4 space-y-2">
          {permissions.map((permission) => (
            <li key={permission} className="flex items-start gap-2 text-sm text-navy-muted">
              <span className="mt-1 text-primary" aria-hidden="true">
                •
              </span>
              <span>{permission}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-serif text-lg font-semibold text-navy">Session Information</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-muted">
              Session
            </dt>
            <dd className="mt-1 text-sm font-medium text-navy">
              {hasSession ? 'Active' : 'Inactive'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-muted">
              Contributor ID
            </dt>
            <dd className="mt-1 text-sm font-medium text-navy">{contributor.id}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="font-serif text-lg font-semibold text-navy">Profile editing</h2>
        <p className="mt-2 text-sm text-navy-muted">Profile editing coming soon.</p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-navy transition-all duration-200 hover:border-navy/20 hover:bg-muted"
        >
          Back to dashboard
        </Link>
        <Button type="button" variant="secondary" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  )
}
