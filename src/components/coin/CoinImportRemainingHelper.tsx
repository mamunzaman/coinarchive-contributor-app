import { CheckCircle2, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CoinFormStepId } from '../../types/coinFormSteps'
import { useCoinLinkImportSession } from '../../hooks/useCoinLinkImportSession'

type CoinImportRemainingHelperProps = {
  activeStepId: CoinFormStepId
  placement?: 'step' | 'embedded'
}

export function CoinImportRemainingHelper({
  activeStepId,
  placement = 'step',
}: CoinImportRemainingHelperProps) {
  const { t } = useTranslation()
  const session = useCoinLinkImportSession()

  if (!session?.appliedResult) {
    return null
  }

  const { missingTargets, getMissingForStep, openMissingPanel, navigationMessage } = session
  const stepMissing = getMissingForStep(activeStepId)
  const allComplete = missingTargets.length === 0

  const wrapperClass =
    placement === 'embedded'
      ? 'coin-import-remaining-helper coin-import-remaining-helper--embedded'
      : 'coin-import-remaining-helper'

  if (allComplete) {
    return (
      <div className={`${wrapperClass} coin-import-remaining-helper--success`} role="status">
        <CheckCircle2 className="coin-import-remaining-helper__success-icon" aria-hidden />
        <p className="coin-import-remaining-helper__success-text">
          {t('coinImport.remainingHelper.allReviewedBody')}
        </p>
      </div>
    )
  }

  const stepStatusText =
    stepMissing.length > 0
      ? t('coinImport.remainingHelper.stepMissingShort', { count: stepMissing.length })
      : t('coinImport.remainingHelper.stepClearShort')

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <p className="coin-import-remaining-helper__summary">
        <span>{t('coinImport.card.stillMissing', { count: missingTargets.length })}</span>
        <span className="coin-import-remaining-helper__sep" aria-hidden>
          {' · '}
        </span>
        <span>{stepStatusText}</span>
      </p>
      <button
        type="button"
        className="coin-import-remaining-helper__review"
        onClick={openMissingPanel}
        aria-label={t('coinImport.card.reviewMissingAria')}
      >
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{t('coinImport.missingReview.reviewMissing')}</span>
      </button>
      <div role="status" aria-live="polite" className="coin-import-nav-announce sr-only">
        {navigationMessage}
      </div>
    </div>
  )
}
