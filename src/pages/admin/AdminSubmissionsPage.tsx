import { useEffect, useMemo, useState } from 'react'
import { AdminSubmissionQueueTable } from '../../components/admin/AdminSubmissionQueueTable'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import {
  getAdminSubmissions,
  sortAdminSubmissionsByUpdated,
  type AdminSubmissionListItem,
} from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { getAuthToken } from '../../lib/auth'

type StatusFilter = 'all' | 'pending' | 'published' | 'rejected' | 'draft'

function matchesFilter(submission: AdminSubmissionListItem, filter: StatusFilter): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'pending') {
    return submission.status === 'pending'
  }

  if (filter === 'draft') {
    return submission.status === 'draft'
  }

  if (filter === 'published') {
    return submission.status === 'publish' || submission.status === 'published'
  }

  return ['rejected', 'declined', 'failed', 'needs_revision', 'needs-revision'].includes(
    submission.status,
  )
}

export function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmissionListItem[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
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
      const response = await getAdminSubmissions(token)
      setSubmissions(response.submissions)
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

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return sortAdminSubmissionsByUpdated(submissions).filter((submission) => {
      if (!matchesFilter(submission, statusFilter)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return (
        submission.title.toLowerCase().includes(normalizedQuery) ||
        submission.id.toString().includes(normalizedQuery) ||
        (submission.contributor_name ?? '').toLowerCase().includes(normalizedQuery) ||
        (submission.contributor_email ?? '').toLowerCase().includes(normalizedQuery) ||
        (submission.country ?? '').toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query, statusFilter, submissions])

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <Card className="!p-5 sm:!p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Review desk
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
          Submission queue
        </h1>
        <p className="mt-2 text-sm text-navy-muted">
          Search and review contributor coin entries before approval.
        </p>
      </Card>

      <Card className="!p-4 sm:!p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="block min-w-0 flex-1">
            <span className="sr-only">Search submissions</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, contributor, country, or ID…"
              className="field-control w-full"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'All'],
                ['pending', 'Pending'],
                ['published', 'Approved'],
                ['rejected', 'Rejected'],
                ['draft', 'Drafts'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  statusFilter === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 bg-page/60 text-navy-muted hover:border-primary/30 hover:text-navy',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="!p-5">
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void loadSubmissions()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-border/70 bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="mt-3 text-sm text-navy-muted">Loading submissions…</p>
        </div>
      ) : (
        <AdminSubmissionQueueTable
          submissions={filteredSubmissions}
          emptyMessage="No submissions match your filters."
        />
      )}
    </div>
  )
}
