import {
  buildAiDescriptionPrompt,
  type AiDescriptionPromptInput,
  type AiDescriptionTarget,
} from './aiDescriptionPrompts'
import type { CoinSubmissionDetail } from './api'

export type GeneratedDescriptions = Partial<Record<AiDescriptionTarget, string>>

export type GenerateDescriptionsRequest = {
  values: AiDescriptionPromptInput
  targets: AiDescriptionTarget[]
}

export type GenerateDescriptionsResponse = {
  provider: 'mock'
  prompts: Record<AiDescriptionTarget, string>
  descriptions: GeneratedDescriptions
}

export type AiDescriptionProvider = {
  generateDescriptions(request: GenerateDescriptionsRequest): Promise<GenerateDescriptionsResponse>
}

function coinLabel(values: AiDescriptionPromptInput): string {
  return `${values.denomination.trim()} ${values.coin_type.trim()} coin issued by ${values.country.trim()} in ${values.year.trim()}`
}

function subjectLabel(values: AiDescriptionPromptInput): string {
  return values.coin_theme.trim() || values.short_description.trim() || 'the submitted design theme'
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

export function isMockAiGeneratedDescription(value: string | undefined | null): boolean {
  const text = value?.trim() ?? ''
  return (
    text.startsWith('This commemorative ') ||
    text.startsWith('The reverse of this ') ||
    text.startsWith('Collector interest may focus on ')
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
    submission.acf?.coin_collector_notes,
  ].some(isMockAiGeneratedDescription)
}
