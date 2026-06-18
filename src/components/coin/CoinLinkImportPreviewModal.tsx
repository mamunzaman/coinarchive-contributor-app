import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatImportReviewSourceHost,
  isImportReviewCountryAlreadyMatching,
  resolveImportReviewCurrentDisplay,
  resolveImportReviewImportedDisplay,
} from '../../lib/importReviewDisplayUtils'
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
  type CoinLinkImportResult,
} from '../../lib/coinImport'
import type { FormOptions } from '../../types/formOptions'
import { CoinImportMissingFieldList } from './CoinLinkImportMissingFieldsPanel'
import { CoinLinkImportDataPreview } from './CoinLinkImportDataPreview'
import { ImportReviewCheckbox } from './ImportReviewCheckbox'

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

function statusClass(status: CoinImportReviewFieldStatus): string {
  return `coin-import-review-status coin-import-review-status--${status.replace('_', '-')}`
}

function StatusLabel({ status, id }: { status: CoinImportReviewFieldStatus; id?: string }) {
  const { t } = useTranslation()
  return (
    <span id={id} className={statusClass(status)}>
      {t(`coinImport.review.status.${status}`)}
    </span>
  )
}

const LONG_TEXT_FIELD_KEYS = new Set([
  'short_description',
  'coin_obverse_description',
  'coin_reverse_description',
  'coin_historical_background',
  'coin_edge_inscription',
  'coin_collector_notes',
])

const LONG_TEXT_CLAMP_CHARS = 80

function previewPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isLongPreviewText(value: string): boolean {
  const plain = previewPlainText(value)
  if (!plain || plain === '—') {
    return false
  }
  return plain.length > LONG_TEXT_CLAMP_CHARS || plain.split(' ').length > 14
}

function FieldRowStatus({
  row,
  countryAlreadyMatches,
  id,
}: {
  row: CoinImportReviewFieldRow
  countryAlreadyMatches: boolean
  id?: string
}) {
  const { t } = useTranslation()

  if (countryAlreadyMatches) {
    return (
      <span id={id} className="coin-import-review-status coin-import-review-status--already-matches">
        {t('coinImport.review.status.already_matches')}
      </span>
    )
  }

  if (row.displayOnly) {
    return (
      <span id={id} className="coin-import-review-row__pill">
        {t('coinImport.review.displayOnly')}
      </span>
    )
  }

  return <StatusLabel status={row.status} id={id} />
}

function ImportedValueCell({
  row,
  imported,
  isLongTextField,
  expanded,
  onExpandedChange,
}: {
  row: CoinImportReviewFieldRow
  imported: ReturnType<typeof resolveImportReviewImportedDisplay>
  isLongTextField: boolean
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}) {
  const { t } = useTranslation()

  if (row.key === 'coin_source_url' && imported.display && imported.display !== '—') {
    const host = formatImportReviewSourceHost(imported.display)
    return (
      <div className="coin-import-review-row__source-cell">
        <p className="coin-import-review-row__value coin-import-review-row__value--imported">{host}</p>
        <a
          href={imported.display}
          target="_blank"
          rel="noreferrer noopener"
          className="coin-import-review-row__source-open"
        >
          {t('coinImport.preview.openSource')}
        </a>
      </div>
    )
  }

  return (
    <>
      <ImportReviewValueText
        value={imported.display}
        clamp={isLongTextField}
        variant="imported"
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      />
      {imported.showMintageHint ? (
        <p className="coin-import-review-row__hint">{t('coinImport.review.mintageNumericHint')}</p>
      ) : null}
      {imported.formValueNote ? (
        <p className="coin-import-review-row__hint">
          {t('coinImport.review.releaseDateFormValue', { date: imported.formValueNote })}
        </p>
      ) : null}
    </>
  )
}

function ImportReviewRowExtras({ row }: { row: CoinImportReviewFieldRow }) {
  const { t } = useTranslation()
  const hasExtras =
    row.derivedFromSource ||
    (row.isTaxonomy && row.aiValue && row.matchedValue && row.aiValue !== row.matchedValue) ||
    (row.isTaxonomy && row.aiValue && !row.matchedValue)

  if (!hasExtras) {
    return null
  }

  return (
    <div className="coin-import-review-row__extras">
      {row.derivedFromSource ? (
        <p className="coin-import-review-row__derived">
          {row.key === 'coin_source_url' || row.key === 'coin_source_name'
            ? t('coinImport.preview.derivedFromSourceUrl')
            : t('coinImport.preview.derivedFromSource')}
        </p>
      ) : null}
      {row.isTaxonomy && row.aiValue && row.matchedValue && row.aiValue !== row.matchedValue ? (
        <p className="coin-import-review-row__match">
          {t('coinImport.review.matchedOption')}: {row.matchedValue}
        </p>
      ) : null}
      {row.isTaxonomy && row.aiValue && !row.matchedValue ? (
        <p className="coin-import-review-row__warn">{t('coinImport.review.noTaxonomyMatch')}</p>
      ) : null}
    </div>
  )
}

