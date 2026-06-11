import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { CoinFormValues } from '../../types/coinForm'
import {
  buildAiDescriptionPrompt,
  hasRequiredAiDescriptionFields,
  type AiDescriptionTarget,
} from '../../lib/aiDescriptionPrompts'
import {
  wordpressAiDescriptionProvider,
  type GeneratedDescriptions,
} from '../../lib/aiDescriptionGenerator'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

type AIWritingAssistantProps = {
  values: CoinFormValues
  disabled?: boolean
  usageCount: number
  generatedFields: Set<AiDescriptionTarget>
  onUsageCountChange: (count: number) => void
  onGeneratedFieldsChange: (fields: Set<AiDescriptionTarget>) => void
  onApplyDescriptions: (descriptions: GeneratedDescriptions) => void
}

const BUTTONS: Array<{ label: string; targets: AiDescriptionTarget[] }> = [
  { label: 'Generate Obverse Description', targets: ['obverse'] },
  { label: 'Generate Reverse Description', targets: ['reverse'] },
  { label: 'Generate Collector Notes', targets: ['collector_notes'] },
  {
    label: 'Generate All',
    targets: ['obverse', 'reverse', 'historical_background', 'collector_notes', 'seo_description'],
  },
]

function targetHasContent(values: CoinFormValues, target: AiDescriptionTarget): boolean {
  if (target === 'obverse') return Boolean(values.coin_obverse_description.trim())
  if (target === 'reverse') return Boolean(values.coin_reverse_description.trim())
  if (target === 'historical_background') return Boolean(values.coin_historical_background.trim())
  if (target === 'collector_notes') return Boolean(values.coin_collector_notes.trim())
  return false
}

function getGenerationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'Please log in again.'
      case 429:
        return 'AI generation limit reached. Try again later.'
      case 501:
        return 'AI provider is not configured yet.'
      case 502:
        return 'AI provider returned an invalid response.'
      default:
        return 'Could not generate descriptions.'
    }
  }

  return 'Could not generate descriptions.'
}

export function AIWritingAssistant({
  values,
  disabled = false,
  usageCount,
  generatedFields,
  onUsageCountChange,
  onGeneratedFieldsChange,
  onApplyDescriptions,
}: AIWritingAssistantProps) {
  const { token } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeLabel, setActiveLabel] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [seoPreview, setSeoPreview] = useState('')
  const canGenerate = hasRequiredAiDescriptionFields(values)
  const promptPreview = useMemo(
    () => buildAiDescriptionPrompt(values, 'obverse'),
    [values],
  )

  async function handleGenerate(label: string, targets: AiDescriptionTarget[]) {
    const replacingAiContent = targets.some(
      (target) => generatedFields.has(target) && targetHasContent(values, target),
    )

    if (
      replacingAiContent &&
      !window.confirm('Regenerating will replace current AI-generated content.')
    ) {
      return
    }

    setIsGenerating(true)
    setActiveLabel(label)
    setStatusMessage('Generating AI writing draft...')

    try {
      const response = await wordpressAiDescriptionProvider.generateDescriptions({ values, targets, token })
      onApplyDescriptions(response.descriptions)
      if (response.descriptions.seo_description) {
        setSeoPreview(response.descriptions.seo_description)
      }
      onGeneratedFieldsChange(new Set([...generatedFields, ...targets]))
      onUsageCountChange(usageCount + 1)
      setStatusMessage('AI writing draft applied.')
    } catch (error) {
      setStatusMessage(getGenerationErrorMessage(error))
    } finally {
      setIsGenerating(false)
      setActiveLabel('')
    }
  }

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="font-serif text-base font-semibold text-navy">AI Writing Assistant</h3>
          </div>
          <p className="mt-1 text-sm text-navy-muted">
            Generate professional coin descriptions based on the coin information entered so far.
          </p>
        </div>
        <p className="text-xs font-semibold text-primary">
          AI generations used this session: {usageCount}
        </p>
      </div>

      {!canGenerate ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Add country, year, denomination, and coin type before generating descriptions.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {BUTTONS.map((button) => (
          <button
            key={button.label}
            type="button"
            disabled={disabled || !canGenerate || isGenerating}
            onClick={() => void handleGenerate(button.label, button.targets)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating && activeLabel === button.label ? 'Generating...' : button.label}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className="mt-3 min-h-4 text-xs text-navy-muted">
        {statusMessage}
      </div>

      {seoPreview ? (
        <div className="mt-3 rounded-lg border border-border/70 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
            SEO Description Preview
          </p>
          <p className="mt-1 text-xs text-navy">{seoPreview}</p>
        </div>
      ) : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-navy-muted">
          Prompt preview
        </summary>
        <pre className="mt-2 max-h-44 overflow-auto rounded-lg bg-white p-3 text-xs whitespace-pre-wrap text-navy-muted">
          {promptPreview}
        </pre>
      </details>
    </section>
  )
}
