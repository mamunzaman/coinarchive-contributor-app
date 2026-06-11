import {
  buildAiDescriptionPayload,
  buildAiDescriptionPrompt,
  type AiDescriptionPromptInput,
  type AiDescriptionTarget,
} from './aiDescriptionPrompts'
import {
  ApiError,
  generateAiDescriptions,
  type AiDescriptionField,
  type CoinSubmissionDetail,
} from './api'

export type GeneratedDescriptions = Partial<Record<AiDescriptionTarget, string>>

export type GenerateDescriptionsRequest = {
  values: AiDescriptionPromptInput
  targets: AiDescriptionTarget[]
  token: string | null
}

export type GenerateDescriptionsResponse = {
  provider: 'wordpress' | 'mock'
  prompts: Record<AiDescriptionTarget, string>
  descriptions: GeneratedDescriptions
}

export type AiDescriptionProvider = {
  generateDescriptions(request: GenerateDescriptionsRequest): Promise<GenerateDescriptionsResponse>
}

const TARGET_TO_FIELD: Record<AiDescriptionTarget, AiDescriptionField> = {
  obverse: 'obverse_description',
  reverse: 'reverse_description',
  historical_background: 'historical_background',
  collector_notes: 'collector_notes',
  seo_description: 'seo_description',
}

const FIELD_TO_TARGET: Record<AiDescriptionField, AiDescriptionTarget> = {
  obverse_description: 'obverse',
  reverse_description: 'reverse',
  historical_background: 'historical_background',
  collector_notes: 'collector_notes',
  seo_description: 'seo_description',
}

function coinLabel(values: AiDescriptionPromptInput): string {
  return `${values.denomination.trim()} ${values.coin_type.trim()} coin issued by ${values.country.trim()} in ${values.year.trim()}`
}

function subjectLabel(values: AiDescriptionPromptInput): string {
  return values.coin_theme.trim() || values.short_description.trim() || 'the submitted design theme'
}

function toHtmlParagraph(value: string): string {
  if (/<\/?[a-z][\s\S]*>/i.test(value.trim())) {
    return value.trim()
  }

  const escaped = value
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped ? `<p>${escaped}</p>` : ''
}

export const mockAiDescriptionProvider: AiDescriptionProvider = {
  async generateDescriptions({ values, targets }) {
    await new Promise((resolve) => window.setTimeout(resolve, 450))

    const label = coinLabel(values)
    const subject = subjectLabel(values)
    const descriptions: GeneratedDescriptions = {}

    for (const target of targets) {
      if (target === 'obverse') {
        descriptions.obverse = `This commemorative ${label} presents an obverse design focused on ${subject}. The composition should be reviewed against the submitted image for exact inscriptions, symbols, and layout details.`
      }
      if (target === 'reverse') {
        descriptions.reverse = `The reverse of this ${values.denomination.trim()} issue follows the coin type and denomination standards for ${values.country.trim()}. Confirm the final reverse design, mint marks, and edge details against the uploaded reference image.`
      }
      if (target === 'historical_background') {
        descriptions.historical_background = toHtmlParagraph(
          `This ${label} is documented here with the submitted theme, release date, and mint information. Specific historical events, designer attribution, rarity, and market value should be added only after source verification.`,
        )
      }
      if (target === 'collector_notes') {
        descriptions.collector_notes = `Collector interest may focus on the ${values.year.trim()} issue, ${subject}, release context, mint data, and image quality. Verify mintage, condition, and any variant-specific details before publication.`
      }
      if (target === 'seo_description') {
        descriptions.seo_description = `${values.country.trim()} ${values.year.trim()} ${values.denomination.trim()} ${values.coin_type.trim()} coin featuring ${subject}. View catalogue details, images, and collector notes on CoinArchive.`
      }
    }

    return {
      provider: 'mock',
      prompts: Object.fromEntries(
        targets.map((target) => [target, buildAiDescriptionPrompt(values, target)]),
      ) as Record<AiDescriptionTarget, string>,
      descriptions,
    }
  },
}

function isEndpointUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status === 404 || error.status === 405)
}

export const wordpressAiDescriptionProvider: AiDescriptionProvider = {
  async generateDescriptions({ values, targets, token }) {
    const fieldsRequested = targets.map((target) => TARGET_TO_FIELD[target])

    try {
      const response = await generateAiDescriptions(
        buildAiDescriptionPayload(values, fieldsRequested),
        token ?? '',
      )
      const descriptions: GeneratedDescriptions = {}

      for (const [field, value] of Object.entries(response.descriptions)) {
        const target = FIELD_TO_TARGET[field as AiDescriptionField]
        if (target && typeof value === 'string') {
          descriptions[target] = target === 'historical_background' ? toHtmlParagraph(value) : value
        }
      }

      if (
        targets.includes('historical_background') &&
        !descriptions.historical_background &&
        response.descriptions.collector_notes
      ) {
        descriptions.historical_background = toHtmlParagraph(response.descriptions.collector_notes)
      }

      return {
        provider: 'wordpress',
        prompts: Object.fromEntries(
          targets.map((target) => [target, buildAiDescriptionPrompt(values, target)]),
        ) as Record<AiDescriptionTarget, string>,
        descriptions,
      }
    } catch (error) {
      if (import.meta.env.DEV && isEndpointUnavailable(error)) {
        return mockAiDescriptionProvider.generateDescriptions({ values, targets, token })
      }

      throw error
    }
  },
}

export function isMockAiGeneratedDescription(value: string | undefined | null): boolean {
  const text = value?.trim() ?? ''
  return (
    text.startsWith('This commemorative ') ||
    text.startsWith('The reverse of this ') ||
    text.startsWith('Collector interest may focus on ') ||
    text.includes('Specific historical events, designer attribution, rarity, and market value')
  )
}

export function hasAiAssistedDescriptionContent(submission: CoinSubmissionDetail): boolean {
  const record = submission as unknown as Record<string, unknown>
  const acf = submission.acf as (NonNullable<CoinSubmissionDetail['acf']> & Record<string, unknown>) | undefined

  if (
    record.ai_assisted === true ||
    record.aiAssisted === true ||
    acf?.ai_assisted === true ||
    acf?.aiAssisted === true
  ) {
    return true
  }

  return [
    submission.acf?.coin_obverse_description,
    submission.acf?.coin_reverse_description,
    submission.acf?.coin_historical_background,
    submission.acf?.coin_collector_notes,
  ].some(isMockAiGeneratedDescription)
}
