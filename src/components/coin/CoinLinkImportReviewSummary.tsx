import { CheckCircle2, ExternalLink, Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCoinLinkImportSession } from '../../hooks/useCoinLinkImportSession'

export function CoinLinkImportReviewSummary() {
  const { t } = useTranslation()
  const session = useCoinLinkImportSession()

  if (!session?.appliedResult) {
    return null
  }

  const {
    appliedResult,
    missingTargets,
    extractedCount,
    openMissingPanel,
    navigateToMissing,
  } = session

  const allComplete = missingTargets.length === 0

  return (
    <section
      className={[
        'coin-import-review-summary',
        allComplete ? 'coin-import-review-summary--success' : 'coin-import-review-summary--pending',
      ].join(' ')}
      aria-labelledby="coin-import-review-summary-title"
    >
      <div className="coin-import-review-summary__header">
        <div className="coin-import-review-summary__header-main">
          <div
            className={[
              'coin-import-review-summary__icon-wrap',
              allComplete
                ? 'coin-import-review-summary__icon-wrap--success'
                : 'coin-import-review-summary__icon-wrap--pending',
            ].join(' ')}
            aria-hidden
          >
            {allComplete ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 id="coin-import-review-summary-title" className="coin-import-review-summary__title">
              {t('coinImport.reviewSummary.title')}
            </h3>
            <p className="coin-import-review-summary__subtitle">{t('coinImport.reviewSummary.subtitle')}</p>
          </div>
        </div>
        <span
          className={`coin-import-review-summary__confidence coin-import-badge coin-import-badge--compact coin-import-badge--${appliedResult.confidence}`}
        >
          {t(`coinImport.confidence.${appliedResult.confidence}`)}
        </span>
      </div>

      <div className="coin-import-review-summary__metrics">
        <div className="coin-import-review-summary__metric">
          <span className="coin-import-review-summary__metric-label">
            {t('coinImport.reviewSummary.importedLabel')}
          </span>
          <span className="coin-import-review-summary__metric-value">
            {t('coinImport.reviewSummary.importedValue', { count: extractedCount })}
          </span>
        </div>
        <div className="coin-import-review-summary__metric">
          <span className="coin-import-review-summary__metric-label">
            {t('coinImport.reviewSummary.stillOpenLabel')}
          </span>
          <span
            className="coin-import-review-summary__metric-value"
            role="status"
            aria-live="polite"
          >
            {t('coinImport.reviewSummary.stillOpenValue', { count: missingTargets.length })}
          </span>
        </div>
        <div className="coin-import-review-summary__metric coin-import-review-summary__metric--source">
          <span className="coin-import-review-summary__metric-label">
            {t('coinImport.reviewSummary.sourceLabel')}
          </span>
          <span className="coin-import-review-summary__metric-value">{appliedResult.sourceName}</span>
        </div>
      </div>

      {!allComplete ? (
        <div className="coin-import-review-summary__missing">
          <p className="coin-import-review-summary__section-label">
            {t('coinImport.reviewSummary.stillOpen')}
          </p>
          <div className="coin-import-review-summary__chips" role="list">
            {missingTargets.map((target) => {
              const label = t(target.labelKey)
              return (
                <button
                  key={target.key}
                  type="button"
                  role="listitem"
                  className="coin-import-review-summary__chip"
                  onClick={() => navigateToMissing(target.key)}
                  aria-label={t('coinImport.reviewSummary.missingChipAria', { label })}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="coin-import-review-summary__complete-note" role="status">
          {t('coinImport.reviewSummary.allReviewed')}
        </p>
      )}

      <div className="coin-import-review-summary__footer">
        <a
          href={appliedResult.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="coin-import-review-summary__source-link"
        >
          <Link2 className="h-3 w-3" aria-hidden />
          {t('coinImport.viewSource')}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {!allComplete ? (
          <button
            type="button"
            className="coin-import-review-summary__action-btn"
            onClick={openMissingPanel}
          >
            {t('coinImport.reviewSummary.completeMissing')}
          </button>
        ) : null}
      </div>
    </section>
  )
}
