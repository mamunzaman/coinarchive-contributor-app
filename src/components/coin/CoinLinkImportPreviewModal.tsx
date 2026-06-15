import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ExternalLink, Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CoinFormValues } from '../../types/coinForm'
import {
  applyImportToFormValues,
  detectImportConflicts,
  getExtractedFieldEntries,
  mapImportResultToFormValues,
  mergeMissingImportFields,
  type CoinImportApplyMode,
  type CoinImportConflictResolution,
  type CoinImportFieldConflict,
  type CoinImportFormFieldKey,
  type CoinLinkImportResult,
} from '../../lib/coinImport'
import type { FormOptions } from '../../types/formOptions'
import type { ContentLanguage } from '../../types/coinForm'

type CoinLinkImportPreviewModalProps = {
  open: boolean
  result: CoinLinkImportResult | null
  currentValues: CoinFormValues
  formOptions: FormOptions
  contentLanguage: ContentLanguage
  onCancel: () => void
  onApply: (nextValues: CoinFormValues) => void
}

function confidenceBadgeClass(confidence: CoinLinkImportResult['confidence']): string {
  switch (confidence) {
    case 'high':
      return 'coin-import-badge coin-import-badge--high'
    case 'medium':
      return 'coin-import-badge coin-import-badge--medium'
    default:
      return 'coin-import-badge coin-import-badge--low'
  }
}

