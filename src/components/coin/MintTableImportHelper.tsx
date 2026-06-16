import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  applyDetectedMintRows,
  buildMintTablePreview,
  parseMintRowsFromText,
  type MintTablePreviewRow,
} from '../../lib/coinImport'
import {
  isMintVariantRowFilled,
  type CoinFormValues,
  type MintVariantRow,
} from '../../types/coinForm'

type MintTableImportHelperProps = {
  values: Pick<CoinFormValues, 'hasMintVariants' | 'mintMarksAvailable' | 'mintVariants'>
  onFieldChange: <K extends keyof CoinFormValues>(field: K, value: CoinFormValues[K]) => void
  onMintVariantsChange: (variants: MintVariantRow[]) => void
  onHasMintVariantsChange: (hasMintVariants: boolean) => void
  disabled?: boolean
}

export function MintTableImportHelper({
  values,
  onFieldChange,
  onMintVariantsChange,
  onHasMintVariantsChange,
  disabled = false,
}: MintTableImportHelperProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [previewRows, setPreviewRows] = useState<MintTablePreviewRow[]>([])
  const [detectCount, setDetectCount] = useState<number | null>(null)
  const [appliedCount, setAppliedCount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasExistingRows = values.mintVariants.some(isMintVariantRowFilled)
  const hasReadyRows = previewRows.some((row) => row.status === 'ready')
  const canApply = previewRows.length > 0 && (hasReadyRows || replaceExisting)

  function resetFeedback() {
    setPreviewRows([])
    setDetectCount(null)
    setAppliedCount(null)
    setErrorMessage(null)
  }

  function handleDetect() {
    setErrorMessage(null)
    setAppliedCount(null)

    const rows = buildMintTablePreview(text, values)
    if (rows.length === 0) {
      setPreviewRows([])
      setDetectCount(null)
      setErrorMessage(t('mint.importTable.noRowsDetected'))
      return
    }

    setPreviewRows(rows)
    setDetectCount(rows.length)
  }

  function handleApply() {
    setErrorMessage(null)
    setAppliedCount(null)

    const detected = parseMintRowsFromText(text)
    const result = applyDetectedMintRows(detected, values, { replaceExisting })

    if (!result) {
      setErrorMessage(
        hasExistingRows && !replaceExisting
          ? t('mint.importTable.allDuplicates')
          : t('mint.importTable.noRowsDetected'),
      )
      return
    }

    if (!values.hasMintVariants) {
      onHasMintVariantsChange(true)
    }

    onMintVariantsChange(result.mintVariants)
    onFieldChange('mintMarksAvailable', result.mintMarksAvailable)
    setAppliedCount(result.addedCount)
    setReplaceExisting(false)
    setPreviewRows(buildMintTablePreview(text, { mintVariants: result.mintVariants }))
  }

  return (
    <div className="mint-table-import-helper">
      <button
        type="button"
        className="mint-table-import-helper__toggle"
        aria-expanded={expanded}
        disabled={disabled}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="mint-table-import-helper__toggle-label">{t('mint.importTable.title')}</span>
        <ChevronDown
          className={[
            'h-4 w-4 shrink-0 text-navy-muted transition-transform',
            expanded ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="mint-table-import-helper__body">
          <p className="mint-table-import-helper__desc">{t('mint.importTable.description')}</p>

          <label className="mint-table-import-helper__label" htmlFor="mint-table-import-text">
            {t('mint.importTable.textareaLabel')}
          </label>
          <textarea
            id="mint-table-import-text"
            name="mint_table_import_text"
            rows={4}
            className="field-control mint-table-import-helper__textarea"
            placeholder={t('mint.importTable.placeholder')}
            value={text}
            disabled={disabled}
            onChange={(event) => {
              setText(event.target.value)
              resetFeedback()
            }}
          />

          <p className="mint-table-import-helper__example">
            <span className="mint-table-import-helper__example-label">
              {t('mint.importTable.exampleLabel')}
            </span>
            <span className="mint-table-import-helper__example-text">
              {t('mint.importTable.exampleLine')}
            </span>
          </p>

          <div className="mint-table-import-helper__actions">
            <button
              type="button"
              className="mint-table-import-helper__detect"
              disabled={disabled || !text.trim()}
              onClick={handleDetect}
            >
              {t('mint.importTable.detectButton')}
            </button>
          </div>

          {detectCount !== null && detectCount > 0 ? (
            <p className="mint-table-import-helper__detected" role="status">
              {t('mint.importTable.rowsDetected', { count: detectCount })}
            </p>
          ) : null}

          {errorMessage && !previewRows.length ? (
            <p className="mint-table-import-helper__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {previewRows.length > 0 ? (
            <div className="mint-table-import-helper__preview">
              <p className="mint-table-import-helper__preview-title">
                {t('mint.importTable.previewTitle')}
              </p>

              <div className="mint-table-import-helper__preview-scroll">
                <table className="mint-table-import-helper__preview-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('mint.importTable.columnMint')}</th>
                      <th scope="col">{t('mint.importTable.columnCity')}</th>
                      <th scope="col">{t('mint.importTable.columnMintage')}</th>
                      <th scope="col">{t('mint.importTable.columnStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.mintMarkCode}>
                        <td>{row.mintMarkCode}</td>
                        <td>{row.city || '—'}</td>
                        <td>{row.mintage || '—'}</td>
                        <td>
                          <span
                            className={[
                              'mint-table-import-helper__status',
                              row.status === 'ready'
                                ? 'mint-table-import-helper__status--ready'
                                : 'mint-table-import-helper__status--exists',
                            ].join(' ')}
                          >
                            {row.status === 'ready'
                              ? t('mint.importTable.statusReady')
                              : t('mint.importTable.statusExists')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasExistingRows ? (
                <div className="mint-table-import-helper__warning" role="note">
                  <p className="text-xs text-amber-900">{t('mint.importTable.existingWarning')}</p>
                  <label className="mt-2 flex items-center gap-2 text-xs text-navy">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      disabled={disabled}
                      onChange={(event) => setReplaceExisting(event.target.checked)}
                    />
                    <span>{t('mint.importTable.replaceExisting')}</span>
                  </label>
                </div>
              ) : null}

              {errorMessage ? (
                <p className="mint-table-import-helper__error" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              {appliedCount !== null && appliedCount > 0 ? (
                <p className="mint-table-import-helper__success" role="status">
                  {t('mint.importTable.rowsAdded', { count: appliedCount })}
                </p>
              ) : null}

              <div className="mint-table-import-helper__actions">
                <button
                  type="button"
                  className="mint-table-import-helper__apply"
                  disabled={disabled || !canApply}
                  onClick={handleApply}
                >
                  {t('mint.importTable.applyButton')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
