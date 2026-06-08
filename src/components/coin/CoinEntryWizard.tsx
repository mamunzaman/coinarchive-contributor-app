import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
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

function SaveActionButtons({
  formId,
  submitLabel,
  isSubmitting,
  onSaveDraft,
  buttonClassName = '',
  compact = false,
}: {
  formId: string
  submitLabel: string
  isSubmitting: boolean
  onSaveDraft?: () => void
  buttonClassName?: string
  compact?: boolean
}) {
  const sizeClass = compact ? '!min-h-11 !px-4 !py-2.5' : ''

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {onSaveDraft ? (
        <Button
          type="button"
          variant="secondary"
          className={[sizeClass, buttonClassName].filter(Boolean).join(' ')}
          disabled={isSubmitting}
          onClick={onSaveDraft}
        >
          Save draft
        </Button>
      ) : null}
      <Button
        type="submit"
        form={formId}
        className={[sizeClass, buttonClassName].filter(Boolean).join(' ')}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </div>
  )
}

function EditWizardActionBar({
  formId,
  submitLabel,
  isSubmitting,
  onSaveDraft,
  onBack,
  onContinue,
  isFirstStep,
  showContinue,
  continueLabel,
  footerRef,
}: {
  formId: string
  submitLabel: string
  isSubmitting: boolean
  onSaveDraft?: () => void
  onBack: () => void
  onContinue: () => void
  isFirstStep: boolean
  showContinue: boolean
  continueLabel: string
  footerRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={footerRef}
      className={[
        'z-40 border-t border-border/70 bg-white/95 py-2.5 backdrop-blur-md',
        'shadow-[0_-4px_20px_rgba(28,28,30,0.06)]',
        'sticky bottom-0',
        'md:fixed md:inset-x-0 md:bottom-0',
        'md:pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]',
        'xl:relative xl:inset-x-auto xl:pb-2.5',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          className="!min-h-11 shrink-0"
          disabled={isSubmitting}
          onClick={onBack}
        >
          {isFirstStep ? 'Cancel' : 'Back'}
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          {showContinue ? (
            <Button
              type="button"
              variant="secondary"
              className="!min-h-11"
              disabled={isSubmitting}
              onClick={onContinue}
            >
              {continueLabel}
            </Button>
          ) : null}
          <SaveActionButtons
            formId={formId}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            onSaveDraft={onSaveDraft}
            compact
          />
        </div>
      </div>
    </div>
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
  const showEditSaveActions = mode === 'edit'
  const showFooterSubmit = mode === 'new' && isReviewStep
  const showFooterSaveDraft = mode === 'new' && Boolean(onSaveDraft)

  const footerActionsRef = useRef<HTMLDivElement>(null)
  const [footerActionsVisible, setFooterActionsVisible] = useState(false)

  useEffect(() => {
    if (!showEditSaveActions) {
      setFooterActionsVisible(false)
      return
    }

    const node = footerActionsRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setFooterActionsVisible(entry.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -8px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [showEditSaveActions, activeStepId])

  const wizardGridClass =
    'grid gap-5 lg:grid-cols-[minmax(240px,260px)_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_240px]'

  const wizardHeaderOffsetClass = 'md:top-14'

  return (
    <div
      className={[
        'mx-auto flex max-w-[1440px] flex-col px-4 pt-3 sm:px-6 sm:pt-4',
        showEditSaveActions
          ? 'pb-6 md:pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] xl:pb-6'
          : 'pb-24 md:pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] xl:pb-8',
      ].join(' ')}
    >
      <div className="mb-3 md:mb-4 xl:mb-5">
        {showEditSaveActions ? (
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1">
              <p className="section-label">Edit Entry</p>
              <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
                Update specimen record
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-navy-muted">
                Complete each section to build a catalogue-ready coin submission for archive review.
              </p>

              {saveDraftMessage ? (
                <p role="status" className="mt-2 text-sm text-emerald-700">
                  {saveDraftMessage}
                </p>
              ) : null}

              <div
                className={[
                  'mt-3 transition-all duration-200 max-md:sticky max-md:top-14 max-md:z-30 max-md:border-b max-md:border-border/60 max-md:bg-page/95 max-md:py-2.5 max-md:backdrop-blur-sm lg:hidden',
                  footerActionsVisible
                    ? 'pointer-events-none translate-y-1 opacity-0'
                    : 'opacity-100',
                ].join(' ')}
                aria-hidden={footerActionsVisible}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <SaveActionButtons
                    formId={formId}
                    submitLabel={submitLabel}
                    isSubmitting={isSubmitting}
                    onSaveDraft={onSaveDraft}
                    buttonClassName="w-full shrink-0 whitespace-nowrap sm:w-auto"
                    compact
                  />
                </div>
              </div>
            </div>

            <div
              className={[
                'hidden shrink-0 lg:block lg:sticky lg:top-14 lg:z-30',
                footerActionsVisible
                  ? 'pointer-events-none translate-y-1 opacity-0'
                  : 'opacity-100',
              ].join(' ')}
              aria-hidden={footerActionsVisible}
            >
              <div className="flex flex-row items-center gap-3 shrink-0 whitespace-nowrap">
                <SaveActionButtons
                  formId={formId}
                  submitLabel={submitLabel}
                  isSubmitting={isSubmitting}
                  onSaveDraft={onSaveDraft}
                  buttonClassName="shrink-0 whitespace-nowrap"
                  compact
                />
              </div>
            </div>
          </div>
        ) : (
          <div className={wizardGridClass}>
            <div className="hidden lg:block" aria-hidden />
            <div className="min-w-0">
              <p className="section-label">New Entry</p>
              <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
                Specimen registration
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-navy-muted">
                Complete each section to build a catalogue-ready coin submission for archive review.
              </p>
            </div>
            <div className="hidden xl:block" aria-hidden />
          </div>
        )}
      </div>

      <div
        className={[
          'xl:hidden mb-4 md:mb-6',
          'md:sticky md:z-30',
          wizardHeaderOffsetClass,
          'md:-mx-6 md:border-b md:border-border/60 md:bg-white/95 md:px-6 md:py-3.5',
          'md:shadow-[0_4px_12px_rgba(28,28,30,0.04)] md:backdrop-blur-md',
        ].join(' ')}
      >
        <div className="relative md:-mx-1">
          <nav
            aria-label="Form steps"
            className={[
              'flex gap-2.5 overflow-x-auto scroll-px-3 pb-1',
              'px-1 sm:px-2 md:gap-3 md:scroll-px-4 md:pb-0',
              '[-ms-overflow-style:none] [scrollbar-width:none]',
              '[&::-webkit-scrollbar]:hidden',
            ].join(' ')}
          >
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                aria-current={step.id === activeStepId ? 'step' : undefined}
                className={[
                  'shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-[color,box-shadow]',
                  'min-h-11 md:min-h-12 md:px-6 md:text-[15px]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
                  step.id === activeStepId
                    ? 'bg-primary font-bold text-white md:shadow-[0_3px_10px_rgba(72,207,193,0.28)]'
                    : 'bg-white/90 font-medium text-navy-muted/85 ring-1 ring-border/30 md:font-semibold hover:bg-page hover:text-navy-muted hover:ring-border/50',
                ].join(' ')}
              >
                {index + 1}. {step.label}
              </button>
            ))}
          </nav>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-white via-white/85 to-transparent md:block"
          />
        </div>
      </div>

      <div className={[wizardGridClass, 'md:pt-1 xl:pt-0'].join(' ')}>
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

        <section className="min-w-0 md:scroll-mt-[8.75rem] xl:scroll-mt-0">
          <div className="overflow-hidden rounded-xl border border-border/70 bg-surface shadow-[var(--shadow-card)]">
            <div className="p-4 sm:p-6 lg:p-7">
              <div className="mb-5 flex scroll-mt-[8.75rem] flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4 md:scroll-mt-[8.75rem] xl:scroll-mt-0">
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

              <div
                className={[
                  'flex flex-col gap-6',
                  showEditSaveActions ? 'pb-2 md:pb-4 xl:pb-0' : '',
                ].join(' ')}
              >
                {children}
              </div>
            </div>

            {showEditSaveActions ? (
              <div
                className="hidden shrink-0 md:block md:h-[4.5rem] xl:hidden"
                aria-hidden="true"
              />
            ) : null}

            {showEditSaveActions ? (
              <EditWizardActionBar
                footerRef={footerActionsRef}
                formId={formId}
                submitLabel={submitLabel}
                isSubmitting={isSubmitting}
                onSaveDraft={onSaveDraft}
                onBack={onBack}
                onContinue={onContinue}
                isFirstStep={isFirstStep}
                showContinue={showContinue}
                continueLabel={continueLabel}
              />
            ) : null}
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

      {!showEditSaveActions ? (
        <div
          className={[
            'fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white/95 backdrop-blur-md',
            'shadow-[0_-4px_20px_rgba(28,28,30,0.06)]',
          ].join(' ')}
        >
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-3.5 md:pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] xl:pb-3.5">
            <Button type="button" variant="ghost" className="!min-h-11" disabled={isSubmitting} onClick={onBack}>
              {isFirstStep ? 'Cancel' : 'Back'}
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {showContinue ? (
                <Button type="button" variant="secondary" className="!min-h-11" disabled={isSubmitting} onClick={onContinue}>
                  {continueLabel}
                </Button>
              ) : null}
              {showFooterSaveDraft ? (
                <Button type="button" variant="secondary" className="!min-h-11" disabled={isSubmitting} onClick={onSaveDraft}>
                  Save draft
                </Button>
              ) : null}
              {showFooterSubmit ? (
                <Button type="submit" form={formId} className="!min-h-11" disabled={isSubmitting}>
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
      ) : null}
    </div>
  )
}
