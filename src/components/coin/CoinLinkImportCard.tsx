import { useState } from 'react'
import { Link2, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, importCoinFromUrl } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import {
  COIN_IMPORT_UNSUPPORTED_URL_MESSAGE,
  validateCoinImportUrl,
  type CoinLinkImportResult,
} from '../../lib/coinImport'
import type { CoinFormValues, ContentLanguage } from '../../types/coinForm'
import type { FormOptions } from '../../types/formOptions'
import { CoinLinkImportPreviewModal } from './CoinLinkImportPreviewModal'

export type CoinLinkImportStatus =
  | 'idle'
  | 'validating-url'
  | 'importing'
  | 'imported'
  | 'partial-import'
  | 'unsupported-url'
  | 'import-failed'
  | 'backend-unavailable'

type CoinLinkImportCardProps = {
  values: CoinFormValues
  formOptions: FormOptions
  contentLanguage: ContentLanguage
  disabled?: boolean
  onApplyValues: (nextValues: CoinFormValues) => void
  onImportApplied?: () => void
}

function getStatusMessageKey(status: CoinLinkImportStatus): string | null {
  switch (status) {
    case 'validating-url':
      return 'coinImport.status.validating'
    case 'importing':
      return 'coinImport.status.importing'
    case 'imported':
      return 'coinImport.status.imported'
    case 'partial-import':
      return 'coinImport.status.partial'
    case 'unsupported-url':
      return 'coinImport.status.unsupported'
    case 'import-failed':
      return 'coinImport.status.failed'
    case 'backend-unavailable':
      return 'coinImport.status.unavailable'
    default:
      return null
  }
}

export function CoinLinkImportCard({
  values,
  formOptions,
  contentLanguage,
  disabled = false,
  onApplyValues,
  onImportApplied,
}: CoinLinkImportCardProps) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<CoinLinkImportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<CoinLinkImportResult | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const isBusy = status === 'validating-url' || status === 'importing'
  const statusMessageKey = getStatusMessageKey(status)

  async function handleImport() {
    setErrorMessage(null)
    setStatus('validating-url')

    const validation = validateCoinImportUrl(url)
    if (!validation.valid) {
      setStatus('unsupported-url')
      setErrorMessage(t('coinImport.errors.unsupportedUrl', { defaultValue: COIN_IMPORT_UNSUPPORTED_URL_MESSAGE }))
      return
    }

    if (!token) {
      setStatus('import-failed')
      setErrorMessage(t('coinImport.errors.loginRequired'))
      return
    }

    setStatus('importing')

    try {
      const result = await importCoinFromUrl(validation.normalizedUrl ?? url.trim(), token)
      setImportResult(result)
      setPreviewOpen(true)
      setStatus(
        result.confidence === 'low' || result.missing.length > 0 ? 'partial-import' : 'imported',
      )
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 501 || error.status === 404 || error.code === 'rest_coin_import_unavailable') {
          setStatus('backend-unavailable')
          setErrorMessage(t('coinImport.errors.unavailable'))
          return
        }

        setStatus('import-failed')
        setErrorMessage(error.message || t('coinImport.errors.failed'))
        return
      }

      setStatus('import-failed')
      setErrorMessage(t('coinImport.errors.failed'))
    }
  }

  function handleApply(nextValues: CoinFormValues) {
    onApplyValues(nextValues)
    onImportApplied?.()
    setPreviewOpen(false)
    setImportResult(null)
    setStatus('imported')
  }

  function handleCancelPreview() {
    setPreviewOpen(false)
    setImportResult(null)
    setStatus('idle')
  }

  return (
    <>
      <section className="coin-import-card" aria-labelledby="coin-import-card-title">
        <div className="coin-import-card__header">
          <div>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" aria-hidden />
              <h3 id="coin-import-card-title" className="font-serif text-base font-semibold text-navy">
                {t('coinImport.title')}
              </h3>
            </div>
            <p className="mt-1 text-sm text-navy-muted">{t('coinImport.subtitle')}</p>
          </div>
        </div>

        <div className="coin-import-card__body">
          <label htmlFor="coin-link-import-url" className="field-label">
            {t('coinImport.urlLabel')}
          </label>
          <div className="coin-import-card__row">
            <input
              id="coin-link-import-url"
              name="coin_link_import_url"
              type="url"
              inputMode="url"
              autoComplete="off"
              className="field-control"
              placeholder={t('coinImport.urlPlaceholder')}
              value={url}
              disabled={disabled || isBusy}
              onChange={(event) => {
                setUrl(event.target.value)
                if (status !== 'idle' && status !== 'imported' && status !== 'partial-import') {
                  setStatus('idle')
                  setErrorMessage(null)
                }
              }}
            />
            <button
              type="button"
              className="coin-import-btn coin-import-btn--primary coin-import-card__import-btn"
              disabled={disabled || isBusy || !url.trim()}
              onClick={() => void handleImport()}
            >
              {isBusy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  {t('coinImport.importing')}
                </>
              ) : (
                t('coinImport.import')
              )}
            </button>
          </div>

          <p className="coin-import-card__note">{t('coinImport.supportedSources')}</p>

          <div
            role="status"
            aria-live="polite"
            className="coin-import-card__status"
          >
            {statusMessageKey ? t(statusMessageKey) : null}
          </div>

          {errorMessage ? (
            <div role="alert" className="coin-import-error">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </section>

      <CoinLinkImportPreviewModal
        open={previewOpen}
        result={importResult}
        currentValues={values}
        formOptions={formOptions}
        contentLanguage={contentLanguage}
        onCancel={handleCancelPreview}
        onApply={handleApply}
      />
    </>
  )
}
