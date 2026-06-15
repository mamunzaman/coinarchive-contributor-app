import { useEffect, useRef } from 'react'
import {
  ArrowRight,
  Award,
  BookOpen,
  CircleDot,
  FileText,
  Hash,
  Image,
  Layers,
  Ruler,
  Stamp,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CoinImportMissingFieldKey, CoinImportMissingFieldTarget } from '../../lib/coinImport'

type CoinLinkImportMissingFieldsPanelProps = {
  open: boolean
  targets: CoinImportMissingFieldTarget[]
  navigationMessage?: string | null
  onClose: () => void
  onNavigate: (key: CoinImportMissingFieldKey) => void
}

function missingFieldIcon(key: CoinImportMissingFieldKey) {
  switch (key) {
    case 'mint_variants':
      return Layers
    case 'mint_mark':
      return Stamp
    case 'mint_mintage_by_mint':
      return Hash
    case 'edge_inscription':
      return CircleDot
    case 'technical_specifications':
      return Ruler
    case 'coin_quality':
      return Award
    case 'reverse_image':
      return Image
    case 'short_description':
      return FileText
    case 'historical_background':
      return BookOpen
    case 'reverse_description':
      return FileText
    default:
      return ArrowRight
  }
}

export function CoinLinkImportMissingFieldsPanel({
  open,
  targets,
  navigationMessage,
  onClose,
  onNavigate,
}: CoinLinkImportMissingFieldsPanelProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="coin-import-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coin-import-missing-title"
        tabIndex={-1}
        className="coin-import-modal coin-import-modal--missing"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="coin-import-modal__header">
          <div>
            <h2 id="coin-import-missing-title" className="font-serif text-xl font-semibold text-navy">
              {t('coinImport.missingReview.title')}
            </h2>
            <p className="mt-1 text-sm text-navy-muted">{t('coinImport.missingReview.subtitle')}</p>
          </div>
          <button
            type="button"
            className="coin-import-icon-btn"
            onClick={onClose}
            aria-label={t('coinImport.missingReview.closePanel')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="coin-import-modal__body">
          <CoinImportMissingFieldList targets={targets} onNavigate={onNavigate} />
        </div>

        <div
          role="status"
          aria-live="polite"
          className="coin-import-nav-announce sr-only"
        >
          {navigationMessage}
        </div>

        <div className="coin-import-modal__footer">
          <button type="button" className="coin-import-btn coin-import-btn--secondary" onClick={onClose}>
            {t('coinImport.missingReview.closePanel')}
          </button>
        </div>
      </div>
    </div>
  )
}

type CoinImportMissingFieldListProps = {
  targets: CoinImportMissingFieldTarget[]
  onNavigate: (key: CoinImportMissingFieldKey) => void
  compact?: boolean
}

export function CoinImportMissingFieldList({
  targets,
  onNavigate,
  compact = false,
}: CoinImportMissingFieldListProps) {
  const { t } = useTranslation()

  if (targets.length === 0) {
    return (
      <div className="coin-import-success-note" role="status">
        {t('coinImport.missingReview.allComplete')}
      </div>
    )
  }

  return (
    <ul className={compact ? 'coin-import-missing-list coin-import-missing-list--compact' : 'coin-import-missing-list'}>
      {targets.map((target) => {
        const Icon = missingFieldIcon(target.key)
        return (
          <li key={target.key}>
            <div className="coin-import-missing-item">
              <div className="coin-import-missing-item__icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </div>
              <div className="coin-import-missing-item__body">
                <p className="coin-import-missing-item__label">{t(target.labelKey)}</p>
                <p className="coin-import-missing-item__helper">{t(target.helperKey)}</p>
              </div>
              <button
                type="button"
                className="coin-import-missing-item__action"
                onClick={() => onNavigate(target.key)}
              >
                {t('coinImport.missingReview.goToField')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
