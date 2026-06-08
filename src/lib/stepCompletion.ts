import {
  COIN_RECORD_STATUS_OPTIONS,
  type CoinFormValues,
  type MintVariantRow,
} from '../types/coinForm'
import {
  COIN_FORM_STEPS,
  getVisibleCoinFormSteps,
  type CoinFormStepId,
} from '../types/coinFormSteps'

export type StepCompletionStatus = 'complete' | 'attention' | 'empty'

export type StepCompletionResult = {
  stepId: CoinFormStepId
  status: StepCompletionStatus
  completedCount: number
  totalCount: number
  label: string
}

export type StepCompletionImages = {
  hasObverse: boolean
  hasReverse: boolean
  galleryCount?: number
}

export type StepCompletionOptions = {
  isAdmin?: boolean
  fieldErrors?: Partial<Record<keyof CoinFormValues, string>>
  imageErrors?: {
    obverse?: string | null
    reverse?: string | null
    gallery?: string | null
  }
}

const CORE_IDENTITY_FIELDS = [
  'title',
  'country',
  'year',
  'denomination',
  'coin_type',
  'short_description',
] as const satisfies ReadonlyArray<keyof CoinFormValues>

const SPECIFICATION_FIELDS = [
  'released_date',
  'coin_mintage',
  'coin_material',
  'coin_quality',
  'coin_weight_g',
  'coin_diameter_mm',
  'coin_thickness_mm',
  'coin_edge_inscription',
] as const satisfies ReadonlyArray<keyof CoinFormValues>

const DESCRIPTION_FIELDS = [
  'coin_obverse_description',
  'coin_reverse_description',
  'coin_historical_background',
  'coin_collector_notes',
] as const satisfies ReadonlyArray<keyof CoinFormValues>

function isFilled(value: string | undefined | null): boolean {
  return Boolean(value?.trim())
}

function countFilledFields(values: CoinFormValues, fields: readonly (keyof CoinFormValues)[]): number {
  return fields.filter((field) => isFilled(String(values[field] ?? ''))).length
}

function isYearValid(year: string): boolean {
  const yearValue = year.trim()

  if (!yearValue || !/^\d+$/.test(yearValue)) {
    return false
  }

  const parsed = Number.parseInt(yearValue, 10)
  const minYear = 500
  const maxYear = new Date().getFullYear() + 1

  return parsed >= minYear && parsed <= maxYear
}

function isCoreIdentityFieldValid(
  field: (typeof CORE_IDENTITY_FIELDS)[number],
  values: CoinFormValues,
  fieldErrors?: StepCompletionOptions['fieldErrors'],
): boolean {
  if (fieldErrors?.[field]) {
    return false
  }

  if (field === 'year') {
    return isYearValid(values.year)
  }

  return isFilled(values[field])
}

function evaluateCoreIdentity(
  values: CoinFormValues,
  options: StepCompletionOptions,
): Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'> {
  const totalCount = CORE_IDENTITY_FIELDS.length
  const completedCount = CORE_IDENTITY_FIELDS.filter((field) =>
    isCoreIdentityFieldValid(field, values, options.fieldErrors),
  ).length
  const anyFilled = CORE_IDENTITY_FIELDS.some((field) => isFilled(String(values[field] ?? '')))

  if (completedCount === totalCount) {
    return { status: 'complete', completedCount, totalCount }
  }

  if (!anyFilled) {
    return { status: 'empty', completedCount, totalCount }
  }

  return { status: 'attention', completedCount, totalCount }
}

function evaluateImages(
  images: StepCompletionImages,
  options: StepCompletionOptions,
): Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'> {
  const totalCount = 2
  const hasObverse = images.hasObverse && !options.imageErrors?.obverse
  const hasReverse = images.hasReverse && !options.imageErrors?.reverse
  const completedCount = (hasObverse ? 1 : 0) + (hasReverse ? 1 : 0)

  if (hasObverse && hasReverse) {
    return { status: 'complete', completedCount, totalCount }
  }

  if (!images.hasObverse && !images.hasReverse) {
    return { status: 'empty', completedCount, totalCount }
  }

  return { status: 'attention', completedCount, totalCount }
}

function isValidMintVariant(row: MintVariantRow): boolean {
  return Boolean(row.mintMarkCode.trim())
}

function hasAnyMintData(values: CoinFormValues): boolean {
  if (values.hasMintVariants) {
    return values.mintVariants.some(
      (row) =>
        row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim(),
    )
  }

  return Boolean(values.singleMintMark.trim() || values.mintMarksAvailable.trim())
}

function evaluateMintInformation(
  values: CoinFormValues,
): Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'> {
  const totalCount = 1

  if (values.hasMintVariants) {
    const validVariants = values.mintVariants.filter(isValidMintVariant).length

    if (validVariants > 0) {
      return { status: 'complete', completedCount: 1, totalCount }
    }

    if (hasAnyMintData(values)) {
      return { status: 'attention', completedCount: 0, totalCount }
    }

    return { status: 'empty', completedCount: 0, totalCount }
  }

  if (values.singleMintMark.trim()) {
    return { status: 'complete', completedCount: 1, totalCount }
  }

  if (values.mintMarksAvailable.trim()) {
    return { status: 'attention', completedCount: 0, totalCount }
  }

  return { status: 'empty', completedCount: 0, totalCount }
}

function evaluateOptionalFieldSection(
  values: CoinFormValues,
  fields: readonly (keyof CoinFormValues)[],
  completeMin: number,
  attentionMin: number,
): Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'> {
  const totalCount = fields.length
  const completedCount = countFilledFields(values, fields)

  if (completedCount >= completeMin) {
    return { status: 'complete', completedCount, totalCount }
  }

  if (completedCount >= attentionMin) {
    return { status: 'attention', completedCount, totalCount }
  }

  return { status: 'empty', completedCount, totalCount }
}

