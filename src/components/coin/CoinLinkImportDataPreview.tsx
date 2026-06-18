import { useState, type Ref } from 'react'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatImportReviewSourceHost } from '../../lib/importReviewDisplayUtils'
import { resolveImportSourceTypeFromUrl } from '../../lib/coinImportFieldUtils'
import type {
  CoinImportReviewFieldRow,
  CoinImportReviewModel,
  CoinLinkImportResult,
  CoinLinkImportSourceEntry,
} from '../../lib/coinImport'
import { computeReviewSummaryStats } from '../../lib/coinImport'
import { hasImportPreviewData } from '../../lib/coinLinkImportPreviewUtils'
import { getCoinIssueStatusDisplayLabel } from '../../lib/coinDisplayLabels'

const HERO_KEYS = new Set(['country', 'year', 'denomination', 'coin_theme'])
const RELEASE_KEYS = new Set([
  'released_date',
  'coin_issue_status',
  'coin_mintage',
  'coin_material',
  'coin_quality',
  'coin_weight_g',
  'coin_diameter_mm',
  'coin_edge_inscription',
])
const MINT_KEYS = new Set(['coin_mint_marks_available', 'coin_has_mint_variants'])
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

function getRowValue(rows: CoinImportReviewFieldRow[], key: string): string {
  const row = rows.find((entry) => entry.key === key)
  return row ? previewDisplayValue(row) : ''
}

function visibleRows(rows: CoinImportReviewFieldRow[]) {
  return rows
    .map((row) => ({ row, value: previewDisplayValue(row) }))
    .filter((entry) => entry.value.length > 0)
}

