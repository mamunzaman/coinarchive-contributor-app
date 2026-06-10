import type { CoinFormValues } from '../types/coinForm'

export type AiDescriptionTarget =
  | 'obverse'
  | 'reverse'
  | 'collector_notes'
  | 'seo_description'

export type AiDescriptionPromptInput = Pick<
  CoinFormValues,
  | 'country'
  | 'year'
  | 'denomination'
  | 'coin_type'
  | 'coin_theme'
  | 'short_description'
  | 'released_date'
  | 'hasMintVariants'
  | 'singleMintMark'
  | 'mintMarksAvailable'
  | 'mintVariants'
>

export function hasRequiredAiDescriptionFields(values: AiDescriptionPromptInput): boolean {
  return Boolean(
    values.country.trim() &&
      values.year.trim() &&
      values.denomination.trim() &&
      values.coin_type.trim(),
  )
}

function getMintSummary(values: AiDescriptionPromptInput): string {
  if (values.hasMintVariants) {
    const variants = values.mintVariants
      .filter((row) => row.mintMarkCode.trim() || row.mintMintage.trim())
      .map((row) => [row.mintMarkCode.trim(), row.mintMintage.trim()].filter(Boolean).join(': '))
      .filter(Boolean)

    return variants.length > 0 ? variants.join('; ') : 'Multiple mint variants'
  }

  return values.singleMintMark.trim() || values.mintMarksAvailable.trim() || 'Not specified'
}

export function buildAiDescriptionPrompt(
  values: AiDescriptionPromptInput,
  target: AiDescriptionTarget,
): string {
  const subject = values.coin_theme.trim() || values.short_description.trim() || 'Not specified'

  return [
    'Write a professional CoinArchive catalogue description.',
    `Target: ${target.replace(/_/g, ' ')}`,
    `Country: ${values.country.trim() || 'Not specified'}`,
    `Year: ${values.year.trim() || 'Not specified'}`,
    `Denomination: ${values.denomination.trim() || 'Not specified'}`,
    `Coin type: ${values.coin_type.trim() || 'Not specified'}`,
    `Theme or subject: ${subject}`,
    `Mint data: ${getMintSummary(values)}`,
    `Release date: ${values.released_date.trim() || 'Not specified'}`,
    'Tone: accurate, concise, collector-friendly, no unsupported facts.',
  ].join('\n')
}