function isRecordStatusValid(status: CoinFormValues['coin_record_status']): boolean {
  return COIN_RECORD_STATUS_OPTIONS.includes(status)
}

function evaluateStatusAdmin(
  values: CoinFormValues,
): Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'> {
  const totalCount = 4
  const completedCount =
    (values.coin_is_published_catalogue ? 1 : 0) +
    (values.coin_is_featured ? 1 : 0) +
    (values.coin_is_app_enabled ? 1 : 0) +
    (isRecordStatusValid(values.coin_record_status) ? 1 : 0)

  if (!isRecordStatusValid(values.coin_record_status)) {
    return { status: 'attention', completedCount, totalCount }
  }

  return { status: 'complete', completedCount, totalCount }
}

function evaluateReviewSubmission(
  core: Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'>,
  images: Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'>,
): Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'> {
  const totalCount = 2
  const requiredComplete =
    (core.status === 'complete' ? 1 : 0) + (images.status === 'complete' ? 1 : 0)

  if (core.status === 'empty' && images.status === 'empty') {
    return { status: 'empty', completedCount: 0, totalCount }
  }

  if (core.status === 'attention' || images.status === 'attention') {
    return { status: 'attention', completedCount: requiredComplete, totalCount }
  }

  if (core.status === 'complete' && images.status === 'complete') {
    return { status: 'complete', completedCount: totalCount, totalCount }
  }

  return { status: 'attention', completedCount: requiredComplete, totalCount }
}

function getStepLabel(stepId: CoinFormStepId): string {
  return COIN_FORM_STEPS.find((step) => step.id === stepId)?.label ?? stepId
}

function buildStepResult(
  stepId: CoinFormStepId,
  evaluation: Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'>,
): StepCompletionResult {
  return {
    stepId,
    label: getStepLabel(stepId),
    ...evaluation,
  }
}

export function getCoinStepCompletion(
  values: CoinFormValues,
  images: StepCompletionImages,
  options: StepCompletionOptions = {},
): StepCompletionResult[] {
  const isAdmin = options.isAdmin ?? false
  const visibleSteps = getVisibleCoinFormSteps(isAdmin)

  const coreIdentity = evaluateCoreIdentity(values, options)
  const imageStep = evaluateImages(images, options)
  const mintInformation = evaluateMintInformation(values)
  const specifications = evaluateOptionalFieldSection(values, SPECIFICATION_FIELDS, 3, 1)
  const descriptions = evaluateOptionalFieldSection(values, DESCRIPTION_FIELDS, 2, 1)
  const statusAdmin = evaluateStatusAdmin(values)
  const reviewSubmission = evaluateReviewSubmission(coreIdentity, imageStep)

  const evaluations: Record<CoinFormStepId, Pick<StepCompletionResult, 'status' | 'completedCount' | 'totalCount'>> =
    {
      'core-identity': coreIdentity,
      images: imageStep,
      'mint-information': mintInformation,
      specifications,
      descriptions,
      'status-admin': statusAdmin,
      'review-submission': reviewSubmission,
    }

  return visibleSteps.map((step) => buildStepResult(step.id, evaluations[step.id]))
}

export function getCoinStepCompletionById(
  stepId: CoinFormStepId,
  values: CoinFormValues,
  images: StepCompletionImages,
  options: StepCompletionOptions = {},
): StepCompletionResult | undefined {
  return getCoinStepCompletion(values, images, options).find((result) => result.stepId === stepId)
}

export function findStepCompletion(
  stepCompletion: StepCompletionResult[],
  stepId: CoinFormStepId,
): StepCompletionResult | undefined {
  return stepCompletion.find((result) => result.stepId === stepId)
}

export function getStepCompletionAriaLabel(
  stepLabel: string,
  status: StepCompletionStatus | undefined,
): string {
  if (status === 'complete') return `${stepLabel} complete`
  if (status === 'attention') return `${stepLabel} need attention`
  return `${stepLabel} empty`
}

const REQUIRED_WIZARD_STEP_IDS: CoinFormStepId[] = ['core-identity', 'images']

const CATALOGUE_HEALTH_STEP_IDS: CoinFormStepId[] = [
  'core-identity',
  'images',
  'mint-information',
  'specifications',
]

export type WizardNextAction = {
  stepId: CoinFormStepId
  message: string
  isReview: boolean
}

export function getCatalogueHealthSteps(
  stepCompletion: StepCompletionResult[],
): StepCompletionResult[] {
  return CATALOGUE_HEALTH_STEP_IDS.map((stepId) => findStepCompletion(stepCompletion, stepId)).filter(
    (step): step is StepCompletionResult => Boolean(step),
  )
}

export function getWizardNextAction(stepCompletion: StepCompletionResult[]): WizardNextAction {
  for (const stepId of REQUIRED_WIZARD_STEP_IDS) {
    const step = findStepCompletion(stepCompletion, stepId)
    if (step && step.status !== 'complete') {
      return {
        stepId,
        message: `Complete ${step.label}`,
        isReview: false,
      }
    }
  }

  const optionalStep = stepCompletion.find(
    (step) =>
      !REQUIRED_WIZARD_STEP_IDS.includes(step.stepId) &&
      step.stepId !== 'review-submission' &&
      (step.status === 'attention' || step.status === 'empty'),
  )

  if (optionalStep) {
    return {
      stepId: optionalStep.stepId,
      message: `Complete ${optionalStep.label}`,
      isReview: false,
    }
  }

  return {
    stepId: 'review-submission',
    message: 'Review and submit',
    isReview: true,
  }
}