function CompactFieldList({ rows }: { rows: CoinImportReviewFieldRow[] }) {
  const { t } = useTranslation()
  const entries = visibleRows(rows)

  if (entries.length === 0) {
    return null
  }

  return (
    <dl className="coin-import-preview-hero__list">
      {entries.map(({ row, value }) => (
        <div key={row.key} className="coin-import-preview-hero__list-row">
          <dt>{t(row.labelKey)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function PreviewHeroCard({
  basicRows,
  stats,
  confidence,
}: {
  basicRows: CoinImportReviewFieldRow[]
  stats: ReturnType<typeof computeReviewSummaryStats>
  confidence: CoinLinkImportResult['confidence']
}) {
  const { t } = useTranslation()
  const theme = getRowValue(basicRows, 'coin_theme')
  const country = getRowValue(basicRows, 'country')
  const year = getRowValue(basicRows, 'year')
  const denomination = getRowValue(basicRows, 'denomination')
  const identityParts = [country, year, denomination].filter(Boolean)

  return (
    <article className="coin-import-preview-hero__card">
      <p className="coin-import-preview-hero__theme">{theme || t('coinImport.preview.heroFallbackTitle')}</p>
      {identityParts.length > 0 ? (
        <p className="coin-import-preview-hero__identity">{identityParts.join(' · ')}</p>
      ) : null}
      <p className="coin-import-preview-hero__meta">
        <span className="coin-import-preview-hero__confidence">{t(`coinImport.confidence.${confidence}`)}</span>
        <span aria-hidden="true">·</span>
        <span>{t('coinImport.review.headerFieldsFound', { count: stats.fieldsFound })}</span>
        <span aria-hidden="true">·</span>
        <span>{t('coinImport.review.summary.readyToApply')}: {stats.readyToApply}</span>
      </p>
    </article>
  )
}

function resolvePreviewSources(result: CoinLinkImportResult): CoinLinkImportSourceEntry[] {
  if (result.sources && result.sources.length > 0) {
    return result.sources
  }

  if (!result.sourceUrl) {
    return []
  }

  return [
    {
      url: result.sourceUrl,
      label: result.sourceName,
      status: 'success',
    },
  ]
}

function SourceDetailCard({
  result,
  sourceUrlCount,
}: {
  result: CoinLinkImportResult
  sourceUrlCount: number
}) {
  const { t } = useTranslation()
  const sources = resolvePreviewSources(result)

  if (sources.length === 0) {
    return null
  }

  return (
    <section className="coin-import-preview-hero__detail">
      <h4 className="coin-import-preview-hero__detail-title">{t('coinImport.preview.summarySource')}</h4>
      <ul className="coin-import-sources-list coin-import-sources-list--preview">
        {sources.map((source) => {
          const host = formatImportReviewSourceHost(source.url)
          const sourceType = source.sourceType ?? resolveImportSourceTypeFromUrl(source.url)
          const sourceLabel =
            source.label ||
            (sourceType === 'supplemental'
              ? t('coinImport.preview.sourceTypeSupplemental')
              : t('coinImport.preview.sourceTypePrimary'))

          return (
            <li key={source.url} className="coin-import-sources-list__item">
              <div className="coin-import-sources-list__main">
                <p className="coin-import-sources-list__label">{sourceLabel}</p>
                <span className="coin-import-source-type coin-import-source-type--compact">
                  {t('coinImport.preview.sourceTypeLabel')}:{' '}
                  {sourceType === 'supplemental'
                    ? t('coinImport.preview.sourceTypeSupplemental')
                    : t('coinImport.preview.sourceTypePrimary')}
                </span>
              </div>
              <p className="coin-import-preview-hero__detail-sub">{host}</p>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="coin-import-preview-hero__source-btn"
              >
                {t('coinImport.preview.openSource')}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </a>
              {source.blockedReason ? (
                <p className="coin-import-sources-list__reason">{source.blockedReason}</p>
              ) : null}
            </li>
          )
        })}
      </ul>
      {sourceUrlCount > 1 ? (
        <p className="coin-import-preview-hero__detail-sub">
          {t('coinImport.review.headerSourceCount', { count: sourceUrlCount })}
        </p>
      ) : null}
    </section>
  )
}

function DescriptionsPanel({ rows }: { rows: CoinImportReviewFieldRow[] }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const entries = visibleRows(rows)

  if (entries.length === 0) {
    return null
  }

  const hasLongText = entries.some((entry) => entry.value.length > 140)

  return (
    <section className="coin-import-preview-hero__descriptions">
      <div className="coin-import-preview-hero__descriptions-head">
        <h4 className="coin-import-preview-hero__detail-title">
          {t('coinImport.preview.dataCardDescriptions')}
        </h4>
        {hasLongText ? (
          <button
            type="button"
            className="coin-import-preview-hero__expand"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? t('coinImport.showLess') : t('coinImport.showMore')}
          </button>
        ) : null}
      </div>
      <div
        className={[
          'coin-import-preview-hero__descriptions-body',
          expanded ? 'coin-import-preview-hero__descriptions-body--expanded' : '',
        ].join(' ')}
      >
        <dl className="coin-import-preview-hero__list">
          {entries.map(({ row, value }) => (
            <div key={row.key} className="coin-import-preview-hero__list-row">
              <dt>{t(row.labelKey)}</dt>
              <dd>{expanded ? value : value.length > 140 ? `${value.slice(0, 140).trimEnd()}…` : value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

type CoinLinkImportDataPreviewProps = {
  reviewModel: CoinImportReviewModel
  result: CoinLinkImportResult
  sourceUrlCount: number
  summaryStats: ReturnType<typeof computeReviewSummaryStats>
  sectionRef?: Ref<HTMLElement>
  onContinueToApply?: () => void
}

export function CoinLinkImportDataPreview({
  reviewModel,
  result,
  sourceUrlCount,
  summaryStats,
  sectionRef,
  onContinueToApply,
}: CoinLinkImportDataPreviewProps) {
  const { t } = useTranslation()

  const basicSection = reviewModel.sections.find((section) => section.id === 'basic')
  const releaseSection = reviewModel.sections.find((section) => section.id === 'release_specs')
  const mintSection = reviewModel.sections.find((section) => section.id === 'mint')
  const imagesSection = reviewModel.sections.find((section) => section.id === 'images')
  const descriptionSection = reviewModel.sections.find((section) => section.id === 'descriptions')

  const basicRows = basicSection?.fields.filter((row) => HERO_KEYS.has(row.key)) ?? []
  const releaseRows = releaseSection?.fields.filter((row) => RELEASE_KEYS.has(row.key)) ?? []
  const mintRows = mintSection?.fields.filter((row) => MINT_KEYS.has(row.key)) ?? []
  const imageRows = imagesSection?.fields ?? []
  const descriptionRows = [
    ...(basicSection?.fields.filter((row) => row.key === 'short_description') ?? []),
    ...(descriptionSection?.fields.filter((row) => DESCRIPTION_KEYS.has(row.key)) ?? []),
  ]

  const hasPreviewData = hasImportPreviewData(reviewModel, result)
  const primarySourceUrl = result.sources?.[0]?.url || result.sourceUrl
  const releaseContent = <CompactFieldList rows={releaseRows} />
  const mintContent = <CompactFieldList rows={mintRows} />
  const imageContent = <CompactFieldList rows={imageRows} />

  return (
    <section
      ref={sectionRef}
      id="coin-import-data-preview"
      className="coin-import-preview-hero"
      aria-labelledby="coin-import-data-preview-title"
    >
      <h3 id="coin-import-data-preview-title" className="sr-only">
        {t('coinImport.preview.dataTitle')}
      </h3>

      {hasPreviewData ? (
        <>
          <PreviewHeroCard basicRows={basicRows} stats={summaryStats} confidence={result.confidence} />

          <div className="coin-import-preview-hero__columns">
            {releaseContent ? (
              <section className="coin-import-preview-hero__detail">
                <h4 className="coin-import-preview-hero__detail-title">
                  {t('coinImport.preview.dataCardReleaseSpecs')}
                </h4>
                {releaseContent}
              </section>
            ) : null}
            {mintContent ? (
              <section className="coin-import-preview-hero__detail">
                <h4 className="coin-import-preview-hero__detail-title">
                  {t('coinImport.preview.dataCardMint')}
                </h4>
                {mintContent}
              </section>
            ) : null}
            <SourceDetailCard result={result} sourceUrlCount={sourceUrlCount} />
          </div>

          {imageContent ? (
            <section className="coin-import-preview-hero__detail">
              <h4 className="coin-import-preview-hero__detail-title">
                {t('coinImport.preview.dataCardImages')}
              </h4>
              {imageContent}
            </section>
          ) : null}

          <DescriptionsPanel rows={descriptionRows} />

          {onContinueToApply ? (
            <aside className="coin-import-preview-hero__cta">
              <p className="coin-import-preview-hero__cta-title">{t('coinImport.preview.reviewLooksGood')}</p>
              <div className="coin-import-preview-hero__cta-actions">
                <button type="button" className="coin-import-preview-hero__cta-primary" onClick={onContinueToApply}>
                  {t('coinImport.review.continueToApplyFields')}
                </button>
                {primarySourceUrl ? (
                  <a
                    href={primarySourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="coin-import-preview-hero__cta-secondary"
                  >
                    {t('coinImport.preview.viewSource')}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                ) : null}
              </div>
            </aside>
          ) : null}
        </>
      ) : (
        <div className="coin-import-preview-hero__empty" role="status">
          <p>{t('coinImport.preview.dataEmpty')}</p>
        </div>
      )}
    </section>
  )
}
