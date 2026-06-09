import { useEffect, useMemo, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CoinEntryWizard } from '../components/coin/CoinEntryWizard'
import { CoinFormFields } from '../components/coin/CoinFormFields'
import { DuplicateDraftInfoCard, DuplicateWarningCard } from '../components/coin/DuplicateWarningCard'
import { ReviewSubmissionStep } from '../components/coin/ReviewSubmissionStep'
import { SubmissionRevisionNotes } from '../components/coin/SubmissionRevisionNotes'
import { SubmissionWorkflowPanel } from '../components/coin/SubmissionWorkflowPanel'
import { CoinCataloguePreviewCard } from '../components/coin/CoinCataloguePreviewCard'
import { SubmissionRevisionComparison } from '../components/coin/SubmissionRevisionComparison'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext'
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard'
import { useDuplicateCheck } from '../hooks/useDuplicateCheck'
import { useCoinDraft } from '../hooks/useCoinDraft'
import { useCoinPostTitle } from '../hooks/useCoinPostTitle'
import {
  ApiError,
  getFormOptions,
  getMySubmission,
  updateMySubmission,
  type CoinSubmissionDetail,
} from '../lib/api'
import { appendCoinFormData, appendSubmissionImageUpdateFormData } from '../lib/coinFormData'
import { normalizeCoinFormValues } from '../lib/coinFormNormalize'
import { resolveCoinPostTitle, generateCoinPostSlug } from '../lib/coinTitle'
import { areCoinFormValuesEqual, hasPendingCoinImageChanges } from '../lib/coinFormDirty'
import {
  clearFormDraft,
  getDraftStorageKey,
  loadFormDraft,
  restoreFilesFromDraft,
} from '../lib/formDraftStorage'
import { getAuthToken, getContributorRole } from '../lib/auth'
import { getSubmissionRevisionInfo } from '../lib/submissionRevisionNotes'
import { validateGalleryFiles } from '../components/ui/MultiImageUploadField'
import { hasGalleryImageChanges } from '../lib/revisionComparison'
import {
  validateImageFile,
  validateNewCoinForm,
  type NewCoinFieldErrors,
} from '../lib/validation'
import {
  coinFormValuesFromSubmission,
  applyMintVariantsModeChange,
  EMPTY_COIN_FORM_VALUES,
  type CoinFormValues,
  type MintVariantRow,
} from '../types/coinForm'
import {
  getStepForValidationErrors,
  getVisibleCoinFormSteps,
  type CoinFormStepId,
} from '../types/coinFormSteps'
import {
  getDefaultImagePreviewUrl,
  getImagePreviewSource,
  hasEffectiveCoinImage,
} from '../lib/imagePreview'
import {
  EMPTY_DEFAULT_IMAGES,
  EMPTY_FORM_OPTIONS,
  type DefaultImages,
  type FormOptions,
} from '../types/formOptions'
import { useObjectPreviewUrl } from '../hooks/useObjectPreviewUrl'
import type { WizardSaveState } from '../components/coin/WizardStatusBar'
import { computeCompletenessScore } from '../lib/completenessScore'
import { findStepCompletion, getCoinStepCompletion } from '../lib/stepCompletion'

const FORM_ID = 'coin-entry-form'