export function CoinLinkImportPreviewModal({
  open,
  result,
  currentValues,
  formOptions,
  contentLanguage,
  onCancel,
  onApply,
}: CoinLinkImportPreviewModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [conflictResolutions, setConflictResolutions] = useState<
    Partial<Record<CoinImportFormFieldKey, CoinImportConflictResolution>>
  >({})

  const mappedValues = useMemo(
    () => (result ? mapImportResultToFormValues(result, formOptions, contentLanguage) : {}),
    [result, formOptions, contentLanguage],
  )

  const conflicts = useMemo(
    () => detectImportConflicts(currentValues, mappedValues),
    [currentValues, mappedValues],
  )

  const missingFields = useMemo(
    () => (result ? mergeMissingImportFields(result) : []),
    [result],
  )

  const extractedEntries = useMemo(
    () => (result ? getExtractedFieldEntries(result) : []),
    [result],
  )

  useEffect(() => {
    if (!open) {
      setConflictResolutions({})
    }
  }, [open])

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

  if (!open || !result) {
    return null
  }

  function setResolution(field: CoinImportFormFieldKey, resolution: CoinImportConflictResolution) {
    setConflictResolutions((current) => ({ ...current, [field]: resolution }))
  }

  function handleApply(mode: CoinImportApplyMode) {
    if (mode === 'replace-all' && conflicts.length > 0) {
      const unresolved = conflicts.some((conflict) => !conflictResolutions[conflict.field])
      if (unresolved) {
        return
      }
    }

    const nextValues = applyImportToFormValues(currentValues, mappedValues, mode, conflictResolutions)
    onApply(nextValues)
  }

  const replaceBlocked =
    conflicts.length > 0 &&
    conflicts.some((conflict) => !conflictResolutions[conflict.field])

  return (
    <div
      className="coin-import-modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coin-import-preview-title"
        tabIndex={-1}
        className="coin-import-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="coin-import-modal__header">
          <div>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" aria-hidden />
              <h2 id="coin-import-preview-title" className="font-serif text-xl font-semibold text-navy">
                {t('coinImport.previewTitle')}
              </h2>
            </div>
            <p className="mt-1 text-sm text-navy-muted">{t('coinImport.previewSubtitle')}</p>
          </div>
          <span className={confidenceBadgeClass(result.confidence)}>
            {t(`coinImport.confidence.${result.confidence}`)}
          </span>
        </div>

        <div className="coin-import-modal__body">
          <section className="coin-import-panel">
            <p className="coin-import-panel__label">{t('coinImport.source')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="coin-import-source-badge">{result.sourceName}</span>
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t('coinImport.viewSource')}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </section>

          {extractedEntries.length > 0 ? (
            <section className="coin-import-panel">
              <p className="coin-import-panel__label">{t('coinImport.extractedFields')}</p>
              <dl className="coin-import-field-list">
                {extractedEntries.map((entry) => (
                  <div key={entry.key} className="coin-import-field-list__row">
                    <dt>{t(entry.labelKey)}</dt>
                    <dd>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {missingFields.length > 0 ? (
            <section className="coin-import-warning-card" role="note">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('coinImport.missingFields')}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm">{t('coinImport.missingFieldsHint')}</p>
                </div>
              </div>
            </section>
          ) : null}

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
            <section className="coin-import-panel">
              <p className="coin-import-panel__label">{t('coinImport.imagePreview')}</p>
              <p className="mb-3 text-xs text-navy-muted">{t('coinImport.imagePreviewHint')}</p>
              <div className="coin-import-image-grid">
                {result.extracted.images.map((url) => (
                  <figure key={url} className="coin-import-image-grid__item">
                    <img src={url} alt={t('coinImport.imagePreviewAlt')} loading="lazy" />
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {conflicts.length > 0 ? (
            <section className="coin-import-panel">
              <p className="coin-import-panel__label">{t('coinImport.conflicts')}</p>
              <p className="mb-3 text-sm text-navy-muted">{t('coinImport.conflictsHint')}</p>
              <div className="space-y-3">
                {conflicts.map((conflict) => (
                  <ConflictRow
                    key={conflict.field}
                    conflict={conflict}
                    resolution={conflictResolutions[conflict.field]}
                    onChange={(resolution) => setResolution(conflict.field, resolution)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="coin-import-modal__footer">
          <button type="button" className="coin-import-btn coin-import-btn--secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="coin-import-btn coin-import-btn--primary"
            onClick={() => handleApply('empty-only')}
          >
            {t('coinImport.applyEmpty')}
          </button>
          <button
            type="button"
            className="coin-import-btn coin-import-btn--danger-soft"
            disabled={replaceBlocked}
            onClick={() => handleApply('replace-all')}
            aria-describedby={replaceBlocked ? 'coin-import-replace-hint' : undefined}
          >
            {t('coinImport.replaceAll')}
          </button>
        </div>
        {replaceBlocked ? (
          <p id="coin-import-replace-hint" className="coin-import-modal__hint">
            {t('coinImport.resolveConflictsFirst')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

type ConflictRowProps = {
  conflict: CoinImportFieldConflict
  resolution?: CoinImportConflictResolution
  onChange: (resolution: CoinImportConflictResolution) => void
}

function ConflictRow({ conflict, resolution, onChange }: ConflictRowProps) {
  const { t } = useTranslation()

  return (
    <div className="coin-import-conflict">
      <p className="coin-import-conflict__title">{t(`coinImport.fields.${conflict.field}`)}</p>
      <div className="coin-import-conflict__values">
        <div>
          <p className="coin-import-conflict__label">{t('coinImport.currentValue')}</p>
          <p>{conflict.currentValue}</p>
        </div>
        <div>
          <p className="coin-import-conflict__label">{t('coinImport.importedValue')}</p>
          <p>{conflict.importedValue}</p>
        </div>
      </div>
      <div className="coin-import-conflict__actions" role="radiogroup" aria-label={t(`coinImport.fields.${conflict.field}`)}>
        <label className="coin-import-choice">
          <input
            type="radio"
            name={`conflict-${conflict.field}`}
            checked={resolution === 'keep'}
            onChange={() => onChange('keep')}
          />
          <span>{t('coinImport.keepCurrent')}</span>
        </label>
        <label className="coin-import-choice">
          <input
            type="radio"
            name={`conflict-${conflict.field}`}
            checked={resolution === 'replace'}
            onChange={() => onChange('replace')}
          />
          <span>{t('coinImport.useImported')}</span>
        </label>
      </div>
    </div>
  )
}
