import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatImportReviewSourceHost } from '../../lib/importReviewDisplayUtils'
import { resolveImportSourceTypeFromUrl } from '../../lib/coinImportFieldUtils'
import type { CoinLinkImportSourceEntry } from '../../lib/coinImport'

type CoinLinkImportReviewSourcesProps = {
  sources: CoinLinkImportSourceEntry[]
}

export function CoinLinkImportReviewSources({ sources }: CoinLinkImportReviewSourcesProps) {
  const { t } = useTranslation()

  if (sources.length === 0) {
    return null
  }

  return (
    <div className="coin-import-review-summary__sources">
      <p className="coin-import-review-summary__section-label">
        {t('coinImport.reviewSummary.sourcesLabel')}
      </p>
      <ul className="coin-import-review-summary__source-list" role="list">
        {sources.map((source) => {
          const host = formatImportReviewSourceHost(source.url)
          const sourceType = source.sourceType ?? resolveImportSourceTypeFromUrl(source.url)
          const sourceLabel =
            source.label ||
            (sourceType === 'supplemental'
              ? t('coinImport.preview.sourceTypeSupplemental')
              : t('coinImport.preview.sourceTypePrimary'))

          return (
            <li key={source.url} className="coin-import-review-summary__source-card" role="listitem">
              <div className="coin-import-review-summary__source-card-head">
                <p className="coin-import-review-summary__source-name" title={sourceLabel}>
                  {sourceLabel}
                </p>
                <span className="coin-import-source-type coin-import-source-type--compact">
                  {sourceType === 'supplemental'
                    ? t('coinImport.preview.sourceTypeSupplemental')
                    : t('coinImport.preview.sourceTypePrimary')}
                </span>
              </div>
              <p className="coin-import-review-summary__source-host" title={source.url}>
                {host}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="coin-import-review-summary__source-open"
                title={source.url}
              >
                <span className="min-w-0 truncate">{t('coinImport.preview.openSource')}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
