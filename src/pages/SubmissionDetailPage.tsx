import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SubmissionAdminInfo } from '../components/coin/SubmissionAdminInfo'
import { SubmissionDetailImages } from '../components/coin/SubmissionDetailImages'
import { SubmissionDetailHeader } from '../components/coin/SubmissionDetailHeader'
import { SubmissionDetailSections } from '../components/coin/SubmissionDetailSections'
import { SubmissionMintInfo } from '../components/coin/SubmissionMintInfo'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSubmissionImageAutosave } from '../hooks/useSubmissionImageAutosave'
import { ApiError, getMySubmission, type CoinSubmissionDetail } from '../lib/api'
import { getAuthToken } from '../lib/auth'
import { canEditSubmission } from '../lib/submissionListUtils'

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number.parseInt(id ?? '', 10)

  const [submission, setSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleSubmissionUpdated = useCallback((updated: CoinSubmissionDetail) => {
    setSubmission(updated)
  }, [])

  const {
    editState,
    footerStatus,
    startEdit,
    finishEdit,
    resetEditState,
    handleObverseChange,
    handleReverseChange,
    handleGalleryAdd,
    scheduleGalleryRemove,
    undoGalleryRemove,
    retryObverse,
    retryReverse,
    revertObverse,
    revertReverse,
    retryGalleryUpload,
    dismissFailedGalleryUpload,
  } = useSubmissionImageAutosave({
    submissionId,
    submission,
    onSubmissionUpdated: handleSubmissionUpdated,
  })

  async function loadSubmission() {
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    setSubmission(null)
    resetEditState()

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

  const canEdit = submission ? canEditSubmission(submission) : false

  const imageEditHandlers = {
    canEdit,
    editState,
    footerStatus,
    onStartEdit: startEdit,
    onFinishEdit: finishEdit,
    onObverseChange: handleObverseChange,
    onReverseChange: handleReverseChange,
    onGalleryAdd: handleGalleryAdd,
    onGalleryRemove: scheduleGalleryRemove,
    onUndoGalleryRemove: undoGalleryRemove,
    onRetryObverse: retryObverse,
    onRetryReverse: retryReverse,
    onRevertObverse: revertObverse,
    onRevertReverse: revertReverse,
    onRetryGalleryUpload: retryGalleryUpload,
    onDismissFailedGalleryUpload: dismissFailedGalleryUpload,
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {isLoading ? (
        <Card className="bg-[#faf8f5]">
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-navy-muted">Loading submission…</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && notFound ? (
        <Card className="bg-[#faf8f5]">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="section-label">404</p>
            <h1 className="font-serif text-2xl font-semibold text-navy">Submission not found</h1>
            <p className="max-w-md text-sm text-navy-muted">
              This submission does not exist or you do not have permission to view it.
            </p>
            <Link
              to="/my-submissions"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Back to My Submissions
            </Link>
          </div>
        </Card>
      ) : null}

      {!isLoading && error ? (
        <Card className="bg-[#faf8f5]">
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
        <article className="rounded-2xl border border-border/40 bg-[#faf8f5] px-5 py-6 shadow-[var(--shadow-card)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <SubmissionDetailHeader submission={submission} />

          <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:gap-12">
            <SubmissionDetailSections submission={submission} imageEdit={imageEditHandlers} />

            <SubmissionDetailImages submission={submission} layout="gallery" {...imageEditHandlers} />

            <SubmissionDetailImages submission={submission} layout="actions" {...imageEditHandlers} />

            <SubmissionMintInfo acf={submission.acf} />

            <SubmissionAdminInfo acf={submission.acf} />
          </div>
        </article>
      ) : null}
    </div>
  )
}
