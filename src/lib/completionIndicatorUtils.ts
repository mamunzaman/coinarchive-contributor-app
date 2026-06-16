import { getCompletionTone, type CompletenessResult } from './completenessScore'

const TONE_BAR = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-amber-400',
} as const

export function getCompletionAccentClass(result: CompletenessResult): string {
  return TONE_BAR[getCompletionTone(result.score)]
}
