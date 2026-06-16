import { useMemo, useState } from 'react'
import { Link2, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, importCoinFromUrls } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import {
  buildCoinLinkImportSourceUrls,
  COIN_IMPORT_UNSUPPORTED_URL_MESSAGE,
  EMPTY_COIN_LINK_IMPORT_URL_FIELDS,
  resolveMissingImportTargets,
  validateCoinImportUrlFields,
  type CoinLinkImportResult,
  type CoinLinkImportUrlFieldErrorKey,
  type CoinLinkImportUrlFields,
  type CoinLinkImportUrlSlot,
} from '../../lib/coinImport'
import type { CoinFormStepId } from '../../types/coinFormSteps'
import type { CoinFormValues, ContentLanguage } from '../../types/coinForm'
import type { FormOptions } from '../../types/formOptions'
import { CoinImportRemainingHelper } from './CoinImportRemainingHelper'
import { CoinLinkImportPreviewModal } from './CoinLinkImportPreviewModal'
import { useCoinLinkImportSession } from '../../hooks/useCoinLinkImportSession'

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
  onNavigateToStep?: (stepId: CoinFormStepId) => void
}

const URL_FIELD_CONFIG: Array<{
  slot: CoinLinkImportUrlSlot
  labelKey: string
  placeholderKey: string
  optional?: boolean
}> = [
    {
      slot: 'primary',
      labelKey: 'coinImport.urls.primaryLabel',
      placeholderKey: 'coinImport.urls.primaryPlaceholder',
    },
    {
      slot: 'extra',
      labelKey: 'coinImport.urls.extraLabel',
      placeholderKey: 'coinImport.urls.extraPlaceholder',
      optional: true,
    },
  ]

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

function resolveImportStatus(result: CoinLinkImportResult): CoinLinkImportStatus {
  return result.catalogueTextRequired ||
    result.confidence === 'low' ||
    result.missing.length > 0
    ? 'partial-import'
    : 'imported'
}

