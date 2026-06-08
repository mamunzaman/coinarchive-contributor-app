import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CoinEntryWizard } from '../components/coin/CoinEntryWizard'
import { CoinFormFields } from '../components/coin/CoinFormFields'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  ApiError,
  getFormOptions,
  getMySubmission,
  updateMySubmission,
  type CoinSubmissionDetail,
} from '../lib/api'
import { appendCoinFormData, appendSubmissionImageUpdateFormData } from '../lib/coinFormData'
import { getAuthToken, getContributorRole } from '../lib/auth'
import { validateGalleryFiles } from '../components/ui/MultiImageUploadField'
import {
  validateImageFile,
  validateNewCoinForm,
  type NewCoinFieldErrors,
} from '../lib/validation'
import {
  coinFormValuesFromSubmission,
  applyMintVariantsModeChange,
  type CoinFormValues,
  type MintVariantRow,
} from '../types/coinForm'
import {
  getStepForValidationErrors,
  getVisibleCoinFormSteps,
  type CoinFormStepId,
} from '../types/coinFormSteps'
import { EMPTY_FORM_OPTIONS, type FormOptions } from '../types/formOptions'
import { useObjectPreviewUrl } from '../hooks/useObjectPreviewUrl'

const FORM_ID = 'coin-entry-form'

