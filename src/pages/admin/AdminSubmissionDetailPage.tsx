import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminRejectDialog } from '../../components/admin/AdminRejectDialog'
import { AdminReviewPanel } from '../../components/coin/AdminReviewPanel'
import { SubmissionAdminInfo } from '../../components/coin/SubmissionAdminInfo'
import { SubmissionActivityTimeline } from '../../components/coin/SubmissionActivityTimeline'
import { SubmissionDetailHeader } from '../../components/coin/SubmissionDetailHeader'
import { SubmissionDetailImages } from '../../components/coin/SubmissionDetailImages'
import { SubmissionDetailSections } from '../../components/coin/SubmissionDetailSections'
import { SubmissionMintInfo } from '../../components/coin/SubmissionMintInfo'
import { SubmissionRevisionComparison } from '../../components/coin/SubmissionRevisionComparison'
import { SubmissionRevisionNotes } from '../../components/coin/SubmissionRevisionNotes'
import { SubmissionTimeline } from '../../components/coin/SubmissionTimeline'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useSubmissionImageAutosave } from '../../hooks/useSubmissionImageAutosave'
import {
  approveAdminSubmission,
  getAdminSubmission,
  rejectAdminSubmission,
  requestAdminSubmissionRevision,
} from '../../lib/adminApi'
import {
  ApiError,
  type CoinSubmissionDetail,
  type SubmissionActivityLogsPayload,
} from '../../lib/api'
import { getAuthToken } from '../../lib/auth'
import { getDraftStorageKey, loadFormDraft } from '../../lib/formDraftStorage'
import { hasGalleryImageChanges, hasSubmissionGalleryDrift } from '../../lib/revisionComparison'
import { getSubmissionRevisionInfo } from '../../lib/submissionRevisionNotes'
import { buildSubmissionTimeline } from '../../lib/submissionTimeline'
import { coinFormValuesFromSubmission } from '../../types/coinForm'

