import { type Ref } from 'react'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  CoinImportReviewFieldRow,
  CoinImportReviewModel,
  CoinImportReviewSourceBadge,
  CoinLinkImportResult,
} from '../../lib/coinImport'

import { hasImportPreviewData } from '../../lib/coinLinkImportPreviewUtils'
import { getCoinIssueStatusDisplayLabel } from '../../lib/coinDisplayLabels'

const DESCRIPTION_CLAMP = 140

const IDENTITY_KEYS = new Set(['country', 'year', 'denomination', 'coin_theme', 'coin_designer'])
const RELEASE_KEYS = new Set([
  'released_date',
  'coin_issue_status',
  'coin_mintage',
  'coin_material',
  'coin_weight_g',
  'coin_diameter_mm',
  'coin_edge_inscription',
])
const SOURCE_KEYS = new Set(['coin_source_name', 'coin_source_url'])
const DESCRIPTION_KEYS = new Set([
  'short_description',
  'coin_obverse_description',
  'coin_reverse_description',
])

function previewDisplayValue(row: CoinImportReviewFieldRow): string {
  if (row.isTaxonomy && row.matchedValue?.trim()) {
    return row.matchedValue
  }
  if (row.key === 'coin_issue_status' && row.applyValue?.trim()) {
    return getCoinIssueStatusDisplayLabel(row.applyValue) || row.applyValue
  }
  if (row.applyValue?.trim()) {
    return row.applyValue
  }
  return row.aiValue?.trim() ?? ''
}

function clampPreviewText(value: string, max = DESCRIPTION_CLAMP): string {
  const trimmed = value.trim()
  if (trimmed.length <= max) {
    return trimmed
  }
  return `${trimmed.slice(0, max).trimEnd()}…`
}


