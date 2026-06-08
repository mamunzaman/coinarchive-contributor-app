import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import type { CoinFormStep, CoinFormStepId } from '../../types/coinFormSteps'

type CoinEntryWizardProps = {
  mode: 'new' | 'edit'
  steps: CoinFormStep[]
  activeStepId: CoinFormStepId
  onStepChange: (stepId: CoinFormStepId) => void
  onBack: () => void
  onContinue: () => void
  isFirstStep: boolean
  isReviewStep: boolean
  isSubmitting: boolean
  submitLabel: string
  continueLabel?: string
  statusMessage?: string | null
  previewTitle?: string
  previewObverseUrl?: string | null
  previewReverseUrl?: string | null
  alerts?: ReactNode
  workflowPanel?: ReactNode
  cataloguePreview?: ReactNode
  onSaveDraft?: () => void
  saveDraftMessage?: string | null
  children: ReactNode
  formId: string
}

function StepButton({
  step,
  index,
  isActive,
  onSelect,
}: {
  step: CoinFormStep
  index: number
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'step' : undefined}
      className={[
        'flex min-h-[3.25rem] w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
        isActive
          ? 'border-primary/40 bg-white shadow-[var(--shadow-card)] ring-1 ring-primary/10'
          : 'border-transparent bg-transparent hover:border-border hover:bg-white/70',
      ].join(' ')}
    >
      <span
        className={[
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          isActive ? 'bg-primary text-white' : 'bg-white text-navy-muted ring-1 ring-border',
        ].join(' ')}
      >
        {index + 1}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy">{step.label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-navy-muted">{step.description}</span>
      </span>
    </button>
  )
}

export function CoinEntryWizard({
  mode,
  steps,
  activeStepId,
  onStepChange,
  onBack,
  onContinue,
  isFirstStep,
  isReviewStep,
  isSubmitting,
  submitLabel,
  continueLabel = 'Continue',
  statusMessage,
  previewTitle,
  previewObverseUrl,
  previewReverseUrl,
  alerts,
  workflowPanel,
  cataloguePreview,
  onSaveDraft,
  saveDraftMessage,
  children,
  formId,
}: CoinEntryWizardProps) {
  const activeStep = steps.find((step) => step.id === activeStepId) ?? steps[0]
  const activeIndex = steps.findIndex((step) => step.id === activeStepId)
  const showContinue = !isReviewStep
  const showSubmit = mode === 'edit' || isReviewStep

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col px-4 pb-24 pt-4 sm:px-6 sm:pt-5 xl:pb-8">
      <div className="mb-4 sm:mb-5">
        <p className="section-label">
          {mode === 'new' ? 'New Entry' : 'Edit Entry'}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
          {mode === 'new' ? 'Specimen registration' : 'Update specimen record'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-navy-muted">
          Complete each section to build a catalogue-ready coin submission for archive review.
        </p>
      </div>

      <div className="xl:hidden">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.id)}
              aria-current={step.id === activeStepId ? 'step' : undefined}
              className={[
                'shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
                step.id === activeStepId
                  ? 'bg-primary text-white'
                  : 'bg-white text-navy-muted ring-1 ring-border',
              ].join(' ')}
            >
              {index + 1}. {step.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(240px,260px)_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_240px]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border/70 bg-white/90 p-4 shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
              Registration progress
            </p>
            <nav aria-label="Form steps" className="mt-3 flex flex-col gap-2">
              {steps.map((step, index) => (
                <StepButton
                  key={step.id}
                  step={step}
                  index={index}
                  isActive={step.id === activeStepId}
                  onSelect={() => onStepChange(step.id)}
                />
              ))}
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6 lg:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
                  Step {activeIndex + 1} of {steps.length}
                </p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-navy sm:text-2xl">
                  {activeStep.label}
                </h2>
                <p className="mt-2 text-sm text-navy-muted">{activeStep.description}</p>
              </div>
              {activeStep.id === 'core-identity' ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Mandatory
                </span>
              ) : null}
            </div>

            {alerts}

            <div className="flex flex-col gap-6">{children}</div>
          </div>
        </section>

        <aside className="min-w-0 lg:col-span-2 xl:col-span-1">
          <div className="grid gap-3 xl:sticky xl:top-20 xl:block xl:space-y-3">
            {cataloguePreview ? <div className="hidden xl:block">{cataloguePreview}</div> : null}
            {(previewObverseUrl || previewReverseUrl) && (
              <div className="rounded-xl border border-border/70 bg-panel p-4 shadow-[var(--shadow-card)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
                  Specimen preview
                </p>
                {previewTitle ? (
                  <p className="mt-2 text-sm font-medium text-navy">{previewTitle}</p>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {previewObverseUrl ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-muted">
                        Obverse
                      </p>
                      <img
                        src={previewObverseUrl}
                        alt="Obverse preview"
                        className="aspect-square w-full rounded-xl border border-border/60 bg-white object-contain p-2"
                      />
                    </div>
                  ) : null}
                  {previewReverseUrl ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-muted">
                        Reverse
                      </p>
                      <img
                        src={previewReverseUrl}
                        alt="Reverse preview"
                        className="aspect-square w-full rounded-xl border border-border/60 bg-white object-contain p-2"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {workflowPanel}

            {cataloguePreview ? (
              <div className="xl:hidden">{cataloguePreview}</div>
            ) : null}

            <div className="rounded-xl border border-border/70 bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
                Archival tip
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy-muted">{activeStep.tip}</p>
            </div>

            {statusMessage ? (
              <div className="rounded-xl border border-border/70 bg-white p-4 shadow-[var(--shadow-card)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
                  Session status
                </p>
                <p className="mt-2 text-sm text-navy">{statusMessage}</p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/95 backdrop-blur-sm xl:static xl:mt-5 xl:border-t-0 xl:bg-transparent xl:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onBack}>
            {isFirstStep ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex items-center gap-3">
            {showContinue ? (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onContinue}>
                {continueLabel}
              </Button>
            ) : null}
            {onSaveDraft ? (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onSaveDraft}>
                Save draft
              </Button>
            ) : null}
            {showSubmit ? (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : submitLabel}
              </Button>
            ) : null}
          </div>
          {saveDraftMessage ? (
            <p className="absolute inset-x-0 -top-8 hidden text-center text-xs text-emerald-700 xl:block">
              {saveDraftMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