export function EditSubmissionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const submissionId = Number.parseInt(id ?? '', 10)

  const contributorRole = getContributorRole()
  const isAdmin = contributorRole === 'admin'
  const steps = useMemo(() => getVisibleCoinFormSteps(isAdmin), [isAdmin])

  const [submission, setSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [values, setValues] = useState<CoinFormValues | null>(null)
  const [fieldErrors, setFieldErrors] = useState<NewCoinFieldErrors>({})
  const [obverseFile, setObverseFile] = useState<File | null>(null)
  const [reverseFile, setReverseFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [removedGalleryImageIds, setRemovedGalleryImageIds] = useState<number[]>([])
  const [galleryReplacements, setGalleryReplacements] = useState<Record<number, File>>({})
  const [permanentDeleteGalleryIds, setPermanentDeleteGalleryIds] = useState<number[]>([])
  const [galleryReplacementPreviews, setGalleryReplacementPreviews] = useState<
    Record<number, string>
  >({})
  const [obverseError, setObverseError] = useState<string | null>(null)
  const [reverseError, setReverseError] = useState<string | null>(null)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [activeStepId, setActiveStepId] = useState<CoinFormStepId>('core-identity')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [notEditable, setNotEditable] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formOptions, setFormOptions] = useState<FormOptions>(EMPTY_FORM_OPTIONS)
  const [formOptionsLoading, setFormOptionsLoading] = useState(true)
  const [formOptionsFailed, setFormOptionsFailed] = useState(false)

  const obversePreviewUrl = useObjectPreviewUrl(obverseFile, submission?.images.obverse?.url)
  const reversePreviewUrl = useObjectPreviewUrl(reverseFile, submission?.images.reverse?.url)

  const activeIndex = steps.findIndex((step) => step.id === activeStepId)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const isFirstStep = safeIndex === 0
  const isLastStep = safeIndex === steps.length - 1

  async function loadSubmission() {
    setIsLoading(true)
    setError(null)
    setNotFound(false)
    setNotEditable(false)
    setSuccessMessage(null)
    setFormOptionsLoading(true)
    setFormOptionsFailed(false)

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
      const [submissionResponse, optionsResult] = await Promise.allSettled([
        getMySubmission(submissionId, token),
        getFormOptions(token),
      ])

      if (submissionResponse.status === 'rejected') {
        throw submissionResponse.reason
      }

      setSubmission(submissionResponse.value.submission)
      setValues(coinFormValuesFromSubmission(submissionResponse.value.submission))
      setRemovedGalleryImageIds([])
      setGalleryFiles([])
      setGalleryReplacements({})
      setPermanentDeleteGalleryIds([])
      setObverseFile(null)
      setReverseFile(null)
      setActiveStepId('core-identity')

      if (submissionResponse.value.submission.status !== 'pending') {
        setNotEditable(true)
      }

      if (optionsResult.status === 'fulfilled') {
        setFormOptions(optionsResult.value.options)
        setFormOptionsFailed(false)
      } else {
        setFormOptionsFailed(true)
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setFormOptionsLoading(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSubmission()
  }, [id])

  useEffect(() => {
    const next: Record<number, string> = {}
    for (const [id, file] of Object.entries(galleryReplacements)) {
      next[Number(id)] = URL.createObjectURL(file)
    }
    setGalleryReplacementPreviews(next)

    return () => {
      for (const url of Object.values(next)) {
        URL.revokeObjectURL(url)
      }
    }
  }, [galleryReplacements])

  function updateField<K extends keyof CoinFormValues>(field: K, value: CoinFormValues[K]) {
    if (!values) {
      return
    }

    setValues((current) => (current ? { ...current, [field]: value } : current))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setError(null)
    setSuccessMessage(null)
  }

  function handleObverseChange(file: File | null) {
    setObverseFile(file)
    setObverseError(file ? validateImageFile(file) : null)
    setError(null)
    setSuccessMessage(null)
  }

  function handleReverseChange(file: File | null) {
    setReverseFile(file)
    setReverseError(file ? validateImageFile(file) : null)
    setError(null)
    setSuccessMessage(null)
  }

  function handleGalleryChange(files: File[]) {
    setGalleryFiles(files)
    setGalleryError(validateGalleryFiles(files))
    setError(null)
    setSuccessMessage(null)
  }

  function handleGalleryImageRemoveToggle(imageId: number, remove: boolean) {
    setRemovedGalleryImageIds((current) => {
      if (remove) {
        return current.includes(imageId) ? current : [...current, imageId]
      }

      return current.filter((id) => id !== imageId)
    })
    setPermanentDeleteGalleryIds((current) => current.filter((id) => id !== imageId))
    setError(null)
    setSuccessMessage(null)
  }

  function handleGalleryReplace(imageId: number, file: File) {
    const replaceError = validateGalleryFiles([file])
    if (replaceError) {
      setGalleryError(replaceError)
      return
    }

    setGalleryReplacements((current) => ({ ...current, [imageId]: file }))
    setRemovedGalleryImageIds((current) => current.filter((id) => id !== imageId))
    setPermanentDeleteGalleryIds((current) => current.filter((id) => id !== imageId))
    setGalleryError(null)
    setError(null)
    setSuccessMessage(null)
  }

  function handleCancelGalleryReplace(imageId: number) {
    setGalleryReplacements((current) => {
      const next = { ...current }
      delete next[imageId]
      return next
    })
    setGalleryError(null)
    setError(null)
    setSuccessMessage(null)
  }

  function handleGalleryPermanentDelete(imageId: number) {
    setPermanentDeleteGalleryIds((current) =>
      current.includes(imageId) ? current : [...current, imageId],
    )
    setRemovedGalleryImageIds((current) =>
      current.includes(imageId) ? current : [...current, imageId],
    )
    setGalleryReplacements((current) => {
      const next = { ...current }
      delete next[imageId]
      return next
    })
    setError(null)
    setSuccessMessage(null)
  }

  function handleMintVariantsChange(variants: MintVariantRow[]) {
    if (!values) {
      return
    }

    setValues({ ...values, mintVariants: variants })
    setError(null)
    setSuccessMessage(null)
  }

  function handleHasMintVariantsChange(hasMintVariants: boolean) {
    if (!values) {
      return
    }

    setValues({ ...values, ...applyMintVariantsModeChange(values, hasMintVariants) })
    setError(null)
    setSuccessMessage(null)
  }

  const detailPath = `/my-submissions/${submissionId}`

  function goBack() {
    if (isFirstStep) {
      navigate(detailPath)
      return
    }

    setActiveStepId(steps[safeIndex - 1].id)
  }

  function goContinue() {
    if (!isLastStep) {
      setActiveStepId(steps[safeIndex + 1].id)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values || notEditable) {
      return
    }

    setError(null)
    setSuccessMessage(null)

    const errors = validateNewCoinForm(values)
    const nextObverseError = obverseFile ? validateImageFile(obverseFile) : null
    const nextReverseError = reverseFile ? validateImageFile(reverseFile) : null
    const nextGalleryError = validateGalleryFiles(galleryFiles)
    const replacementFiles = Object.values(galleryReplacements)
    const nextGalleryReplaceError =
      replacementFiles.length > 0 ? validateGalleryFiles(replacementFiles) : null

    setFieldErrors(errors)
    setObverseError(nextObverseError)
    setReverseError(nextReverseError)
    setGalleryError(nextGalleryError ?? nextGalleryReplaceError)

    if (
      Object.keys(errors).length > 0 ||
      nextObverseError ||
      nextReverseError ||
      nextGalleryError ||
      nextGalleryReplaceError
    ) {
      setActiveStepId(
        getStepForValidationErrors(errors, {
          obverse: nextObverseError,
          reverse: nextReverseError,
          gallery: nextGalleryError ?? nextGalleryReplaceError,
        }),
      )
      return
    }

    const token = getAuthToken()
    if (!token) {
      setError('Your session has expired. Please sign in again.')
      return
    }

    if (!submission) {
      return
    }

    setIsSubmitting(true)

    try {
      let currentSubmission = submission

      for (const [id, file] of Object.entries(galleryReplacements)) {
        const replaceFormData = new FormData()
        appendSubmissionImageUpdateFormData(replaceFormData, currentSubmission, {
          replaceGallery: { imageId: Number(id), file },
        })
        const replaceResponse = await updateMySubmission(submissionId, replaceFormData, token)
        currentSubmission = replaceResponse.submission
      }

      const formData = new FormData()
      appendCoinFormData(
        formData,
        values,
        {
          obverse: obverseFile,
          reverse: reverseFile,
          oldObverseImageId: obverseFile ? currentSubmission.images.obverse?.id : undefined,
          oldReverseImageId: reverseFile ? currentSubmission.images.reverse?.id : undefined,
          gallery: galleryFiles,
          removeGalleryImageIds: removedGalleryImageIds,
          deleteGalleryAttachmentIds: permanentDeleteGalleryIds,
        },
        {
          includeEmptyOptionalFields: true,
          isAdmin,
        },
      )

      const response = await updateMySubmission(submissionId, formData, token)
      setSubmission(response.submission)
      setValues(coinFormValuesFromSubmission(response.submission))
      setObverseFile(null)
      setReverseFile(null)
      setGalleryFiles([])
      setRemovedGalleryImageIds([])
      setGalleryReplacements({})
      setPermanentDeleteGalleryIds([])
      setSuccessMessage(response.message ?? 'Submission updated successfully.')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'rest_submission_not_editable') {
        setNotEditable(true)
        setError('Published submissions cannot be edited.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-navy-muted">Loading submission…</p>
          </div>
        </Card>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <h2 className="font-serif text-xl font-semibold text-navy">Submission not found</h2>
            <Link
              to="/my-submissions"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Back to My Submissions
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (notEditable && submission) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card>
          <div className="flex flex-col gap-4 py-4 text-center">
            <p className="text-sm text-navy-muted">Published submissions cannot be edited.</p>
            <Link
              to={detailPath}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-navy transition-all duration-200 hover:border-navy/20 hover:bg-muted"
            >
              View submission
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (successMessage) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card>
          <div
            role="status"
            className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
          >
            <p className="font-medium">{successMessage}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={detailPath}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                View updated submission
              </Link>
              <Button type="button" variant="secondary" onClick={() => setSuccessMessage(null)}>
                Continue editing
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!values || !submission) {
    return null
  }

  return (
    <CoinEntryWizard
      mode="edit"
      steps={steps}
      activeStepId={activeStepId}
      onStepChange={setActiveStepId}
      onBack={goBack}
      onContinue={goContinue}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      isSubmitting={isSubmitting}
      submitLabel="Save changes"
      previewTitle={values.title.trim() || submission.title}
      previewObverseUrl={obversePreviewUrl}
      previewReverseUrl={reversePreviewUrl}
      statusMessage={`Editing pending submission #${submissionId}`}
      formId={FORM_ID}
      alerts={
        error ? (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        <CoinFormFields
          activeStep={activeStepId}
          values={values}
          fieldErrors={fieldErrors}
          onFieldChange={updateField}
          contributorRole={contributorRole}
          disabled={isSubmitting}
          formOptions={formOptions}
          formOptionsLoading={formOptionsLoading}
          formOptionsFailed={formOptionsFailed}
          obverseFile={obverseFile}
          reverseFile={reverseFile}
          galleryFiles={galleryFiles}
          obverseError={obverseError ?? undefined}
          reverseError={reverseError ?? undefined}
          galleryError={galleryError ?? undefined}
          onObverseChange={handleObverseChange}
          onReverseChange={handleReverseChange}
          onGalleryChange={handleGalleryChange}
          onMintVariantsChange={handleMintVariantsChange}
          onHasMintVariantsChange={handleHasMintVariantsChange}
          imageEditMode
          currentObverseUrl={obversePreviewUrl}
          currentReverseUrl={reversePreviewUrl}
          existingGalleryImages={submission.images.gallery ?? []}
          removedGalleryImageIds={removedGalleryImageIds}
          onGalleryImageRemoveToggle={handleGalleryImageRemoveToggle}
          galleryReplacementPreviews={galleryReplacementPreviews}
          onGalleryReplace={handleGalleryReplace}
          onCancelGalleryReplace={handleCancelGalleryReplace}
          allowGalleryPermanentDelete={isAdmin}
          onGalleryPermanentDelete={handleGalleryPermanentDelete}
        />
      </form>
    </CoinEntryWizard>
  )
}