export function EditSubmissionPage() {
  const { requestNavigation } = useUnsavedChanges()
  const { id } = useParams<{ id: string }>()
  const submissionId = Number.parseInt(id ?? '', 10)

  const contributorRole = getContributorRole()
  const isAdmin = contributorRole === 'admin'
  const steps = useMemo(() => getVisibleCoinFormSteps(isAdmin), [isAdmin])

  const [submission, setSubmission] = useState<CoinSubmissionDetail | null>(null)
  const [values, setValues] = useState<CoinFormValues | null>(null)
  const [savedValues, setSavedValues] = useState<CoinFormValues | null>(null)
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
  const [defaultImages, setDefaultImages] = useState<DefaultImages>(EMPTY_DEFAULT_IMAGES)
  const [formOptionsLoading, setFormOptionsLoading] = useState(true)
  const [formOptionsFailed, setFormOptionsFailed] = useState(false)
  const [saveDraftMessage, setSaveDraftMessage] = useState<string | null>(null)
  const [draftNotice, setDraftNotice] = useState<string | null>(null)
  const [titleManualOverride, setTitleManualOverride] = useState(false)

  const setCoinFormValues = useCallback(
    (updater: React.SetStateAction<CoinFormValues>) => {
      setValues((current) => {
        if (!current) {
          return current
        }

        return typeof updater === 'function' ? updater(current) : updater
      })
    },
    [],
  )

  const { handleTitleChange, regenerateTitle } = useCoinPostTitle({
    values: values ?? EMPTY_COIN_FORM_VALUES,
    setValues: setCoinFormValues,
    formOptions,
    titleManualOverride,
    setTitleManualOverride,
    enabled: Boolean(values),
  })

  const existingObverseUrl = submission?.images.obverse?.url ?? null
  const existingReverseUrl = submission?.images.reverse?.url ?? null
  const defaultObversePreviewUrl = getDefaultImagePreviewUrl(defaultImages.obverse)
  const defaultReversePreviewUrl = getDefaultImagePreviewUrl(defaultImages.reverse)
  const obversePreviewUrl = useObjectPreviewUrl(
    obverseFile,
    existingObverseUrl ?? defaultObversePreviewUrl,
  )
  const reversePreviewUrl = useObjectPreviewUrl(
    reverseFile,
    existingReverseUrl ?? defaultReversePreviewUrl,
  )
  const obversePreviewSource = getImagePreviewSource(
    obverseFile,
    existingObverseUrl,
    defaultImages.obverse,
  )
  const reversePreviewSource = getImagePreviewSource(
    reverseFile,
    existingReverseUrl,
    defaultImages.reverse,
  )

  const activeIndex = steps.findIndex((step) => step.id === activeStepId)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const isFirstStep = safeIndex === 0
  const isReviewStep = activeStepId === 'review-submission'

  const galleryPreviewUrls = useMemo(
    () => galleryFiles.map((file) => URL.createObjectURL(file)),
    [galleryFiles],
  )

  useEffect(() => {
    return () => {
      for (const url of galleryPreviewUrls) {
        URL.revokeObjectURL(url)
      }
    }
  }, [galleryPreviewUrls])

  const isDirty = useMemo(() => {
    if (!values || !savedValues) {
      return false
    }

    return (
      !areCoinFormValuesEqual(values, savedValues) ||
      hasPendingCoinImageChanges({
        obverseFile,
        reverseFile,
        galleryFiles,
        removedGalleryImageIds,
        galleryReplacements,
        permanentDeleteGalleryIds,
      })
    )
  }, [
    values,
    savedValues,
    obverseFile,
    reverseFile,
    galleryFiles,
    removedGalleryImageIds,
    galleryReplacements,
    permanentDeleteGalleryIds,
  ])

  useUnsavedChangesGuard(isDirty)

  const token = getAuthToken()
  const duplicateCheckValues = useMemo(() => {
    const currentValues = values ?? EMPTY_COIN_FORM_VALUES
    return {
      ...currentValues,
      title: resolveCoinPostTitle(currentValues, { formOptions }),
    }
  }, [formOptions, values])
  const {
    status: duplicateCheckStatus,
    matches: duplicateMatches,
    checkNow: checkDuplicatesNow,
  } = useDuplicateCheck({
    token,
    values: duplicateCheckValues,
    formOptions,
    excludeSubmissionId: submissionId,
    enabled: Boolean(token) && Boolean(values) && isReviewStep,
  })

  const {
    draftKey,
    lastSavedAt,
    saveError,
    saveState: draftSaveState,
    hasPendingChanges,
    saveDraftNow,
  } = useCoinDraft({
    kind: 'edit',
    submissionId,
    values: values ?? EMPTY_COIN_FORM_VALUES,
    obverseFile,
    reverseFile,
    galleryFiles,
    removedGalleryImageIds,
    activeStepId,
    titleManualOverride,
    isDirty,
    enabled: Boolean(values) && !notEditable,
  })

  const hasExistingObverse = Boolean(existingObverseUrl && !obverseFile)
  const hasExistingReverse = Boolean(existingReverseUrl && !reverseFile)
  const hasObverse = hasEffectiveCoinImage(obverseFile, existingObverseUrl, defaultImages.obverse)
  const hasReverse = hasEffectiveCoinImage(reverseFile, existingReverseUrl, defaultImages.reverse)
  const existingGalleryCount = useMemo(() => {
    if (!submission) {
      return 0
    }

    return (submission.images.gallery ?? []).filter(
      (image) =>
        !removedGalleryImageIds.includes(image.id) &&
        !permanentDeleteGalleryIds.includes(image.id),
    ).length
  }, [submission, removedGalleryImageIds, permanentDeleteGalleryIds])

  const completionPercent = useMemo(
    () =>
      computeCompletenessScore({
        values: values ?? EMPTY_COIN_FORM_VALUES,
        hasObverse,
        hasReverse,
        hasGallery: galleryFiles.length > 0 || existingGalleryCount > 0,
      }).score,
    [values, hasObverse, hasReverse, galleryFiles.length, existingGalleryCount],
  )

  const stepCompletion = useMemo(
    () =>
      getCoinStepCompletion(
        values ?? EMPTY_COIN_FORM_VALUES,
        {
          hasObverse,
          hasReverse,
          galleryCount: galleryFiles.length + existingGalleryCount,
        },
        {
          isAdmin,
          fieldErrors,
          imageErrors: {
            obverse: obverseError,
            reverse: reverseError,
            gallery: galleryError,
          },
        },
      ),
    [
      values,
      hasObverse,
      hasReverse,
      galleryFiles.length,
      existingGalleryCount,
      isAdmin,
      fieldErrors,
      obverseError,
      reverseError,
      galleryError,
    ],
  )

  const activeStepIssues = useMemo(
    () => findStepCompletion(stepCompletion, activeStepId)?.issues,
    [stepCompletion, activeStepId],
  )

  const wizardSaveState = useMemo((): WizardSaveState => {
    if (isSubmitting) {
      return 'saving'
    }

    return draftSaveState
  }, [isSubmitting, draftSaveState])

  const wizardStatusBar = useMemo(
    () => ({
      completionPercent,
      stepCompletion,
      isDirty,
      hasDraft: Boolean(lastSavedAt),
      isEditMode: true,
      isAdmin,
      duplicateCheckStatus,
      saveState: wizardSaveState,
      lastSavedAt,
      hasPendingChanges,
    }),
    [
      completionPercent,
      stepCompletion,
      isDirty,
      lastSavedAt,
      hasPendingChanges,
      isAdmin,
      duplicateCheckStatus,
      wizardSaveState,
    ],
  )

  const imageWorkspaceSummary = useMemo(
    () => ({
      obverseUrl: obversePreviewUrl,
      reverseUrl: reversePreviewUrl,
      obverseSource: obversePreviewSource,
      reverseSource: reversePreviewSource,
      formOptionsLoading,
      hasObverse,
      hasReverse,
      galleryCount: galleryFiles.length + existingGalleryCount,
      onJumpToImages: () => setActiveStepId('images'),
    }),
    [
      obversePreviewUrl,
      reversePreviewUrl,
      obversePreviewSource,
      reversePreviewSource,
      formOptionsLoading,
      hasObverse,
      hasReverse,
      galleryFiles.length,
      existingGalleryCount,
    ],
  )

  function restoreDraftIfPresent(loadedValues: CoinFormValues) {
    const draft = loadFormDraft(getDraftStorageKey('edit', submissionId))
    if (!draft) {
      setTitleManualOverride(Boolean(loadedValues.title.trim()))
      return loadedValues
    }

    const restoredFiles = restoreFilesFromDraft(draft)
    setObverseFile(restoredFiles.obverseFile)
    setReverseFile(restoredFiles.reverseFile)
    setGalleryFiles(restoredFiles.galleryFiles)
    setRemovedGalleryImageIds(restoredFiles.removedGalleryImageIds)
    if (draft.activeStepId) {
      setActiveStepId(draft.activeStepId)
    }
    setTitleManualOverride(draft.titleManualOverride ?? false)
    setDraftNotice('Your saved draft was restored automatically.')
    return draft.values
  }

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
      const loadedValues = coinFormValuesFromSubmission(submissionResponse.value.submission)
      const restoredValues = restoreDraftIfPresent(loadedValues)
      setValues(restoredValues)
      setSavedValues(loadedValues)
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
        setDefaultImages(optionsResult.value.default_images ?? EMPTY_DEFAULT_IMAGES)
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
      requestNavigation(detailPath)
      return
    }

    setActiveStepId(steps[safeIndex - 1].id)
  }

  function goContinue() {
    if (isReviewStep) {
      return
    }

    setActiveStepId(steps[safeIndex + 1].id)
  }

  async function handleSaveDraft() {
    const saved = await saveDraftNow()
    setSaveDraftMessage(saved ? 'Draft saved on this device.' : null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values || notEditable) {
      return
    }

    if (isSubmitting) {
      return
    }

    setError(null)
    setSuccessMessage(null)

    const normalizedValues = normalizeCoinFormValues(values, { formOptions })
    const finalTitle = resolveCoinPostTitle(normalizedValues, { formOptions })
    const valuesForSubmit = {
      ...normalizedValues,
      title: finalTitle,
    }
    const postSlug = generateCoinPostSlug(finalTitle)
    setValues(valuesForSubmit)

    const errors = validateNewCoinForm(valuesForSubmit, {
      formOptions,
      formOptionsReady: !formOptionsLoading && !formOptionsFailed,
      formOptionsFailed,
    })
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

    await checkDuplicatesNow({ force: true })

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
        valuesForSubmit,
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
          postSlug,
        },
      )

      const response = await updateMySubmission(submissionId, formData, token)
      const nextValues = coinFormValuesFromSubmission(response.submission)
      setSubmission(response.submission)
      setValues(nextValues)
      setSavedValues(nextValues)
      setObverseFile(null)
      setReverseFile(null)
      setGalleryFiles([])
      setRemovedGalleryImageIds([])
      setGalleryReplacements({})
      setPermanentDeleteGalleryIds([])
      clearFormDraft(draftKey)
      setSuccessMessage('Changes saved.')
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
          <div className="flex flex-col gap-4 py-4">
            <SubmissionRevisionNotes submission={submission} />
            <p className="text-center text-sm text-navy-muted">
              This submission cannot be edited in its current status.
            </p>
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

  if (!values || !submission) {
    return null
  }

  const existingGalleryUrls = (submission.images.gallery ?? [])
    .filter((image) => !removedGalleryImageIds.includes(image.id))
    .filter((image) => !permanentDeleteGalleryIds.includes(image.id))
    .map((image) => galleryReplacementPreviews[image.id] ?? image.url)

  return (
    <CoinEntryWizard
      mode="edit"
      steps={steps}
      activeStepId={activeStepId}
      onStepChange={setActiveStepId}
      onBack={goBack}
      onContinue={goContinue}
      isFirstStep={isFirstStep}
      isReviewStep={isReviewStep}
      isSubmitting={isSubmitting}
      submitLabel="Save changes"
      previewTitle={values.title.trim() || submission.title}
      previewObverseUrl={obversePreviewUrl}
      previewReverseUrl={reversePreviewUrl}
      previewObverseSource={obversePreviewSource}
      previewReverseSource={reversePreviewSource}
      formOptionsLoading={formOptionsLoading}
      onSaveDraft={() => void handleSaveDraft()}
      saveDraftMessage={saveDraftMessage}
      statusBar={wizardStatusBar}
      imageWorkspaceSummary={imageWorkspaceSummary}
      cataloguePreview={
        <CoinCataloguePreviewCard
          values={values}
          obversePreviewUrl={obversePreviewUrl}
          reversePreviewUrl={reversePreviewUrl}
          obversePreviewSource={obversePreviewSource}
          reversePreviewSource={reversePreviewSource}
          formOptionsLoading={formOptionsLoading}
          countries={formOptions.countries}
        />
      }
      workflowPanel={
        <SubmissionWorkflowPanel
          values={values}
          obverseFile={obverseFile}
          reverseFile={reverseFile}
          galleryFiles={galleryFiles}
          hasExistingObverse={Boolean(submission.images.obverse?.url && !obverseFile)}
          hasExistingReverse={Boolean(submission.images.reverse?.url && !reverseFile)}
          existingGalleryCount={existingGalleryUrls.length}
          obversePreviewUrl={obversePreviewUrl}
          reversePreviewUrl={reversePreviewUrl}
          lastSavedAt={lastSavedAt}
          saveError={saveError}
          stepCompletion={stepCompletion}
          duplicateCheckStatus={duplicateCheckStatus}
          duplicateMatches={duplicateMatches}
          onJumpToStep={setActiveStepId}
        />
      }
      statusMessage={`Editing pending submission #${submissionId}`}
      formId={FORM_ID}
      alerts={
        <>
          <SubmissionRevisionNotes submission={submission} />
          {draftNotice ? (
            <div
              role="status"
              className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-navy"
            >
              {draftNotice}
            </div>
          ) : null}
          {successMessage ? (
            <div
              role="status"
              className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              <p className="font-medium">{successMessage}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link
                  to={detailPath}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  View submission
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  className="!min-h-10"
                  onClick={() => setSuccessMessage(null)}
                >
                  Continue editing
                </Button>
              </div>
            </div>
          ) : null}
          {error ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}
          {!isReviewStep ? (
            <div className="mb-5 space-y-3">
              <DuplicateWarningCard matches={duplicateMatches} />
              <DuplicateDraftInfoCard matches={duplicateMatches} />
            </div>
          ) : null}
          {savedValues && getSubmissionRevisionInfo(submission).needsRevision ? (
            <div className="mb-5">
              <SubmissionRevisionComparison
                previousValues={savedValues}
                currentValues={values}
                imageChanges={{
                  obverseChanged: Boolean(obverseFile),
                  reverseChanged: Boolean(reverseFile),
                  galleryChanged: hasGalleryImageChanges({
                    pendingAddCount: galleryFiles.length,
                    removedImageIds: removedGalleryImageIds,
                    replacementCount: Object.keys(galleryReplacements).length,
                    permanentDeleteIds: permanentDeleteGalleryIds,
                  }),
                }}
              />
            </div>
          ) : null}
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        {isReviewStep ? (
          <ReviewSubmissionStep
            values={values}
            isAdmin={isAdmin}
            formOptions={formOptions}
            formOptionsReady={!formOptionsLoading && !formOptionsFailed}
            duplicateCheckStatus={duplicateCheckStatus}
            formOptionsLoading={formOptionsLoading}
            duplicateMatches={duplicateMatches}
            obversePreviewUrl={obversePreviewUrl}
            reversePreviewUrl={reversePreviewUrl}
            obversePreviewSource={obversePreviewSource}
            reversePreviewSource={reversePreviewSource}
            galleryPreviewUrls={galleryPreviewUrls}
            hasExistingObverse={hasExistingObverse}
            hasExistingReverse={hasExistingReverse}
            existingGalleryUrls={existingGalleryUrls}
            titleManualOverride={titleManualOverride}
            titleError={fieldErrors.title}
            onTitleChange={handleTitleChange}
            onRegenerateTitle={regenerateTitle}
            disabled={isSubmitting}
          />
        ) : (
          <CoinFormFields
          activeStep={activeStepId}
          stepIssues={activeStepIssues}
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
          currentObverseUrl={existingObverseUrl}
          currentReverseUrl={existingReverseUrl}
          obversePreviewUrl={obversePreviewUrl}
          reversePreviewUrl={reversePreviewUrl}
          obversePreviewSource={obversePreviewSource}
          reversePreviewSource={reversePreviewSource}
          existingGalleryImages={submission.images.gallery ?? []}
          removedGalleryImageIds={removedGalleryImageIds}
          onGalleryImageRemoveToggle={handleGalleryImageRemoveToggle}
          galleryReplacementPreviews={galleryReplacementPreviews}
          onGalleryReplace={handleGalleryReplace}
          onCancelGalleryReplace={handleCancelGalleryReplace}
          allowGalleryPermanentDelete={isAdmin}
          onGalleryPermanentDelete={handleGalleryPermanentDelete}
        />
        )}
      </form>
    </CoinEntryWizard>
  )
}