function PreviewFieldList({
  rows,
  clampDescriptions = false,
}: {
  rows: CoinImportReviewFieldRow[]
  clampDescriptions?: boolean
}) {
  const { t } = useTranslation()
  const visible = rows
    .map((row) => ({
      row,
      value: previewDisplayValue(row),
    }))
    .filter((entry) => entry.value.length > 0)

  if (visible.length === 0) {
    return null
  }

  return (
    <dl className="coin-import-data-preview__field-list">
      {visible.map(({ row, value }) => (
        <div key={row.key} className="coin-import-data-preview__field">
          <dt>{t(row.labelKey)}</dt>
          <dd>
            {clampDescriptions ? clampPreviewText(value) : value}
            {row.derivedFromSource ? (
              <span className="coin-import-data-preview__derived-note">
                {row.key === 'coin_source_url' || row.key === 'coin_source_name'
                  ? t('coinImport.preview.derivedFromSourceUrl')
                  : t('coinImport.preview.derivedFromSource')}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function PreviewCard({
  titleKey,
  children,
}: {
  titleKey: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  if (!children) {
    return null
  }

  return (
    <article className="coin-import-data-preview__card">
      <h4 className="coin-import-data-preview__card-title">{t(titleKey)}</h4>
      {children}
    </article>
  )
}

function SourceBadge({ source }: { source: CoinImportReviewSourceBadge }) {
  const { t } = useTranslation()
  return (
    <span
      className={[
        'coin-import-review-source',
        source === 'combined' ? 'coin-import-review-source--combined' : '',
      ].join(' ')}
    >
      {t(`coinImport.review.source.${source}`)}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: CoinLinkImportResult['confidence'] }) {
  const { t } = useTranslation()
  const className =
    confidence === 'high'
      ? 'coin-import-badge coin-import-badge--high coin-import-badge--compact'
      : confidence === 'medium'
        ? 'coin-import-badge coin-import-badge--medium coin-import-badge--compact'
        : 'coin-import-badge coin-import-badge--low coin-import-badge--compact'

  return (
    <span className={className} title={t(`coinImport.confidence.${confidence}`)}>
      {t(`coinImport.confidence.${confidence}`)}
    </span>
  )
}

function SourcesPreviewCard({
  result,
  sourceUrlCount,
}: {
  result: CoinLinkImportResult
  sourceUrlCount: number
}) {
  const { t } = useTranslation()
  const sources = result.sources ?? []

  if (sources.length === 0 && !result.sourceUrl) {
    return null
  }

  const sourceBadge: CoinImportReviewSourceBadge = sourceUrlCount > 1 ? 'combined' : 'official'

  return (
    <PreviewCard titleKey="coinImport.preview.dataCardSources">
      <ul className="coin-import-data-preview__sources">
        {sources.length > 0 ? (
          sources.map((source) => (
            <li key={source.url} className="coin-import-data-preview__source-item">
              <div className="coin-import-data-preview__source-head">
                <span className="coin-import-data-preview__source-label">
                  {source.label || result.sourceName}
                </span>
                <span className={`coin-import-source-status coin-import-source-status--${source.status}`}>
                  {t(`coinImport.review.sourceStatus.${source.status}`)}
                </span>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="coin-import-data-preview__source-link"
              >
                {source.url}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              </a>
              <div className="coin-import-data-preview__source-badges">
                <SourceBadge source={sourceBadge} />
                <ConfidenceBadge confidence={result.confidence} />
              </div>
            </li>
          ))
        ) : (
          <li className="coin-import-data-preview__source-item">
            <div className="coin-import-data-preview__source-head">
              <span className="coin-import-data-preview__source-label">{result.sourceName}</span>
              <span className="coin-import-source-status coin-import-source-status--success">
                {t('coinImport.review.sourceStatus.success')}
              </span>
            </div>
            <a
              href={result.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="coin-import-data-preview__source-link"
            >
              {result.sourceUrl}
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </a>
            <div className="coin-import-data-preview__source-badges">
              <SourceBadge source={sourceBadge} />
              <ConfidenceBadge confidence={result.confidence} />
            </div>
          </li>
        )}
      </ul>
    </PreviewCard>
  )
}

type CoinLinkImportDataPreviewProps = {
  reviewModel: CoinImportReviewModel
  result: CoinLinkImportResult
  sourceUrlCount: number
  sectionRef?: Ref<HTMLElement>
}

export function CoinLinkImportDataPreview({
  reviewModel,
  result,
  sourceUrlCount,
  sectionRef,
}: CoinLinkImportDataPreviewProps) {
  const { t } = useTranslation()

  const basicSection = reviewModel.sections.find((section) => section.id === 'basic')
  const releaseSection = reviewModel.sections.find((section) => section.id === 'release_specs')
  const sourceSection = reviewModel.sections.find((section) => section.id === 'source')
  const descriptionSection = reviewModel.sections.find((section) => section.id === 'descriptions')

  const identityRows =
    basicSection?.fields.filter((row) => IDENTITY_KEYS.has(row.key)) ?? []
  const releaseRows =
    releaseSection?.fields.filter((row) => RELEASE_KEYS.has(row.key)) ?? []
  const sourceRows =
    sourceSection?.fields.filter((row) => SOURCE_KEYS.has(row.key)) ?? []
  const descriptionRows = [
    ...(basicSection?.fields.filter((row) => row.key === 'short_description') ?? []),
    ...(descriptionSection?.fields.filter((row) => DESCRIPTION_KEYS.has(row.key)) ?? []),
  ]

  const identityContent = <PreviewFieldList rows={identityRows} />
  const releaseContent = <PreviewFieldList rows={releaseRows} />
  const sourceContent = <PreviewFieldList rows={sourceRows} />
  const descriptionContent = <PreviewFieldList rows={descriptionRows} clampDescriptions />

  const hasPreviewData = hasImportPreviewData(reviewModel, result)

  return (
    <section
      ref={sectionRef}
      id="coin-import-data-preview"
      className="coin-import-data-preview"
      aria-labelledby="coin-import-data-preview-title"
    >
      <div className="coin-import-data-preview__header">
        <div className="coin-import-data-preview__title-row">
          <h3 id="coin-import-data-preview-title" className="coin-import-data-preview__title">
            {t('coinImport.preview.dataTitle')}
          </h3>
          <span className="coin-import-data-preview__badge">
            {t('coinImport.preview.scrapedBadge')}
          </span>
        </div>
        <p className="coin-import-data-preview__subtitle">{t('coinImport.preview.dataSubtitle')}</p>
      </div>

      {hasPreviewData ? (
        <div className="coin-import-data-preview__grid">
          <PreviewCard titleKey="coinImport.preview.dataCardIdentity">{identityContent}</PreviewCard>
          <PreviewCard titleKey="coinImport.preview.dataCardReleaseSpecs">{releaseContent}</PreviewCard>
          <PreviewCard titleKey="coinImport.preview.dataCardSource">{sourceContent}</PreviewCard>
          <PreviewCard titleKey="coinImport.preview.dataCardDescriptions">{descriptionContent}</PreviewCard>
          <SourcesPreviewCard result={result} sourceUrlCount={sourceUrlCount} />
        </div>
      ) : (
        <div className="coin-import-data-preview__empty" role="status">
          <p>{t('coinImport.preview.dataEmpty')}</p>
        </div>
      )}
    </section>
  )
}
