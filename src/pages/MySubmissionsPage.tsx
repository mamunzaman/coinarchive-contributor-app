import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SubmissionGalleryCard } from '../components/submissions/SubmissionGalleryCard'
import { SubmissionTableView } from '../components/submissions/SubmissionTableView'
import { SubmissionsToolbar } from '../components/submissions/SubmissionsToolbar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ApiError, getMySubmissions, type CoinSubmission } from '../lib/api'
import { getAuthToken } from '../lib/auth'
import {
  filterAndSortSubmissions,
  type SubmissionSortOption,
  type SubmissionStatusFilter,
  type SubmissionViewMode,
} from '../lib/submissionListUtils'

export function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<CoinSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>('all')
  const [sort, setSort] = useState<SubmissionSortOption>('recent')
  const [viewMode, setViewMode] = useState<SubmissionViewMode>('gallery')

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

  const filteredSubmissions = useMemo(
    () => filterAndSortSubmissions(submissions, { query, statusFilter, sort }),
    [submissions, query, statusFilter, sort],
  )

  const hasActiveFilters =
    query.trim().length > 0 || statusFilter !== 'all' || sort !== 'recent'

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="section-label">Archive</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
            Submitted Specimens
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-navy-muted">
            Visual audit gallery for your coin submissions awaiting review or already published in
            the catalogue.
          </p>
        </div>
        <Link
          to="/new-coin"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Submit new coin
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-navy-muted">Loading your submissions…</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && error ? (
        <Card>
          <div className="flex flex-col gap-4 py-6 text-center">
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

      {!isLoading && !error && submissions.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-6 px-4 py-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <span className="font-serif text-4xl text-primary">◎</span>
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="font-serif text-2xl font-semibold text-navy">No submissions yet</h2>
              <p className="text-sm leading-relaxed text-navy-muted">
                Your submitted coins will appear in this archive gallery once you begin contributing
                specimens for catalogue review.
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
      ) : null}

      {!isLoading && !error && submissions.length > 0 ? (
        <>
          <SubmissionsToolbar
            query={query}
            statusFilter={statusFilter}
            sort={sort}
            viewMode={viewMode}
            resultCount={filteredSubmissions.length}
            totalCount={submissions.length}
            onQueryChange={setQuery}
            onStatusFilterChange={setStatusFilter}
            onSortChange={setSort}
            onViewModeChange={setViewMode}
          />

          {filteredSubmissions.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
                <h2 className="font-serif text-xl font-semibold text-navy">No matching specimens</h2>
                <p className="max-w-md text-sm text-navy-muted">
                  Try adjusting your search or filters to find submissions in your archive.
                </p>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setQuery('')
                      setStatusFilter('all')
                      setSort('recent')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : viewMode === 'gallery' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredSubmissions.map((submission) => (
                <SubmissionGalleryCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <SubmissionTableView submissions={filteredSubmissions} />
          )}
        </>
      ) : null}
    </div>
  )
}