export function CoinLinkImportCard({
  values,
  formOptions,
  contentLanguage,
  disabled = false,
  onApplyValues,
  onImportApplied,
  onNavigateToStep,
}: CoinLinkImportCardProps) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const importSession = useCoinLinkImportSession()
  const [urlFields, setUrlFields] = useState<CoinLinkImportUrlFields>(EMPTY_COIN_LINK_IMPORT_URL_FIELDS)
  const [status, setStatus] = useState<CoinLinkImportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CoinLinkImportUrlSlot, CoinLinkImportUrlFieldErrorKey>>
  >({})
  const [previewOpen, setPreviewOpen] = useState(false)

  const latestImportResult = importSession?.latestImportResult ?? null
  const latestSourceUrls = importSession?.latestSourceUrls ?? []
  const hasStoredImport = Boolean(latestImportResult)

  const isBusy = status === 'validating-url' || status === 'importing'
  const statusMessageKey = getStatusMessageKey(status)
  const hasPrimaryUrl = urlFields.primary.trim().length > 0
  const canImport = hasPrimaryUrl

  const previewMissingTargets = useMemo(
    () => (latestImportResult ? resolveMissingImportTargets(latestImportResult, values) : []),
    [latestImportResult, values],
  )

  const activeSourceUrls = useMemo(() => {
    if (latestSourceUrls.length > 0) {
      return latestSourceUrls
    }
    return buildCoinLinkImportSourceUrls(urlFields)
  }, [latestSourceUrls, urlFields])

  function fieldErrorMessage(errorKey?: CoinLinkImportUrlFieldErrorKey): string | null {
    if (!errorKey) {
      return null
    }

    if (errorKey === 'unsupportedHost') {
      return t('coinImport.errors.unsupportedUrl', {
        defaultValue: COIN_IMPORT_UNSUPPORTED_URL_MESSAGE,
      })
    }

    return t(`coinImport.errors.urlField.${errorKey}`)
  }

  function updateUrlField(slot: CoinLinkImportUrlSlot, value: string) {
    setUrlFields((current) => ({ ...current, [slot]: value }))
    setFieldErrors((current) => {
      if (!current[slot]) {
        return current
      }
      const next = { ...current }
      delete next[slot]
      return next
    })
    if (status !== 'idle' && status !== 'imported' && status !== 'partial-import') {
      setStatus('idle')
      setErrorMessage(null)
    }
  }

  function openImportPreview(result: CoinLinkImportResult) {
    setPreviewOpen(true)
    setStatus(resolveImportStatus(result))
  }

  function handleViewImportedData() {
    if (!latestImportResult) {
      return
    }
    openImportPreview(latestImportResult)
  }

  function handleClearImportedData() {
    importSession?.clearLatestImport()
    setPreviewOpen(false)
    setStatus('idle')
    setErrorMessage(null)
  }

  async function handleImport() {
    setErrorMessage(null)
    setFieldErrors({})
    importSession?.clearAppliedResult()
    setStatus('validating-url')

    const validation = validateCoinImportUrlFields(urlFields)
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors)
      if (validation.generalError === 'duplicate_urls') {
        setErrorMessage(t('coinImport.errors.duplicateUrls'))
      } else if (validation.generalError === 'no_urls') {
        setErrorMessage(t('coinImport.errors.primaryRequired'))
      } else if (Object.keys(validation.fieldErrors).length > 0) {
        setErrorMessage(t('coinImport.errors.fixUrlFields'))
      } else {
        setErrorMessage(t('coinImport.errors.unsupportedUrl', { defaultValue: COIN_IMPORT_UNSUPPORTED_URL_MESSAGE }))
      }
      setStatus('idle')
      return
    }

    if (!token) {
      setStatus('import-failed')
      setErrorMessage(t('coinImport.errors.loginRequired'))
      return
    }

    setStatus('importing')

    try {
      const result = await importCoinFromUrls(validation.source_urls, token)
      importSession?.registerLatestImport(result, validation.source_urls)
      openImportPreview(result)
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
    if (latestImportResult) {
      importSession?.registerAppliedResult(latestImportResult)
    }
    setPreviewOpen(false)
    const remaining = latestImportResult
      ? resolveMissingImportTargets(latestImportResult, nextValues)
      : []
    setStatus(remaining.length > 0 ? 'partial-import' : 'imported')
  }

  function handleCancelPreview() {
    setPreviewOpen(false)
    if (latestImportResult) {
      const remaining = resolveMissingImportTargets(latestImportResult, values)
      setStatus(remaining.length > 0 ? 'partial-import' : 'imported')
      return
    }
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
          <div className="coin-import-card__url-fields">
            {URL_FIELD_CONFIG.map(({ slot, labelKey, placeholderKey, optional }) => {
              const inputId = `coin-link-import-url-${slot}`
              const errorKey = fieldErrors[slot]
              const errorText = fieldErrorMessage(errorKey)

              return (
                <div key={slot} className="coin-import-card__url-field">
                  <label htmlFor={inputId} className="field-label">
                    {t(labelKey)}
                    {optional ? (
                      <span className="ml-1 font-normal text-navy-muted">
                        ({t('coinImport.urls.optional')})
                      </span>
                    ) : null}
                  </label>
                  <input
                    id={inputId}
                    name={`coin_link_import_url_${slot}`}
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    className="field-control"
                    placeholder={t(placeholderKey)}
                    value={urlFields[slot]}
                    disabled={disabled || isBusy}
                    aria-invalid={errorKey ? true : undefined}
                    aria-describedby={errorText ? `${inputId}-error` : undefined}
                    onChange={(event) => updateUrlField(slot, event.target.value)}
                  />
                  {errorText ? (
                    <p id={`${inputId}-error`} className="coin-import-card__field-error" role="alert">
                      {errorText}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="coin-import-card__actions">
            <button
              type="button"
              className="coin-import-btn coin-import-btn--primary coin-import-card__import-btn"
              disabled={disabled || isBusy || !canImport}
              onClick={() => void handleImport()}
            >
              {isBusy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  {t('coinImport.importing')}
                </>
              ) : (
                t('coinImport.importOfficial')
              )}
            </button>
            {hasStoredImport ? (
              <button
                type="button"
                className="coin-import-btn coin-import-btn--secondary coin-import-card__import-btn"
                disabled={disabled || isBusy}
                onClick={handleViewImportedData}
                aria-label={t('coinImport.viewImportedDataAria')}
              >
                {t('coinImport.viewImportedData')}
              </button>
            ) : null}
          </div>

          {hasStoredImport ? (
            <div className="coin-import-card__stored-import">
              <p className="coin-import-card__stored-import-hint">
                {t('coinImport.viewImportedDataHint')}
              </p>
              <button
                type="button"
                className="coin-import-card__clear-import"
                disabled={disabled || isBusy}
                onClick={handleClearImportedData}
                aria-label={t('coinImport.clearImportedDataAria')}
              >
                {t('coinImport.clearImportedData')}
              </button>
            </div>
          ) : null}

          <p className="coin-import-card__note">{t('coinImport.multiSourceHelper')}</p>

          <div role="status" aria-live="polite" className="coin-import-card__status">
            {statusMessageKey ? t(statusMessageKey) : null}
          </div>

          {errorMessage ? (
            <div role="alert" className="coin-import-error">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <CoinImportRemainingHelper activeStepId="core-identity" placement="embedded" />
      </section>

      <CoinLinkImportPreviewModal
        open={previewOpen}
        result={latestImportResult}
        currentValues={values}
        formOptions={formOptions}
        contentLanguage={contentLanguage}
        missingTargets={previewMissingTargets}
        sourceUrlCount={activeSourceUrls.length}
        onCancel={handleCancelPreview}
        onApply={handleApply}
        onNavigateToMissing={
          onNavigateToStep && importSession
            ? (key) => importSession.navigateToMissing(key)
            : undefined
        }
      />
    </>
  )
}
