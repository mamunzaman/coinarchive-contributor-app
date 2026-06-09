import { ArrowLeft, Check, MessageSquare, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminRejectDialog } from '../../components/admin/AdminRejectDialog'
import { AdminCoinPreviewLayout } from '../../components/admin/AdminCoinPreviewLayout'
import { AdminReviewPanel } from '../../components/coin/AdminReviewPanel'
import { SubmissionActivityTimeline } from '../../components/coin/SubmissionActivityTimeline'
import { SubmissionTimeline } from '../../components/coin/SubmissionTimeline'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
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
import { formatSubmittedDate } from '../../lib/format'
import { hasGalleryImageChanges, hasSubmissionGalleryDrift } from '../../lib/revisionComparison'
import { getSubmissionRevisionInfo } from '../../lib/submissionRevisionNotes'
import { buildSubmissionTimeline } from '../../lib/submissionTimeline'
import { coinFormValuesFromSubmission } from '../../types/coinForm'

export function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number.parseInt(id ?? '', 10)

  const [submission, setSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [activityLogs, setActivityLogs] = useState<SubmissionActivityLogsPayload | undefined>(undefined)
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

  useEffect(() => { void loadSubmission() }, [id])

  useEffect(() => { initialGalleryIdsRef.current = [] }, [submissionId])

  useEffect(() => {
    if (!submission || submission.id !== submissionId) return
    if (initialGalleryIdsRef.current.length === 0) {
      initialGalleryIdsRef.current = (submission.images.gallery ?? []).map((img) => img.id)
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
    if (!submission) return false
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
      (submission.images.gallery ?? []).map((img) => img.id),
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
      setDecisionError(
        err instanceof ApiError
          ? err.message
          : 'Unable to complete review action. Check your connection and try again.',
      )
    } finally {
      setIsDeciding(false)
    }
  }

  async function handleApprove() {
    const token = getAuthToken()
    if (!token || !submission) return
    await runDecision(async () => {
      const res = await approveAdminSubmission(submission.id, token)
      if (res.submission) setSubmission(res.submission)
      else await loadSubmission()
      setDecisionMessage(res.message ?? 'Submission approved.')
    })
  }

  function openRejectDialog() {
    setRejectReason('')
    setRejectError(null)
    setShowRejectDialog(true)
  }

  function closeRejectDialog() {
    if (isDeciding) return
    setShowRejectDialog(false)
    setRejectError(null)
  }

  async function handleRejectConfirm() {
    const token = getAuthToken()
    if (!token || !submission || !rejectReason.trim()) return
    setIsDeciding(true)
    setRejectError(null)
    try {
      const res = await rejectAdminSubmission(submission.id, rejectReason.trim(), token)
      if (res.submission) setSubmission(res.submission)
      else await loadSubmission()
      setDecisionMessage(res.message ?? 'Submission rejected.')
      setShowRejectDialog(false)
    } catch (err) {
      setRejectError(
        err instanceof ApiError
          ? err.message
          : 'Unable to reject submission. Check your connection and try again.',
      )
    } finally {
      setIsDeciding(false)
    }
  }

  async function handleRequestRevision() {
    const token = getAuthToken()
    if (!token || !submission) return
    const notes = window.prompt('Revision notes for the contributor:')
    if (!notes?.trim()) return
    await runDecision(async () => {
      const res = await requestAdminSubmissionRevision(submission.id, notes.trim(), token)
      if (res.submission) setSubmission(res.submission)
      else await loadSubmission()
      setDecisionMessage(res.message ?? 'Revision requested.')
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

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-teal-500" />
          <p className="text-sm text-slate-400">Loading submission for review…</p>
        </div>
      </div>
    )
  }

  // ── Not found ──
  if (notFound) {
    return (
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">404</p>
          <h1 className="font-serif text-2xl font-semibold text-slate-800">Submission not found</h1>
          <p className="max-w-sm text-sm text-slate-500">
            This submission does not exist or is no longer available for review.
          </p>
          <Link
            to="/admin/submissions"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            Back to queue
          </Link>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
          <Button type="button" variant="secondary" onClick={() => void loadSubmission()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (!submission) return null

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-12">

      {/* ── Admin toolbar ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white px-5 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
        <Link
          to="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to queue
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={submission.status} />

          <button
            type="button"
            disabled={isDeciding}
            onClick={() => void handleApprove()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600 disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden />
            Approve
          </button>
          <button
            type="button"
            disabled={isDeciding}
            onClick={() => void handleRequestRevision()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Revision
          </button>
          <button
            type="button"
            disabled={isDeciding}
            onClick={openRejectDialog}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden />
            Reject
          </button>
          <button
            type="button"
            disabled={isDeciding}
            onClick={() => void loadSubmission()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
            aria-label="Reload submission"
            title="Reload submission"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Decision feedback */}
      {decisionMessage ? (
        <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {decisionMessage}
        </div>
      ) : null}
      {decisionError ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {decisionError}
        </div>
      ) : null}

      {/* ── Main two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_356px]">

        {/* LEFT — editorial public-style preview */}
        <div
          className="min-w-0 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:px-8 sm:py-10"
          id="review-data"
        >
          <AdminCoinPreviewLayout
            submission={submission}
            imageEdit={imageEditHandlers}
            hasRevisionNotes={Boolean(revisionInfo?.needsRevision)}
            baselineValues={baselineValues}
            editDraftValues={editDraft?.values ?? null}
            galleryChanged={galleryChanged}
            obverseDraftFile={Boolean(editDraft?.obverseFile)}
            reverseDraftFile={Boolean(editDraft?.reverseFile)}
          />
        </div>

        {/* RIGHT — sticky admin sidebar */}
        <div className="space-y-4 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:self-start">

          {/* Review panel */}
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

          {/* Submission context */}
          <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Submission details
            </p>
            <dl className="mt-3 space-y-2">
              <div className="flex items-start justify-between gap-2 text-[12px]">
                <dt className="text-slate-400">ID</dt>
                <dd className="font-mono font-medium text-slate-700">#{submission.id}</dd>
              </div>
              <div className="flex items-start justify-between gap-2 text-[12px]">
                <dt className="text-slate-400">Submitted</dt>
                <dd className="text-right font-medium text-slate-700">
                  {formatSubmittedDate(submission.date)}
                </dd>
              </div>
              {submission.country ? (
                <div className="flex items-start justify-between gap-2 text-[12px]">
                  <dt className="text-slate-400">Country</dt>
                  <dd className="text-right font-medium text-slate-700">{submission.country}</dd>
                </div>
              ) : null}
              {submission.year ? (
                <div className="flex items-start justify-between gap-2 text-[12px]">
                  <dt className="text-slate-400">Year</dt>
                  <dd className="font-medium text-slate-700">{submission.year}</dd>
                </div>
              ) : null}
              {submission.denomination ? (
                <div className="flex items-start justify-between gap-2 text-[12px]">
                  <dt className="text-slate-400">Denomination</dt>
                  <dd className="text-right font-medium text-slate-700">{submission.denomination}</dd>
                </div>
              ) : null}
              {submission.status === 'pending' ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <Link
                    to={`/my-submissions/${submission.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Edit submission
                  </Link>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Activity timeline */}
          <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Activity timeline
            </p>
            {hasActivityLogsField && activityLogs ? (
              <SubmissionActivityTimeline
                activityLogs={activityLogs}
                submissionId={submission.id}
              />
            ) : (
              <SubmissionTimeline events={timelineEvents} />
            )}
          </div>
        </div>
      </div>

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