function ImportReviewValueText({
  value,
  clamp = false,
  variant = 'imported',
  expanded: expandedProp,
  onExpandedChange,
}: {
  value: string
  clamp?: boolean
  variant?: 'current' | 'imported'
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}) {
  const { t } = useTranslation()
  const [localExpanded, setLocalExpanded] = useState(false)
  const expanded = expandedProp ?? localExpanded
  const setExpanded = onExpandedChange ?? setLocalExpanded
  const displayValue = clamp ? previewPlainText(value) : value.trim()
  const shouldClamp = clamp && isLongPreviewText(value)

  if (!shouldClamp) {
    return (
      <p
        className={[
          'coin-import-review-row__value',
          variant === 'current' ? 'coin-import-review-row__value--current' : '',
          variant === 'imported' ? 'coin-import-review-row__value--imported' : '',
        ].join(' ')}
      >
        {displayValue || '—'}
      </p>
    )
  }

  return (
    <div className="coin-import-review-row__value coin-import-review-row__value--clampable">
      <p className={expanded ? undefined : 'coin-import-review-row__value-clamp'}>{displayValue}</p>
      <button
        type="button"
        className="coin-import-review-row__value-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? t('coinImport.showLess') : t('coinImport.showMore')}
      </button>
    </div>
  )
}

