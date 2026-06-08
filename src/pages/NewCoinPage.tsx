import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CoinEntryWizard } from '../components/coin/CoinEntryWizard'
import { CoinFormFields } from '../components/coin/CoinFormFields'
import { DuplicateDraftInfoCard, DuplicateWarningCard } from '../components/coin/DuplicateWarningCard'
import { ReviewSubmissionStep } from '../components/coin/ReviewSubmissionStep'
import { SubmissionWorkflowPanel } from '../components/coin/SubmissionWorkflowPanel'
import { CoinCataloguePreviewCard } from '../components/coin/CoinCataloguePreviewCard'
import { Card } from '../components/ui/Card'
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext'
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard'
import { useDuplicateSubmissionCheck } from '../hooks/useDuplicateSubmissionCheck'
import { useCoinDraft } from '../hooks/useCoinDraft'
import { ApiError, getFormOptions, submitCoin, type SubmitCoinResponse } from '../lib/api'
import { appendCoinFormData } from '../lib/coinFormData'
import { areCoinFormValuesEqual, hasPendingCoinImageChanges } from '../lib/coinFormDirty'
import {
  clearFormDraft,
  getDraftStorageKey,
  loadFormDraft,
  restoreFilesFromDraft,
} from '../lib/formDraftStorage'
import { getAuthToken, getContributorRole } from '../lib/auth'
import { validateGalleryFiles } from '../components/ui/MultiImageUploadField'
import {
  validateImageFile,
  validateNewCoinForm,
  type NewCoinFieldErrors,
} from '../lib/validation'
import {
  EMPTY_COIN_FORM_VALUES,
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
import type { WizardSaveState } from '../components/coin/WizardStatusBar'
import { computeCompletenessScore } from '../lib/completenessScore'
import { findStepCompletion, getCoinStepCompletion } from '../lib/stepCompletion'

const FORM_ID = 'coin-entry-form'

export function NewCoinPage() {
  const { requestNavigation } = useUnsavedChanges()
  const contributorRole = getContributorRole()
  const isAdmin = contributorRole === 'admin'
  const steps = useMemo(() => getVisibleCoinFormSteps(isAdmin), [isAdmin])
  const draftRestoredRef = useRef(false)

  const [values, setValues] = useState<CoinFormValues>(EMPTY_COIN_FORM_VALUES)
  const [fieldErrors, setFieldErrors] = useState<NewCoinFieldErrors>({})
  const [formOptions, setFormOptions] = useState<FormOptions>(EMPTY_FORM_OPTIONS)
  const [formOptionsLoading, setFormOptionsLoading] = useState(true)
  const [formOptionsFailed, setFormOptionsFailed] = useState(false)
  const [obverseFile, setObverseFile] = useState<File | null>(null)
  const [reverseFile, setReverseFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [obverseError, setObverseError] = useState<string | null>(null)
  const [reverseError, setReverseError] = useState<string | null>(null)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [activeStepId, setActiveStepId] = useState<CoinFormStepId>('core-identity')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successResult, setSuccessResult] = useState<SubmitCoinResponse | null>(null)
  const [saveDraftMessage, setSaveDraftMessage] = useState<string | null>(null)
  const [draftNotice, setDraftNotice] = useState<string | null>(null)

  const obversePreviewUrl = useObjectPreviewUrl(obverseFile)
  const reversePreviewUrl = useObjectPreviewUrl(reverseFile)
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

  const activeIndex = steps.findIndex((step) => step.id === activeStepId)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const isFirstStep = safeIndex === 0
  const isReviewStep = activeStepId === 'review-submission'

  const isDirty = useMemo(
    () =>
      !areCoinFormValuesEqual(values, EMPTY_COIN_FORM_VALUES) ||
      hasPendingCoinImageChanges({ obverseFile, reverseFile, galleryFiles }),
    [values, obverseFile, reverseFile, galleryFiles],
  )

  useUnsavedChangesGuard(isDirty)

  const token = getAuthToken()
  const { status: duplicateCheckStatus, matches: duplicateMatches } = useDuplicateSubmissionCheck({
    token,
    values,
    enabled: Boolean(token),
  })

  const hasObverse = Boolean(obverseFile)
  const hasReverse = Boolean(reverseFile)
  const hasGallery = galleryFiles.length > 0

  const completionPercent = useMemo(
    () =>
      computeCompletenessScore({
        values,
        hasObverse,
        hasReverse,
        hasGallery,
      }).score,
    [values, hasObverse, hasReverse, hasGallery],
  )

  const stepCompletion = useMemo(
    () =>
      getCoinStepCompletion(
        values,
        { hasObverse, hasReverse, galleryCount: galleryFiles.length },
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

  const {
    draftKey,
    lastSavedAt,
    saveError,
    saveState: draftSaveState,
    hasPendingChanges,
    saveDraftNow,
  } = useCoinDraft({
    kind: 'new',
    values,
    obverseFile,
    reverseFile,
    galleryFiles,
    activeStepId,
    isDirty,
    enabled: !successResult,
  })

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
      isEditMode: false,
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
      hasObverse,
      hasReverse,
      galleryCount: galleryFiles.length,
      onJumpToImages: () => setActiveStepId('images'),
    }),
    [
      obversePreviewUrl,
      reversePreviewUrl,
      hasObverse,
      hasReverse,
      galleryFiles.length,
    ],
  )

  useEffect(() => {
    if (draftRestoredRef.current) {
      return
    }

    draftRestoredRef.current = true
    const draft = loadFormDraft(getDraftStorageKey('new'))
    if (!draft) {
      return
    }

    const restoredFiles = restoreFilesFromDraft(draft)
    setValues(draft.values)
    setObverseFile(restoredFiles.obverseFile)
    setReverseFile(restoredFiles.reverseFile)
    setGalleryFiles(restoredFiles.galleryFiles)
    if (draft.activeStepId) {
      setActiveStepId(draft.activeStepId)
    }
    setDraftNotice('Your saved draft was restored automatically.')
  }, [])

  useEffect(() => {
    async function loadFormOptions() {
      setFormOptionsLoading(true)
      setFormOptionsFailed(false)

      const authToken = getAuthToken()
      if (!authToken) {
        setFormOptionsFailed(true)
        setFormOptionsLoading(false)
        return
      }

      try {
        const response = await getFormOptions(authToken)
        setFormOptions(response.options)
      } catch {
        setFormOptionsFailed(true)
      } finally {
        setFormOptionsLoading(false)
      }
    }

    void loadFormOptions()
  }, [])

  function updateField<K extends keyof CoinFormValues>(field: K, value: CoinFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setApiError(null)
    setSuccessResult(null)
    setSaveDraftMessage(null)
  }

  function handleObverseChange(file: File | null) {
    setObverseFile(file)
    setObverseError(file ? validateImageFile(file) : null)
    setApiError(null)
    setSuccessResult(null)
  }

  function handleReverseChange(file: File | null) {
    setReverseFile(file)
    setReverseError(file ? validateImageFile(file) : null)
    setApiError(null)
    setSuccessResult(null)
  }

  function handleGalleryChange(files: File[]) {
    setGalleryFiles(files)
    setGalleryError(validateGalleryFiles(files))
    setApiError(null)
    setSuccessResult(null)
  }

  function handleMintVariantsChange(variants: MintVariantRow[]) {
    setValues((current) => ({ ...current, mintVariants: variants }))
    setApiError(null)
    setSuccessResult(null)
  }

  function handleHasMintVariantsChange(hasMintVariants: boolean) {
    setValues((current) => ({ ...current, ...applyMintVariantsModeChange(current, hasMintVariants) }))
    setApiError(null)
    setSuccessResult(null)
  }

  function resetForm() {
    setValues(EMPTY_COIN_FORM_VALUES)
    setFieldErrors({})
    setObverseFile(null)
    setReverseFile(null)
    setGalleryFiles([])
    setObverseError(null)
    setReverseError(null)
    setGalleryError(null)
    setActiveStepId('core-identity')
    setDraftNotice(null)
  }

  function goBack() {
    if (isFirstStep) {
      requestNavigation('/dashboard')
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

    if (!isReviewStep) {
      goContinue()
      return
    }

    if (isSubmitting) {
      return
    }

    setApiError(null)
    setSuccessResult(null)

    const errors = validateNewCoinForm(values, {
      formOptions,
      formOptionsReady: !formOptionsLoading && !formOptionsFailed,
      formOptionsFailed,
    })
    const nextObverseError = obverseFile ? validateImageFile(obverseFile) : 'Obverse image is required.'
    const nextReverseError = reverseFile ? validateImageFile(reverseFile) : 'Reverse image is required.'
    const nextGalleryError = validateGalleryFiles(galleryFiles)

    setFieldErrors(errors)
    setObverseError(nextObverseError)
    setReverseError(nextReverseError)
    setGalleryError(nextGalleryError)

    if (
      Object.keys(errors).length > 0 ||
      nextObverseError ||
      nextReverseError ||
      nextGalleryError
    ) {
      setActiveStepId(
        getStepForValidationErrors(errors, {
          obverse: nextObverseError,
          reverse: nextReverseError,
          gallery: nextGalleryError,
        }),
      )
      return
    }

    const authToken = getAuthToken()
    if (!authToken) {
      setApiError('Your session has expired. Please sign in again.')
      return
    }

    const formData = new FormData()
    appendCoinFormData(
      formData,
      values,
      { obverse: obverseFile, reverse: reverseFile, gallery: galleryFiles },
      { isAdmin },
    )

    setIsSubmitting(true)

    try {
      const response = await submitCoin(formData, authToken)
      clearFormDraft(draftKey)
      setSuccessResult(response)
      resetForm()
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message)
      } else {
        setApiError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successResult) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card>
          <div
            role="status"
            className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
          >
            <p className="font-medium">Coin submitted successfully and is pending review.</p>
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-semibold uppercase tracking-wide">Post ID</dt>
                <dd className="mt-1 font-mono">{successResult.post_id}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide">Status</dt>
                <dd className="mt-1 font-semibold uppercase">{successResult.status}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                to="/new-coin"
                onClick={() => setSuccessResult(null)}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Submit another coin
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-navy transition-all duration-200 hover:border-navy/20 hover:bg-muted"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <CoinEntryWizard
      mode="new"
      steps={steps}
      activeStepId={activeStepId}
      onStepChange={setActiveStepId}
      onBack={goBack}
      onContinue={goContinue}
      isFirstStep={isFirstStep}
      isReviewStep={isReviewStep}
      isSubmitting={isSubmitting}
      submitLabel="Submit for review"
      previewTitle={values.title.trim() || undefined}
      previewObverseUrl={obversePreviewUrl}
      previewReverseUrl={reversePreviewUrl}
      onSaveDraft={() => void handleSaveDraft()}
      saveDraftMessage={saveDraftMessage}
      statusBar={wizardStatusBar}
      imageWorkspaceSummary={imageWorkspaceSummary}
      cataloguePreview={
        <CoinCataloguePreviewCard
          values={values}
          obversePreviewUrl={obversePreviewUrl}
          reversePreviewUrl={reversePreviewUrl}
          countries={formOptions.countries}
        />
      }
      workflowPanel={
        <SubmissionWorkflowPanel
          values={values}
          obverseFile={obverseFile}
          reverseFile={reverseFile}
          galleryFiles={galleryFiles}
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
      formId={FORM_ID}
      alerts={
        <>
          {draftNotice ? (
            <div
              role="status"
              className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-navy"
            >
              {draftNotice}
            </div>
          ) : null}
          {apiError ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {apiError}
            </div>
          ) : null}
          {!isReviewStep ? (
            <div className="mb-5 space-y-3">
              <DuplicateWarningCard matches={duplicateMatches} />
              <DuplicateDraftInfoCard matches={duplicateMatches} />
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
            duplicateMatches={duplicateMatches}
            obversePreviewUrl={obversePreviewUrl}
            reversePreviewUrl={reversePreviewUrl}
            galleryPreviewUrls={galleryPreviewUrls}
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
          />
        )}
      </form>
    </CoinEntryWizard>
  )
}
