import { useEffect, useMemo, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { runAfterCommit } from '../../lib/runAfterCommit'
import type { CoinFormValues, ContentLanguage } from '../../types/coinForm'
import {
  applySelectedImportReview,
  buildCoinImportReviewModel,
  computeReviewSummaryStats,
  mapImportExtendedFromResult,
  type CoinImportMissingFieldKey,
  type CoinImportMissingFieldTarget,
  type CoinImportReviewFieldRow,
  type CoinImportReviewFieldStatus,
  type CoinImportReviewMintRow,
  type CoinImportReviewSection,
  type CoinImportReviewSourceBadge,
  type CoinLinkImportResult,
} from '../../lib/coinImport'
import type { FormOptions } from '../../types/formOptions'
import { CoinImportMissingFieldList } from './CoinLinkImportMissingFieldsPanel'
import { CoinLinkImportDataPreview } from './CoinLinkImportDataPreview'

type CoinLinkImportPreviewModalProps = {
  open: boolean
  result: CoinLinkImportResult | null
  currentValues: CoinFormValues
  formOptions: FormOptions
  contentLanguage: ContentLanguage
  missingTargets: CoinImportMissingFieldTarget[]
  sourceUrlCount?: number
  sourceUrls?: string[]
  onCancel: () => void
  onApply: (nextValues: CoinFormValues) => void
  onNavigateToMissing?: (key: CoinImportMissingFieldKey) => void
}

function confidenceBadgeClass(confidence: CoinLinkImportResult['confidence']): string {
  switch (confidence) {
    case 'high':
      return 'coin-import-badge coin-import-badge--high coin-import-badge--compact'
    case 'medium':
      return 'coin-import-badge coin-import-badge--medium coin-import-badge--compact'
    default:
      return 'coin-import-badge coin-import-badge--low coin-import-badge--compact'
  }
}

function statusClass(status: CoinImportReviewFieldStatus): string {
  return `coin-import-review-status coin-import-review-status--${status.replace('_', '-')}`
}

function SourceBadge({ source }: { source: CoinImportReviewSourceBadge }) {
  const { t } = useTranslation()
  return (
    <span
      className={[
        'coin-import-review-source',
        source === 'catalog' ? 'coin-import-review-source--catalog' : '',
        source === 'combined' ? 'coin-import-review-source--combined' : '',
        source === 'pasted_catalogue' ? 'coin-import-review-source--pasted' : '',
      ].join(' ')}
    >
      {t(`coinImport.review.source.${source}`)}
    </span>
  )
}

function ConfidenceLabel({ confidence }: { confidence: CoinLinkImportResult['confidence'] }) {
  const { t } = useTranslation()
  return (
    <span className={confidenceBadgeClass(confidence)} title={t(`coinImport.confidence.${confidence}`)}>
      {t(`coinImport.confidence.${confidence}`)}
    </span>
  )
}

function StatusLabel({ status }: { status: CoinImportReviewFieldStatus }) {
  const { t } = useTranslation()
  return <span className={statusClass(status)}>{t(`coinImport.review.status.${status}`)}</span>
}

function ReviewFieldRowCard({
  row,
  checked,
  onToggle,
}: {
  row: CoinImportReviewFieldRow
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  const canApply = !row.displayOnly && row.status !== 'missing' && row.status !== 'needs_review'
  const displayValue = row.isTaxonomy && row.matchedValue
    ? `${row.aiValue} → ${row.matchedValue}`
    : row.aiValue || '—'

  return (
    <div className="coin-import-review-card">
      <div className="coin-import-review-card__head">
        <label className="coin-import-review-card__apply">
          <input
            type="checkbox"
            checked={checked}
            disabled={!canApply}
            onChange={(event) => onToggle(event.target.checked)}
            aria-label={t('coinImport.review.applyField', { field: t(row.labelKey) })}
          />
          <span className="coin-import-review-card__field">{t(row.labelKey)}</span>
        </label>
        <StatusLabel status={row.status} />
      </div>
      <dl className="coin-import-review-card__meta">
        <div>
          <dt>{t('coinImport.review.columnAiValue')}</dt>
          <dd>{displayValue}</dd>
          {row.isTaxonomy && row.aiValue && row.matchedValue ? (
            <p className="coin-import-review-card__match">
              {t('coinImport.review.matchedOption')}: {row.matchedValue}
            </p>
          ) : null}
          {row.isTaxonomy && row.aiValue && !row.matchedValue ? (
            <p className="coin-import-review-card__warn">{t('coinImport.review.noTaxonomyMatch')}</p>
          ) : null}
        </div>
        <div>
          <dt>{t('coinImport.review.columnSource')}</dt>
          <dd>
            <SourceBadge source={row.source} />
          </dd>
        </div>
        <div>
          <dt>{t('coinImport.review.columnConfidence')}</dt>
          <dd>
            <ConfidenceLabel confidence={row.confidence} />
          </dd>
        </div>
      </dl>
    </div>
  )
}

function ReviewTableValueCell({
  value,
  clamp = false,
}: {
  value: string
  clamp?: boolean
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const trimmed = value.trim()
  const shouldClamp = clamp && trimmed.length > 120

  if (!trimmed || trimmed === '—') {
    return <div>—</div>
  }

  if (!shouldClamp) {
    return <div className="coin-import-review-table__value">{trimmed}</div>
  }

  return (
    <div className="coin-import-review-table__value">
      <p className={expanded ? undefined : 'coin-import-review-table__value-clamp'}>{trimmed}</p>
      <button
        type="button"
        className="coin-import-review-table__value-toggle"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? t('coinImport.showLess') : t('coinImport.showMore')}
      </button>
    </div>
  )
}

const CLAMP_VALUE_KEYS = new Set([
  'short_description',
  'coin_obverse_description',
  'coin_reverse_description',
  'coin_historical_background',
])

function ReviewFieldTable({
  rows,
  selectedFields,
  onToggleField,
}: {
  rows: CoinImportReviewFieldRow[]
  selectedFields: Record<string, boolean>
  onToggleField: (key: string, checked: boolean) => void
}) {
  const { t } = useTranslation()
  const visibleRows = rows.filter((row) => row.status !== 'missing' || row.displayOnly)

  if (visibleRows.length === 0) {
    return null
  }

  return (
    <>
      <div className="coin-import-review-table-wrap hidden md:block">
        <table className="coin-import-review-table">
          <thead>
            <tr>
              <th scope="col" className="coin-import-review-table__apply-col">
                {t('coinImport.review.columnApply')}
              </th>
              <th scope="col">{t('coinImport.review.columnField')}</th>
              <th scope="col">{t('coinImport.review.columnAiValue')}</th>
              <th scope="col">{t('coinImport.review.columnSource')}</th>
              <th scope="col">{t('coinImport.review.columnConfidence')}</th>
              <th scope="col">{t('coinImport.review.columnStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const canApply =
                !row.displayOnly && row.status !== 'missing' && row.status !== 'needs_review'
              const displayValue = row.isTaxonomy && row.matchedValue
                ? `${row.aiValue} → ${row.matchedValue}`
                : row.aiValue || '—'

              return (
                <tr key={row.key}>
                  <td className="coin-import-review-table__apply-col">
                    {row.displayOnly ? (
                      <span className="sr-only">{t('coinImport.review.displayOnly')}</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={Boolean(selectedFields[row.key])}
                        disabled={!canApply}
                        onChange={(event) => onToggleField(row.key, event.target.checked)}
                        aria-label={t('coinImport.review.applyField', { field: t(row.labelKey) })}
                      />
                    )}
                  </td>
                  <td className="coin-import-review-table__field">{t(row.labelKey)}</td>
                  <td className="coin-import-review-table__value-col">
                    <ReviewTableValueCell
                      value={displayValue}
                      clamp={CLAMP_VALUE_KEYS.has(row.key)}
                    />
                    {row.isTaxonomy && row.aiValue && row.matchedValue ? (
                      <p className="coin-import-review-table__sub">
                        {t('coinImport.review.matchedOption')}: {row.matchedValue}
                      </p>
                    ) : null}
                    {row.isTaxonomy && row.aiValue && !row.matchedValue ? (
                      <p className="coin-import-review-table__warn">{t('coinImport.review.noTaxonomyMatch')}</p>
                    ) : null}
                  </td>
                  <td className="coin-import-review-table__badge-col">
                    <SourceBadge source={row.source} />
                  </td>
                  <td className="coin-import-review-table__badge-col">
                    <ConfidenceLabel confidence={row.confidence} />
                  </td>
                  <td className="coin-import-review-table__badge-col">
                    <StatusLabel status={row.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="coin-import-review-cards md:hidden">
        {visibleRows.map((row) => (
          <ReviewFieldRowCard
            key={row.key}
            row={row}
            checked={Boolean(selectedFields[row.key])}
            onToggle={(checked) => onToggleField(row.key, checked)}
          />
        ))}
      </div>
    </>
  )
}

function ReviewSectionBlock({
  section,
  selectedFields,
  onToggleField,
}: {
  section: CoinImportReviewSection
  selectedFields: Record<string, boolean>
  onToggleField: (key: string, checked: boolean) => void
}) {
  const { t } = useTranslation()

  if (section.fields.every((row) => row.status === 'missing' && !row.displayOnly)) {
    return null
  }

  return (
    <section className="coin-import-review-section">
      <h3 className="coin-import-review-section__title">{t(section.labelKey)}</h3>
      <ReviewFieldTable
        rows={section.fields}
        selectedFields={selectedFields}
        onToggleField={onToggleField}
      />
    </section>
  )
}

function ReviewSummaryCards({ stats }: { stats: ReturnType<typeof computeReviewSummaryStats> }) {
  const { t } = useTranslation()

  const items = [
    { key: 'fieldsFound', value: stats.fieldsFound },
    { key: 'readyToApply', value: stats.readyToApply },
    { key: 'needsReview', value: stats.needsReview },
    { key: 'existingValues', value: stats.existingValues },
  ] as const

  return (
    <div className="coin-import-review-summary">
      {items.map((item) => (
        <div key={item.key} className="coin-import-review-summary__card">
          <span className="coin-import-review-summary__value">{item.value}</span>
          <span className="coin-import-review-summary__label">
            {t(`coinImport.review.summary.${item.key}`)}
          </span>
        </div>
      ))}
    </div>
  )
}

function OfficialMintVariantsSection({
  rows,
  selectedMintRows,
  hasExistingMintData,
  replaceExistingMint,
  onToggleRow,
  onReplaceExistingChange,
}: {
  rows: CoinImportReviewMintRow[]
  selectedMintRows: Record<string, boolean>
  hasExistingMintData: boolean
  replaceExistingMint: boolean
  onToggleRow: (code: string, checked: boolean) => void
  onReplaceExistingChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()

  if (rows.length === 0) {
    return null
  }

  const anyMintSelected = rows.some((row) => selectedMintRows[row.mintMarkCode])

  return (
    <section className="coin-import-review-section">
      <div className="coin-import-review-section__head">
        <h3 className="coin-import-review-section__title">{t('coinImport.review.sectionMintVariants')}</h3>
        <p className="coin-import-review-section__count" role="status">
          {t('coinImport.review.mintRowsDetected', { count: rows.length })}
        </p>
      </div>

      {hasExistingMintData ? (
        <div className="coin-import-warning-card coin-import-warning-card--amber mb-3" role="note">
          <p className="text-sm">{t('coinImport.review.mintExistingWarning')}</p>
          <label className="coin-import-review-replace mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replaceExistingMint}
              onChange={(event) => onReplaceExistingChange(event.target.checked)}
              disabled={!anyMintSelected}
            />
            <span>{t('coinImport.review.replaceExistingMint')}</span>
          </label>
        </div>
      ) : null}

      <div className="coin-import-review-table-wrap hidden md:block">
        <table className="coin-import-review-table">
          <thead>
            <tr>
              <th scope="col" className="coin-import-review-table__apply-col">
                {t('coinImport.review.columnApply')}
              </th>
              <th scope="col">{t('coinImport.preview.mint')}</th>
              <th scope="col">{t('coinImport.preview.mintNotes')}</th>
              <th scope="col">{t('coinImport.preview.mintMintage')}</th>
              <th scope="col">{t('coinImport.review.columnSource')}</th>
              <th scope="col">{t('coinImport.review.columnConfidence')}</th>
              <th scope="col">{t('coinImport.review.columnStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const canApply = row.status === 'ready' || row.status === 'existing_value'
              return (
                <tr key={row.mintMarkCode}>
                  <td className="coin-import-review-table__apply-col">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedMintRows[row.mintMarkCode])}
                      disabled={!canApply}
                      onChange={(event) => onToggleRow(row.mintMarkCode, event.target.checked)}
                      aria-label={t('coinImport.review.applyMintRow', { mint: row.mintMarkCode })}
                    />
                  </td>
                  <td>{row.mintMarkCode}</td>
                  <td>{row.city || '—'}</td>
                  <td>{row.mintage || '—'}</td>
                  <td>
                    <SourceBadge source={row.source} />
                  </td>
                  <td>
                    <ConfidenceLabel confidence={row.confidence} />
                  </td>
                  <td>
                    <StatusLabel status={row.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="coin-import-review-cards md:hidden">
        {rows.map((row) => {
          const canApply = row.status === 'ready' || row.status === 'existing_value'
          return (
            <div key={row.mintMarkCode} className="coin-import-review-card">
              <div className="coin-import-review-card__head">
                <label className="coin-import-review-card__apply">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedMintRows[row.mintMarkCode])}
                    disabled={!canApply}
                    onChange={(event) => onToggleRow(row.mintMarkCode, event.target.checked)}
                  />
                  <span className="coin-import-review-card__field">
                    {t('coinImport.review.mintRowLabel', { mint: row.mintMarkCode, city: row.city })}
                  </span>
                </label>
                <StatusLabel status={row.status} />
              </div>
              <dl className="coin-import-review-card__meta">
                <div>
                  <dt>{t('coinImport.preview.mintMintage')}</dt>
                  <dd>{row.mintage || '—'}</dd>
                </div>
                <div>
                  <dt>{t('coinImport.review.columnSource')}</dt>
                  <dd>
                    <SourceBadge source={row.source} />
                  </dd>
                </div>
                <div>
                  <dt>{t('coinImport.review.columnConfidence')}</dt>
                  <dd>
                    <ConfidenceLabel confidence={row.confidence} />
                  </dd>
                </div>
              </dl>
            </div>
          )
        })}
      </div>
    </section>
  )
}

type ReviewModalSection = 'preview' | 'apply'

function ReviewModalSubnav({
  activeSection,
  onScrollToPreview,
  onScrollToApply,
}: {
  activeSection: ReviewModalSection
  onScrollToPreview: () => void
  onScrollToApply: () => void
}) {
  const { t } = useTranslation()

  const items: Array<{ id: ReviewModalSection; labelKey: string; onClick: () => void }> = [
    { id: 'preview', labelKey: 'coinImport.review.navImportedPreview', onClick: onScrollToPreview },
    { id: 'apply', labelKey: 'coinImport.review.navApplyFields', onClick: onScrollToApply },
  ]

  return (
    <nav className="coin-import-modal__subnav" aria-label={t('coinImport.review.modalNavLabel')}>
      <div className="coin-import-modal__subnav-track" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeSection === item.id}
            aria-label={t(item.labelKey)}
            className={[
              'coin-import-modal__subnav-btn',
              activeSection === item.id ? 'coin-import-modal__subnav-btn--active' : '',
            ].join(' ')}
            onClick={item.onClick}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function CoinLinkImportPreviewModal({
  open,
  result,
  currentValues,
  formOptions,
  contentLanguage,
  missingTargets,
  sourceUrlCount = 1,
  onCancel,
  onApply,
  onNavigateToMissing,
}: CoinLinkImportPreviewModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const modalBodyRef = useRef<HTMLDivElement>(null)
  const previewSectionRef = useRef<HTMLElement>(null)
  const applySectionRef = useRef<HTMLDivElement>(null)
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({})
  const [selectedMintRows, setSelectedMintRows] = useState<Record<string, boolean>>({})
  const [replaceExistingMint, setReplaceExistingMint] = useState(false)
  const [activeNavSection, setActiveNavSection] = useState<ReviewModalSection>('preview')

  const reviewModel = useMemo(
    () =>
      result
        ? buildCoinImportReviewModel(result, currentValues, formOptions, contentLanguage, {
            multiSource: sourceUrlCount > 1,
          })
        : null,
    [result, currentValues, formOptions, contentLanguage, sourceUrlCount],
  )

  const extendedImport = useMemo(
    () => (result ? mapImportExtendedFromResult(result) : undefined),
    [result],
  )

  const summaryStats = useMemo(
    () => (reviewModel ? computeReviewSummaryStats(reviewModel) : null),
    [reviewModel],
  )

  useEffect(() => {
    if (!open || !reviewModel) {
      return
    }

    const fields: Record<string, boolean> = {}
    for (const section of reviewModel.sections) {
      for (const row of section.fields) {
        if (!row.displayOnly) {
          fields[row.key] = row.defaultSelected
        }
      }
    }

    const mint: Record<string, boolean> = {}
    for (const row of reviewModel.mintRows) {
      mint[row.mintMarkCode] = row.defaultSelected
    }

    runAfterCommit(() => {
      setSelectedFields(fields)
      setSelectedMintRows(mint)
      setReplaceExistingMint(false)
      setActiveNavSection('preview')
    })

    requestAnimationFrame(() => {
      modalBodyRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [open, reviewModel, result])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onCancel])

  if (!open || !result || !reviewModel) {
    return null
  }

  function scrollModalToSection(target: HTMLElement | null, section: ReviewModalSection) {
    if (!target || !modalBodyRef.current) {
      return
    }

    setActiveNavSection(section)

    const bodyTop = modalBodyRef.current.getBoundingClientRect().top
    const targetTop = target.getBoundingClientRect().top
    const offset = targetTop - bodyTop + modalBodyRef.current.scrollTop - 8

    modalBodyRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
  }

  function scrollToPreviewSection() {
    scrollModalToSection(previewSectionRef.current, 'preview')
  }

  function scrollToApplySection() {
    scrollModalToSection(applySectionRef.current, 'apply')
  }

  const selectedFieldCount = Object.values(selectedFields).filter(Boolean).length
  const selectedMintCount = Object.values(selectedMintRows).filter(Boolean).length
  const mintBlocked =
    reviewModel.hasExistingMintData &&
    selectedMintCount > 0 &&
    !replaceExistingMint

  function handleApplySelected() {
    if (mintBlocked) {
      return
    }

    const fieldKeys = Object.entries(selectedFields)
      .filter(([, checked]) => checked)
      .map(([key]) => key)
    const mintMarkCodes = Object.entries(selectedMintRows)
      .filter(([, checked]) => checked)
      .map(([code]) => code)

    const nextValues = applySelectedImportReview(
      currentValues,
      reviewModel!,
      {
        fieldKeys,
        mintMarkCodes,
        replaceExistingMint,
      },
      extendedImport,
    )
    onApply(nextValues)
  }

  return (
    <div className="coin-import-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coin-import-preview-title"
        tabIndex={-1}
        className="coin-import-modal coin-import-modal--review"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="coin-import-modal__header coin-import-modal__header--review">
          <div className="coin-import-modal__header-main">
            <div className="coin-import-modal__title-row">
              <span className="coin-import-modal__title-icon" aria-hidden>
                <Link2 className="h-4 w-4" />
              </span>
              <div>
                <h2 id="coin-import-preview-title" className="coin-import-modal__title">
                  {t('coinImport.previewTitle')}
                </h2>
                <p className="coin-import-modal__subtitle">{t('coinImport.previewSubtitle')}</p>
              </div>
            </div>
          </div>
          <div className="coin-import-modal__header-aside">
            <ConfidenceLabel confidence={reviewModel.confidence} />
            {summaryStats ? (
              <p className="coin-import-modal__header-meta">
                {t('coinImport.review.headerFieldsFound', { count: summaryStats.fieldsFound })}
                {sourceUrlCount > 1
                  ? ` · ${t('coinImport.review.headerSourceCount', { count: sourceUrlCount })}`
                  : null}
              </p>
            ) : null}
          </div>
        </div>

        <ReviewModalSubnav
          activeSection={activeNavSection}
          onScrollToPreview={scrollToPreviewSection}
          onScrollToApply={scrollToApplySection}
        />

        <div ref={modalBodyRef} className="coin-import-modal__body coin-import-modal__body--review">
          {summaryStats ? <ReviewSummaryCards stats={summaryStats} /> : null}

          <CoinLinkImportDataPreview
            reviewModel={reviewModel}
            result={result}
            sourceUrlCount={sourceUrlCount}
            sectionRef={previewSectionRef}
          />

          {missingTargets.length > 0 ? (
            <section className="coin-import-missing-review coin-import-missing-review--compact">
              <div className="coin-import-missing-review__header">
                <h3 className="font-serif text-sm font-semibold text-navy">
                  {t('coinImport.missingReview.title')}
                </h3>
                <p className="mt-0.5 text-xs text-navy-muted">{t('coinImport.missingReview.subtitle')}</p>
              </div>
              {onNavigateToMissing ? (
                <CoinImportMissingFieldList
                  targets={missingTargets}
                  onNavigate={onNavigateToMissing}
                  compact
                />
              ) : (
                <ul className="coin-import-missing-plain-list">
                  {missingTargets.map((target) => (
                    <li key={target.key}>{t(target.labelKey)}</li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <section
            ref={applySectionRef}
            id="coin-import-apply-section"
            className="coin-import-apply-section"
          >
            <div className="coin-import-apply-section__intro">
              <h3 className="coin-import-apply-section__title">{t('coinImport.review.chooseFieldsTitle')}</h3>
              <p className="coin-import-apply-section__hint">{t('coinImport.review.applySectionHint')}</p>
            </div>

            <div className="coin-import-apply-section__tables">
              {reviewModel.sections.map((section) => (
                <ReviewSectionBlock
                  key={section.id}
                  section={section}
                  selectedFields={selectedFields}
                  onToggleField={(key, checked) =>
                    setSelectedFields((current) => ({ ...current, [key]: checked }))
                  }
                />
              ))}

              <OfficialMintVariantsSection
                rows={reviewModel.mintRows}
                selectedMintRows={selectedMintRows}
                hasExistingMintData={reviewModel.hasExistingMintData}
                replaceExistingMint={replaceExistingMint}
                onToggleRow={(code, checked) =>
                  setSelectedMintRows((current) => ({ ...current, [code]: checked }))
                }
                onReplaceExistingChange={setReplaceExistingMint}
              />
            </div>
          </section>

          {result.warnings.length > 0 ? (
            <section className="coin-import-warning-card coin-import-warning-card--amber" role="note">
              <p className="font-semibold">{t('coinImport.warnings')}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.extracted.images && result.extracted.images.length > 0 ? (
            <section className="coin-import-panel coin-import-panel--compact">
              <p className="coin-import-panel__label">{t('coinImport.imagePreview')}</p>
              <p className="mb-2 text-xs text-navy-muted">{t('coinImport.imagePreviewHint')}</p>
              <div className="coin-import-image-grid">
                {result.extracted.images.map((url) => (
                  <figure key={url} className="coin-import-image-grid__item">
                    <img src={url} alt={t('coinImport.imagePreviewAlt')} loading="lazy" />
                  </figure>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="coin-import-modal__footer coin-import-modal__footer--review">
          <div className="coin-import-modal__footer-left">
            <p className="coin-import-modal__footer-hint">{t('coinImport.review.footerApplyHint')}</p>
            <button
              type="button"
              className="coin-import-modal__footer-link"
              onClick={scrollToPreviewSection}
              aria-label={t('coinImport.review.viewImportedPreviewAria')}
            >
              {t('coinImport.review.viewImportedPreview')}
            </button>
          </div>
          <div className="coin-import-modal__footer-actions">
            <button type="button" className="coin-import-btn coin-import-btn--secondary" onClick={onCancel}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="coin-import-btn coin-import-btn--primary"
              disabled={selectedFieldCount === 0 && selectedMintCount === 0}
              onClick={handleApplySelected}
              aria-label={t('coinImport.review.applySelectedCount', {
                count: selectedFieldCount + selectedMintCount,
              })}
              aria-describedby={mintBlocked ? 'coin-import-mint-block-hint' : undefined}
            >
              {t('coinImport.review.applySelected')}
            </button>
          </div>
        </div>
        {mintBlocked ? (
          <p id="coin-import-mint-block-hint" className="coin-import-modal__hint">
            {t('coinImport.review.confirmReplaceMint')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
