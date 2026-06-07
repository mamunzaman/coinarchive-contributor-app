import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SubmissionAdminInfo } from '../components/coin/SubmissionAdminInfo'
import {
  EMPTY_IMAGE_EDIT_STATE,
  hasPendingImageChanges,
  SubmissionDetailImages,
  validateImageEditState,
} from '../components/coin/SubmissionDetailImages'
import { SubmissionDetailHeader } from '../components/coin/SubmissionDetailHeader'
import { SubmissionDetailSections } from '../components/coin/SubmissionDetailSections'
import { SubmissionMintInfo } from '../components/coin/SubmissionMintInfo'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ApiError, getMySubmission, updateMySubmission, type CoinSubmissionDetail } from '../lib/api'
import { getAuthToken } from '../lib/auth'
import { appendSubmissionImageUpdateFormData } from '../lib/coinFormData'
import { canEditSubmission } from '../lib/submissionListUtils'

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number.parseInt(id ?? '', 10)

  const [submission, setSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [imageEdit, setImageEdit] = useState(EMPTY_IMAGE_EDIT_STATE)

  const resetImageEditState = useCallback(() => {
    setImageEdit(EMPTY_IMAGE_EDIT_STATE)
  }, [])

  async function loadSubmission() {
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    setSubmission(null)
    resetImageEditState()

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

  function handleStartImageEdit() {
    setImageEdit({
      ...EMPTY_IMAGE_EDIT_STATE,
      isEditing: true,
    })
  }

  function handleCancelImageEdit() {
    resetImageEditState()
  }

  function handleObverseChange(file: File | null) {
    setImageEdit((current) => ({
      ...current,
      obverseFile: file,
      obverseError: null,
      saveError: null,
    }))
  }

  function handleReverseChange(file: File | null) {
    setImageEdit((current) => ({
      ...current,
      reverseFile: file,
      reverseError: null,
      saveError: null,
    }))
  }

  function handleGalleryChange(files: File[]) {
    setImageEdit((current) => ({
      ...current,
      galleryFiles: files,
      galleryError: null,
      saveError: null,
    }))
  }

  function handleGalleryRemoveToggle(imageId: number, remove: boolean) {
    setImageEdit((current) => ({
      ...current,
      removedGalleryImageIds: remove
        ? [...current.removedGalleryImageIds, imageId]
        : current.removedGalleryImageIds.filter((id) => id !== imageId),
      saveError: null,
    }))
  }

  async function handleSaveImageChanges() {
    if (!submission || !hasPendingImageChanges(imageEdit)) {
      return
    }

    const validation = validateImageEditState(imageEdit)
    if (validation.obverseError || validation.reverseError || validation.galleryError) {
      setImageEdit((current) => ({
        ...current,
        ...validation,
      }))
      return
    }

    const token = getAuthToken()
    if (!token) {
      setImageEdit((current) => ({
        ...current,
        saveError: 'Your session has expired. Please sign in again.',
      }))
      return
    }

    setImageEdit((current) => ({ ...current, isSaving: true, saveError: null }))

    const formData = new FormData()
    appendSubmissionImageUpdateFormData(formData, submission, {
      obverse: imageEdit.obverseFile,
      reverse: imageEdit.reverseFile,
      gallery: imageEdit.galleryFiles,
      removeGalleryImageIds: imageEdit.removedGalleryImageIds,
    })

    try {
      const response = await updateMySubmission(submissionId, formData, token)
      setSubmission(response.submission)
      resetImageEditState()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'rest_submission_not_editable') {
        setImageEdit((current) => ({
          ...current,
          isSaving: false,
          saveError: 'This submission can no longer be edited.',
        }))
      } else if (err instanceof ApiError) {
        setImageEdit((current) => ({
          ...current,
          isSaving: false,
          saveError: err.message,
        }))
      } else {
        setImageEdit((current) => ({
          ...current,
          isSaving: false,
          saveError: 'Unable to save image changes. Check your connection and try again.',
        }))
      }
    }
  }

  const canEdit = submission ? canEditSubmission(submission) : false

  const imageEditHandlers = {
    canEdit,
    editState: imageEdit,
    onStartEdit: handleStartImageEdit,
    onCancelEdit: handleCancelImageEdit,
    onSave: () => void handleSaveImageChanges(),
    onObverseChange: handleObverseChange,
    onReverseChange: handleReverseChange,
    onGalleryChange: handleGalleryChange,
    onGalleryRemoveToggle: handleGalleryRemoveToggle,
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
