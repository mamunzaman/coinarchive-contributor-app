import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SubmissionDetailSections } from '../components/coin/SubmissionDetailSections'
import { SubmissionMintInfo } from '../components/coin/SubmissionMintInfo'
import { SubmissionAdminInfo } from '../components/coin/SubmissionAdminInfo'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ApiError, getMySubmission, type CoinSubmissionDetail } from '../lib/api'
import { getAuthToken } from '../lib/auth'
import { formatSubmittedDate } from '../lib/format'

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number.parseInt(id ?? '', 10)

  const [submission, setSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function loadSubmission() {
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    setSubmission(null)

    if (!id || Number.isNaN(submissionId) || submissionId < 1) {
      setNotFound(true)
      setIsLoading(false)
      return
    }

    const token = getAuthToken()
    if (!token) {
      setError('Your session has expired. Please sign in again.')
      setIsLoading(false)
      return
    }

    try {
      const response = await getMySubmission(submissionId, token)
      setSubmission(response.submission)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSubmission()
  }, [id])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link
        to="/my-submissions"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
      >
        ← Back to My Submissions
      </Link>

      {isLoading ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-navy-muted">Loading submission…</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && notFound ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="section-label">404</p>
            <h1 className="font-serif text-2xl font-semibold text-navy">Submission not found</h1>
            <p className="max-w-md text-sm text-navy-muted">
              This submission does not exist or you do not have permission to view it.
            </p>
            <Link
              to="/my-submissions"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Back to My Submissions
            </Link>
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
            <Button type="button" variant="secondary" onClick={() => void loadSubmission()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : null}

      {!isLoading && !error && !notFound && submission ? (
        <>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={submission.status} />
                <p className="text-sm text-navy-muted">
                  Submitted {formatSubmittedDate(submission.date)}
                </p>
              </div>
              {submission.status === 'pending' ? (
                <Link
                  to={`/my-submissions/${submission.id}/edit`}
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-navy transition-all duration-200 hover:border-navy/20 hover:bg-muted"
                >
                  Edit
                </Link>
              ) : null}
            </div>
            <h1 className="mt-3 font-serif text-2xl font-semibold text-navy sm:text-3xl">
              {submission.title}
            </h1>
            <p className="mt-1 font-mono text-xs text-navy-muted">Post ID {submission.id}</p>
            <p className="mt-2 text-xs text-navy-muted">
              Coin code is generated automatically after submission.
            </p>
          </div>

          <SubmissionDetailSections submission={submission} />

          <SubmissionMintInfo acf={submission.acf} />

          <SubmissionAdminInfo acf={submission.acf} />

          {(submission.images.obverse || submission.images.reverse) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {submission.images.obverse ? (
                <Card>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    Obverse
                  </p>
                  <img
                    src={submission.images.obverse.url}
                    alt={`${submission.title} obverse`}
                    className="mt-3 w-full rounded-xl border border-border/60 object-contain"
                  />
                </Card>
              ) : null}
              {submission.images.reverse ? (
                <Card>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    Reverse
                  </p>
                  <img
                    src={submission.images.reverse.url}
                    alt={`${submission.title} reverse`}
                    className="mt-3 w-full rounded-xl border border-border/60 object-contain"
                  />
                </Card>
              ) : null}
            </div>
          )}

          {(submission.images.gallery?.length ?? 0) > 0 ? (
            <Card>
              <h2 className="font-serif text-lg font-semibold text-navy">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {submission.images.gallery?.map((image) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`${submission.title} gallery`}
                    className="aspect-square w-full rounded-xl border border-border/60 object-cover"
                  />
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <h2 className="font-serif text-lg font-semibold text-navy">Edit submission</h2>
            {submission.status === 'pending' ? (
              <p className="mt-2 text-sm text-navy-muted">
                This submission is still pending review. You can update details before it is
                published.
              </p>
            ) : (
              <p className="mt-2 text-sm text-navy-muted">
                Published submissions cannot be edited.
              </p>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}
