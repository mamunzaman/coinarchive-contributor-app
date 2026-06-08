import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SubmissionAdminInfo } from '../components/coin/SubmissionAdminInfo'
import { SubmissionDetailImages } from '../components/coin/SubmissionDetailImages'
import { SubmissionDetailHeader } from '../components/coin/SubmissionDetailHeader'
import { SubmissionRevisionNotes } from '../components/coin/SubmissionRevisionNotes'
import { SubmissionRevisionComparison } from '../components/coin/SubmissionRevisionComparison'
import { SubmissionActivityTimeline } from '../components/coin/SubmissionActivityTimeline'
import { SubmissionTimeline } from '../components/coin/SubmissionTimeline'
import { SubmissionDetailSections } from '../components/coin/SubmissionDetailSections'
import { SubmissionMintInfo } from '../components/coin/SubmissionMintInfo'
import { DeleteSubmissionConfirmDialog } from '../components/submissions/DeleteSubmissionConfirmDialog'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSubmissionImageAutosave } from '../hooks/useSubmissionImageAutosave'
import { ApiError, deleteMySubmission, getMySubmission, type CoinSubmissionDetail, type SubmissionActivityLogsPayload } from '../lib/api'
import { getAuthToken, getContributorRole } from '../lib/auth'
import { canDeleteSubmission, canEditSubmission } from '../lib/submissionListUtils'
import { buildSubmissionTimeline } from '../lib/submissionTimeline'
import { getSubmissionRevisionInfo } from '../lib/submissionRevisionNotes'
import { getDraftStorageKey, loadFormDraft } from '../lib/formDraftStorage'
import { hasGalleryImageChanges, hasSubmissionGalleryDrift } from '../lib/revisionComparison'
import { coinFormValuesFromSubmission } from '../types/coinForm'

export function SubmissionDetailPage() {
  const navigate = useNavigate()
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
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

  const canEdit = submission ? canEditSubmission(submission) : false
  const canDelete = submission ? canDeleteSubmission(submission) : false
  const isAdmin = getContributorRole() === 'admin'

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

  function openDeleteDialog() {
    if (editState.isEditing) {
      return
    }

    setDeleteError(null)
    setShowDeleteDialog(true)
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return
    }
    setDeleteError(null)
    setShowDeleteDialog(false)
  }

  async function confirmDelete() {
    if (!submission) {
      return
    }

    const token = getAuthToken()
    if (!token) {
      setDeleteError('Your session has expired. Please sign in again.')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteMySubmission(submission.id, token)
      navigate('/my-submissions', {
        replace: true,
        state: { successMessage: 'Submission deleted successfully.' },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message)
      } else {
        setDeleteError('Unable to delete submission. Check your connection and try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

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
    onGalleryReplace: handleGalleryReplace,
    onCancelGalleryReplace: cancelGalleryReplace,
    onRetryGalleryReplace: retryGalleryReplace,
    onGalleryPermanentDelete: handleGalleryPermanentDelete,
    allowGalleryPermanentDelete: isAdmin,
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
          <SubmissionDetailHeader
            submission={submission}
            canDelete={canDelete}
            isDeleting={isDeleting}
            deleteBlockedByImageEdit={editState.isEditing}
            onDelete={openDeleteDialog}
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

          <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:gap-12">
            <SubmissionDetailSections submission={submission} imageEdit={imageEditHandlers} />

            <SubmissionDetailImages submission={submission} layout="gallery" {...imageEditHandlers} />

            <SubmissionDetailImages submission={submission} layout="actions" {...imageEditHandlers} />

            <SubmissionMintInfo acf={submission.acf} />

            {isAdmin ? <SubmissionAdminInfo acf={submission.acf} /> : null}
          </div>
        </article>
      ) : null}

      <DeleteSubmissionConfirmDialog
        open={showDeleteDialog}
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={closeDeleteDialog}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