function ImportReviewFieldRow({
  row,
  currentValues,
  contentLanguage,
  checked,
  onToggle,
}: {
  row: CoinImportReviewFieldRow
  currentValues: CoinFormValues
  contentLanguage: ContentLanguage
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  const locale = contentLanguage === 'de' ? 'de-DE' : 'en-US'
  const countryAlreadyMatches = isImportReviewCountryAlreadyMatching(row, currentValues, locale)
  const canApply =
    !row.displayOnly &&
    !countryAlreadyMatches &&
    row.status !== 'missing' &&
    row.status !== 'needs_review'
  const checkboxId = `import-review-field-${row.key}`
  const statusId = `import-review-status-${row.key}`
  const currentDisplay = resolveImportReviewCurrentDisplay(row, currentValues, locale)
  const imported = resolveImportReviewImportedDisplay(row, locale)
  const isLongTextField = LONG_TEXT_FIELD_KEYS.has(row.key)
  const [currentExpanded, setCurrentExpanded] = useState(false)
  const [importedExpanded, setImportedExpanded] = useState(false)
  const rowExpanded = currentExpanded || importedExpanded
  const rowChecked = countryAlreadyMatches ? false : checked

  return (
    <article
      className={[
        'coin-import-review-row',
        rowChecked ? 'coin-import-review-row--selected' : '',
        isLongTextField ? 'coin-import-review-row--expandable' : '',
        rowExpanded ? 'coin-import-review-row--expanded' : '',
        row.key === 'coin_source_url' ? 'coin-import-review-row--source-url' : '',
      ].join(' ')}
      aria-labelledby={`import-review-label-${row.key}`}
    >
      <div className="coin-import-review-row__grid">
        <div className="coin-import-review-row__field">
          <div className="coin-import-review-row__field-main">
            {row.displayOnly ? (
              <span className="coin-import-review-row__checkbox-spacer" aria-hidden="true" />
            ) : (
              <ImportReviewCheckbox
                id={checkboxId}
                checked={rowChecked}
                disabled={!canApply}
                onChange={onToggle}
                ariaLabel={t('coinImport.review.applyField', { field: t(row.labelKey) })}
                describedBy={statusId}
              />
            )}
            <label
              id={`import-review-label-${row.key}`}
              htmlFor={row.displayOnly ? undefined : checkboxId}
              className="coin-import-review-row__label"
            >
              {t(row.labelKey)}
            </label>
          </div>
          <div className="coin-import-review-row__field-aside">
            <FieldRowStatus row={row} countryAlreadyMatches={countryAlreadyMatches} id={statusId} />
          </div>
        </div>

        <div className="coin-import-review-row__col coin-import-review-row__col--current">
          <span className="coin-import-review-row__col-label">
            {t('coinImport.review.columnCurrentValue')}
          </span>
          <ImportReviewValueText
            value={currentDisplay}
            clamp={isLongTextField}
            variant="current"
            expanded={currentExpanded}
            onExpandedChange={setCurrentExpanded}
          />
        </div>

        <div className="coin-import-review-row__col coin-import-review-row__col--imported">
          <span className="coin-import-review-row__col-label">
            {t('coinImport.review.columnImportedValue')}
          </span>
          <ImportedValueCell
            row={row}
            imported={imported}
            isLongTextField={isLongTextField}
            expanded={importedExpanded}
            onExpandedChange={setImportedExpanded}
          />
          {countryAlreadyMatches ? (
            <p className="coin-import-review-row__hint">{t('coinImport.review.noUpdateNeeded')}</p>
          ) : null}
          {row.key === 'country_code' ? (
            <p className="coin-import-review-row__hint">{t('coinImport.review.countryCodeHint')}</p>
          ) : null}
        </div>

        <div className="coin-import-review-row__col coin-import-review-row__col--status">
          <FieldRowStatus row={row} countryAlreadyMatches={countryAlreadyMatches} />
        </div>
      </div>

      <ImportReviewRowExtras row={row} />
    </article>
  )
}

function ReviewFieldList({
  rows,
  currentValues,
  contentLanguage,
  selectedFields,
  onToggleField,
}: {
  rows: CoinImportReviewFieldRow[]
  currentValues: CoinFormValues
  contentLanguage: ContentLanguage
  selectedFields: Record<string, boolean>
  onToggleField: (key: string, checked: boolean) => void
}) {
  const { t } = useTranslation()
  const visibleRows = rows.filter((row) => row.status !== 'missing' || row.displayOnly)

  if (visibleRows.length === 0) {
    return null
  }

  return (
    <div className="coin-import-review-list">
      <div className="coin-import-review-list__header" aria-hidden="true">
        <span>{t('coinImport.review.columnField')}</span>
        <span>{t('coinImport.review.columnCurrentValue')}</span>
        <span>{t('coinImport.review.columnImportedValue')}</span>
        <span>{t('coinImport.review.columnStatus')}</span>
      </div>
      {visibleRows.map((row) => (
        <ImportReviewFieldRow
          key={row.key}
          row={row}
          currentValues={currentValues}
          contentLanguage={contentLanguage}
          checked={Boolean(selectedFields[row.key])}
          onToggle={(checked) => onToggleField(row.key, checked)}
        />
      ))}
    </div>
  )
}

function ReviewSectionBlock({
  section,
  currentValues,
  contentLanguage,
  selectedFields,
  onToggleField,
}: {
  section: CoinImportReviewSection
  currentValues: CoinFormValues
  contentLanguage: ContentLanguage
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
      <ReviewFieldList
        rows={section.fields}
        currentValues={currentValues}
        contentLanguage={contentLanguage}
        selectedFields={selectedFields}
        onToggleField={onToggleField}
      />
    </section>
  )
}

function OfficialMintVariantsSection({
  rows,
  selectedMintRows,
  hasExistingMintData,
  replaceExistingMint,
  showExistingMintWarning,
  mintMarksFieldSelected,
  onToggleRow,
  onReplaceExistingChange,
}: {
  rows: CoinImportReviewMintRow[]
  selectedMintRows: Record<string, boolean>
  hasExistingMintData: boolean
  replaceExistingMint: boolean
  showExistingMintWarning: boolean
  mintMarksFieldSelected: boolean
  onToggleRow: (code: string, checked: boolean) => void
  onReplaceExistingChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()

  if (rows.length === 0 && !showExistingMintWarning) {
    return null
  }

  const anyMintSelected = rows.some((row) => selectedMintRows[row.mintMarkCode])

  return (
    <section className="coin-import-review-section">
      {rows.length > 0 ? (
        <div className="coin-import-review-section__head">
          <h3 className="coin-import-review-section__title">{t('coinImport.review.sectionMintVariants')}</h3>
          <p className="coin-import-review-section__count" role="status">
            {t('coinImport.review.mintRowsDetected', { count: rows.length })}
          </p>
        </div>
      ) : null}

      {hasExistingMintData && showExistingMintWarning ? (
        <div className="coin-import-warning-card coin-import-warning-card--amber mb-3" role="note">
          <p className="text-sm">{t('coinImport.review.mintExistingWarning')}</p>
          <label className="coin-import-review-replace mt-3 flex items-center gap-2.5 text-sm">
            <ImportReviewCheckbox
              id="import-review-replace-mint"
              checked={replaceExistingMint}
              disabled={!anyMintSelected && !mintMarksFieldSelected}
              onChange={onReplaceExistingChange}
              ariaLabel={t('coinImport.review.replaceExistingMint')}
            />
            <span>{t('coinImport.review.replaceExistingMint')}</span>
          </label>
        </div>
      ) : null}

      {rows.length > 0 ? (
      <div className="coin-import-review-list coin-import-review-list--mint">
        {rows.map((row) => {
          const canApply = row.status === 'ready' || row.status === 'existing_value'
          const checkboxId = `import-review-mint-${row.mintMarkCode}`
          const statusId = `import-review-mint-status-${row.mintMarkCode}`
          const checked = Boolean(selectedMintRows[row.mintMarkCode])

          return (
            <article
              key={row.mintMarkCode}
              className={[
                'coin-import-review-row coin-import-review-row--mint',
                checked ? 'coin-import-review-row--selected' : '',
              ].join(' ')}
            >
              <div className="coin-import-review-row__grid">
                <div className="coin-import-review-row__field">
                  <div className="coin-import-review-row__field-main">
                    <ImportReviewCheckbox
                      id={checkboxId}
                      checked={checked}
                      disabled={!canApply}
                      onChange={(nextChecked) => onToggleRow(row.mintMarkCode, nextChecked)}
                      ariaLabel={t('coinImport.review.applyMintRow', { mint: row.mintMarkCode })}
                      describedBy={statusId}
                    />
                    <label htmlFor={checkboxId} className="coin-import-review-row__label">
                      {t('coinImport.review.mintRowLabel', { mint: row.mintMarkCode, city: row.city })}
                    </label>
                  </div>
                  <div className="coin-import-review-row__field-aside">
                    <StatusLabel status={row.status} id={statusId} />
                  </div>
                </div>
                <div className="coin-import-review-row__col coin-import-review-row__col--current">
                  <span className="coin-import-review-row__col-label">
                    {t('coinImport.preview.mintNotes')}
                  </span>
                  <p className="coin-import-review-row__value coin-import-review-row__value--current">
                    {row.city || '—'}
                  </p>
                </div>
                <div className="coin-import-review-row__col coin-import-review-row__col--imported">
                  <span className="coin-import-review-row__col-label">
                    {t('coinImport.preview.mintMintage')}
                  </span>
                  <p className="coin-import-review-row__value coin-import-review-row__value--imported">
                    {row.mintage || '—'}
                  </p>
                </div>
                <div className="coin-import-review-row__col coin-import-review-row__col--status">
                  <StatusLabel status={row.status} />
                </div>
              </div>
              <p className="coin-import-review-row__meta">
                {[
                  t(`coinImport.review.source.${row.source}`),
                  t(`coinImport.confidence.${row.confidence}`),
                ].join(' · ')}
              </p>
            </article>
          )
        })}
      </div>
      ) : null}
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

  const items: Array<{
    id: ReviewModalSection
    labelKey: string
    onClick: () => void
  }> = [
    { id: 'preview', labelKey: 'coinImport.review.stepPreview', onClick: onScrollToPreview },
    { id: 'apply', labelKey: 'coinImport.review.stepApplyFields', onClick: onScrollToApply },
  ]

  return (
    <nav className="coin-import-modal__workflow" aria-label={t('coinImport.review.modalNavLabel')}>
      <div className="coin-import-modal__workflow-track" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            id={`coin-import-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={activeSection === item.id}
            aria-controls={`coin-import-panel-${item.id}`}
            className={[
              'coin-import-modal__workflow-btn',
              activeSection === item.id ? 'coin-import-modal__workflow-btn--active' : '',
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

    const stats = computeReviewSummaryStats(reviewModel)
    const openApplyByDefault = stats.readyToApply > 0

    runAfterCommit(() => {
      setSelectedFields(fields)
      setSelectedMintRows(mint)
      setReplaceExistingMint(false)
      setActiveNavSection(openApplyByDefault ? 'apply' : 'preview')
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

  function goToSection(section: ReviewModalSection) {
    setActiveNavSection(section)
    modalBodyRef.current?.scrollTo({ top: 0, left: 0, behavior: section === 'preview' ? 'smooth' : 'auto' })
  }

  function scrollToPreviewSection() {
    goToSection('preview')
  }

  function scrollToApplySection() {
    goToSection('apply')
  }

  const selectedFieldCount = Object.values(selectedFields).filter(Boolean).length
  const selectedMintCount = Object.values(selectedMintRows).filter(Boolean).length
  const mintMarksFieldSelected = Boolean(selectedFields.coin_mint_marks_available)
  const mintApplySelected = mintMarksFieldSelected || selectedMintCount > 0
  const mintBlocked =
    reviewModel.hasExistingMintData && mintApplySelected && !replaceExistingMint
  const showMintExistingWarning =
    reviewModel.hasExistingMintData &&
    (reviewModel.mintRows.length > 0 ||
      (reviewModel.sections
        .find((section) => section.id === 'mint')
        ?.fields.some(
          (row) => row.key === 'coin_mint_marks_available' && row.status !== 'missing',
        ) ??
        false))

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
            <h2 id="coin-import-preview-title" className="coin-import-modal__title">
              {t('coinImport.previewTitle')}
            </h2>
          </div>
          {summaryStats ? (
            <p className="coin-import-modal__header-meta">
              {t(`coinImport.confidence.${reviewModel.confidence}`)}
              <span aria-hidden="true"> · </span>
              {t('coinImport.review.headerFieldsFound', { count: summaryStats.fieldsFound })}
            </p>
          ) : null}
        </div>

        <ReviewModalSubnav
          activeSection={activeNavSection}
          onScrollToPreview={scrollToPreviewSection}
          onScrollToApply={scrollToApplySection}
        />

        <div ref={modalBodyRef} className="coin-import-modal__body coin-import-modal__body--review">
          <div
            role="tabpanel"
            id="coin-import-panel-preview"
            aria-labelledby="coin-import-tab-preview"
            hidden={activeNavSection !== 'preview'}
            className="coin-import-modal__panel"
          >
            {summaryStats ? (
              <CoinLinkImportDataPreview
                reviewModel={reviewModel}
                result={result}
                sourceUrlCount={sourceUrlCount}
                summaryStats={summaryStats}
                sectionRef={previewSectionRef}
                onContinueToApply={scrollToApplySection}
              />
            ) : null}

            {result.warnings.length > 0 ? (
              <div className="coin-import-warning-strip" role="note">
                <p className="coin-import-warning-strip__label">{t('coinImport.warnings')}</p>
                <p className="coin-import-warning-strip__text">{result.warnings.join(' · ')}</p>
              </div>
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

          <div
            role="tabpanel"
            id="coin-import-panel-apply"
            aria-labelledby="coin-import-tab-apply"
            hidden={activeNavSection !== 'apply'}
            className="coin-import-modal__panel coin-import-modal__panel--apply"
          >
            {missingTargets.length > 0 ? (
              <section className="coin-import-missing-review coin-import-missing-review--compact">
                <div className="coin-import-missing-review__header">
                  <h3 className="coin-import-missing-review__title">
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
              <div className="coin-import-apply-section__tables">
                {reviewModel.sections.map((section) => (
                  <ReviewSectionBlock
                    key={section.id}
                    section={section}
                    currentValues={currentValues}
                    contentLanguage={contentLanguage}
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
                  showExistingMintWarning={showMintExistingWarning}
                  mintMarksFieldSelected={mintMarksFieldSelected}
                  onToggleRow={(code, checked) =>
                    setSelectedMintRows((current) => ({ ...current, [code]: checked }))
                  }
                  onReplaceExistingChange={setReplaceExistingMint}
                />
              </div>
            </section>
          </div>
        </div>

        <div className="coin-import-modal__footer-area">
          {mintBlocked ? (
            <p id="coin-import-mint-block-hint" className="coin-import-modal__footer-note">
              {t('coinImport.review.confirmReplaceMint')}
            </p>
          ) : null}
          <div className="coin-import-modal__footer coin-import-modal__footer--review">
            <p className="coin-import-modal__footer-count">
              {t('coinImport.review.selectedCount', {
                count: selectedFieldCount + selectedMintCount,
              })}
            </p>
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
        </div>
      </div>
    </div>
  )
}