export function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number.parseInt(id ?? '', 10)

  const [submission, setSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [activityLogs, setActivityLogs] = useState<SubmissionActivityLogsPayload | undefined>(
    undefined,
  )
  const [hasActivityLogsField, setHasActivityLogsField] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isDeciding, setIsDeciding] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const initialGalleryIdsRef = useRef<number[]>([])

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
    handleGalleryReplace,
    cancelGalleryReplace,
    retryGalleryReplace,
    handleGalleryPermanentDelete,
  } = useSubmissionImageAutosave({
    submissionId,
    submission,
    onSubmissionUpdated: handleSubmissionUpdated,
  })

  async function loadSubmission() {
    initialGalleryIdsRef.current = []
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    setSubmission(null)
    setActivityLogs(undefined)
    setHasActivityLogsField(false)
    setDecisionError(null)
    setDecisionMessage(null)
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
      const response = await getAdminSubmission(submissionId, token)
      setSubmission(response.submission)
      setActivityLogs(response.activity_logs)
      setHasActivityLogsField(response.activity_logs !== undefined)
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

  useEffect(() => {
    initialGalleryIdsRef.current = []
  }, [submissionId])

  useEffect(() => {
    if (!submission || submission.id !== submissionId) {
      return
    }

    if (initialGalleryIdsRef.current.length === 0) {
      initialGalleryIdsRef.current = (submission.images.gallery ?? []).map((image) => image.id)
    }
  }, [submission, submissionId])

  const editDraft = useMemo(
    () => (submission ? loadFormDraft(getDraftStorageKey('edit', submission.id)) : null),
    [submission],
  )
  const revisionInfo = submission ? getSubmissionRevisionInfo(submission) : null
  const timelineEvents = submission ? buildSubmissionTimeline(submission) : []
  const baselineValues = submission ? coinFormValuesFromSubmission(submission) : null

  const galleryChanged = useMemo(() => {
    if (!submission) {
      return false
    }

    const draftGalleryChanged = editDraft
      ? hasGalleryImageChanges({
          pendingAddCount: editDraft.galleryFiles.length,
          removedImageIds: editDraft.removedGalleryImageIds,
        })
      : false

    const liveGalleryChanged = hasGalleryImageChanges({
      pendingAddCount: editState.pendingGalleryUploads.length,
      removedImageIds: editState.hiddenGalleryIds,
      replacementCount: Object.keys(editState.galleryReplaceStates).length,
    })

    const savedGalleryDrift = hasSubmissionGalleryDrift(
      (submission.images.gallery ?? []).map((image) => image.id),
      initialGalleryIdsRef.current,
    )

    return draftGalleryChanged || liveGalleryChanged || savedGalleryDrift
  }, [editDraft, editState, submission])

  async function runDecision(action: () => Promise<void>) {
    setIsDeciding(true)
    setDecisionError(null)
    setDecisionMessage(null)

    try {
      await action()
    } catch (err) {
      if (err instanceof ApiError) {
        setDecisionError(err.message)
      } else {
        setDecisionError('Unable to complete review action. Check your connection and try again.')
      }
    } finally {
      setIsDeciding(false)
    }
  }

  async function handleApprove() {
    const token = getAuthToken()
    if (!token || !submission) {
      return
    }

    await runDecision(async () => {
      const response = await approveAdminSubmission(submission.id, token)
      if (response.submission) {
        setSubmission(response.submission)
      } else {
        await loadSubmission()
      }
      setDecisionMessage(response.message ?? 'Submission approved.')
    })
  }

  function openRejectDialog() {
    setRejectReason('')
    setRejectError(null)
    setShowRejectDialog(true)
  }

  function closeRejectDialog() {
    if (isDeciding) {
      return
    }

    setShowRejectDialog(false)
    setRejectError(null)
  }

  async function handleRejectConfirm() {
    const token = getAuthToken()
    if (!token || !submission || !rejectReason.trim()) {
      return
    }

    setIsDeciding(true)
    setRejectError(null)

    try {
      const response = await rejectAdminSubmission(submission.id, rejectReason.trim(), token)
      if (response.submission) {
        setSubmission(response.submission)
      } else {
        await loadSubmission()
      }
      setDecisionMessage(response.message ?? 'Submission rejected.')
      setShowRejectDialog(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setRejectError(err.message)
      } else {
        setRejectError('Unable to reject submission. Check your connection and try again.')
      }
    } finally {
      setIsDeciding(false)
    }
  }

  async function handleRequestRevision() {
    const token = getAuthToken()
    if (!token || !submission) {
      return
    }

    const notes = window.prompt('Revision notes for the contributor:')
    if (!notes?.trim()) {
      return
    }

    await runDecision(async () => {
      const response = await requestAdminSubmissionRevision(submission.id, notes.trim(), token)
      if (response.submission) {
        setSubmission(response.submission)
      } else {
        await loadSubmission()
      }
      setDecisionMessage(response.message ?? 'Revision requested.')
    })
  }

  const imageEditHandlers = {
    canEdit: submission?.status === 'pending',
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
    onGalleryReplace: handleGalleryReplace,
    onCancelGalleryReplace: cancelGalleryReplace,
    onRetryGalleryReplace: retryGalleryReplace,
    onGalleryPermanentDelete: handleGalleryPermanentDelete,
    allowGalleryPermanentDelete: true,
  }

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      {isLoading ? (
        <Card className="bg-[#faf8f5]">
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-navy-muted">Loading submission for review…</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && notFound ? (
        <Card className="bg-[#faf8f5]">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="section-label">404</p>
            <h1 className="font-serif text-2xl font-semibold text-navy">Submission not found</h1>
            <p className="max-w-md text-sm text-navy-muted">
              This submission does not exist or is no longer available for review.
            </p>
            <Link
              to="/admin/submissions"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Back to queue
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
          <SubmissionDetailHeader
            submission={submission}
            backTo="/admin/submissions"
            backLabel="Back to queue"
            editTo={`/my-submissions/${submission.id}/edit`}
          />

          <div className="mt-6">
            <SubmissionRevisionNotes submission={submission} />
          </div>

          <div className="mt-6">
            {hasActivityLogsField && activityLogs ? (
              <SubmissionActivityTimeline
                activityLogs={activityLogs}
                submissionId={submission.id}
              />
            ) : (
              <SubmissionTimeline events={timelineEvents} />
            )}
          </div>

          {revisionInfo?.needsRevision && baselineValues ? (
            <div className="mt-6">
              <SubmissionRevisionComparison
                previousValues={baselineValues}
                currentValues={editDraft?.values ?? baselineValues}
                imageChanges={{
                  obverseChanged: Boolean(editDraft?.obverseFile),
                  reverseChanged: Boolean(editDraft?.reverseFile),
                  galleryChanged,
                }}
              />
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="order-2 flex min-w-0 flex-col gap-10 lg:order-1 lg:gap-12">
              <section id="review-data" className="scroll-mt-24">
                <SubmissionDetailSections submission={submission} imageEdit={imageEditHandlers} />
              </section>

              <section id="review-images" className="scroll-mt-24">
                <SubmissionDetailImages submission={submission} layout="gallery" {...imageEditHandlers} />
              </section>

              <SubmissionDetailImages submission={submission} layout="actions" {...imageEditHandlers} />

              <section id="review-mint" className="scroll-mt-24">
                <SubmissionMintInfo acf={submission.acf} />
              </section>

              <section id="review-admin" className="scroll-mt-24">
                <SubmissionAdminInfo acf={submission.acf} />
              </section>
            </div>

            <div className="order-1 min-w-0 lg:order-2">
              <AdminReviewPanel
                submission={submission}
                hasRevisionNotes={Boolean(revisionInfo?.needsRevision)}
                hasActivityLogs={Boolean(hasActivityLogsField && activityLogs)}
                onApprove={() => void handleApprove()}
                onReject={openRejectDialog}
                onRequestRevision={() => void handleRequestRevision()}
                isDeciding={isDeciding}
                decisionError={decisionError}
                decisionMessage={decisionMessage}
              />
            </div>
          </div>
        </article>
      ) : null}

      <AdminRejectDialog
        open={showRejectDialog}
        reason={rejectReason}
        isSubmitting={isDeciding}
        error={rejectError}
        onReasonChange={setRejectReason}
        onCancel={closeRejectDialog}
        onConfirm={() => void handleRejectConfirm()}
      />
    </div>
  )
}
