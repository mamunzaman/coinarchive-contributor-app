import { Button } from '../ui/Button'
import { FieldLabelWithHelp } from '../ui/FieldHelpTooltip'
import { ChevronDown, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '../ui/SelectField'
import { TextAreaField } from '../ui/TextAreaField'
import { TextField } from '../ui/TextField'
import { normalizeIntegerInput } from '../../lib/coinFormNormalize'
import { useCoinFormFieldNormalize } from '../../hooks/useCoinFormFieldNormalize'
import { FIELD_HELP } from '../../lib/fieldHelpContent'
import {
  EMPTY_MINT_VARIANT_ROW,
  getMintMarkLabel,
  isKnownMintMarkCode,
  MINT_MARK_CODE_OPTIONS,
  normalizeMintMarkCode,
  type CoinFormValues,
  type MintVariantRow,
} from '../../types/coinForm'

type MintInformationFieldsProps = {
  values: Pick<
    CoinFormValues,
    'hasMintVariants' | 'singleMintMark' | 'mintMarksAvailable' | 'mintVariants'
  >
  onFieldChange: <K extends keyof CoinFormValues>(field: K, value: CoinFormValues[K]) => void
  onMintVariantsChange: (variants: MintVariantRow[]) => void
  onHasMintVariantsChange: (hasMintVariants: boolean) => void
  disabled?: boolean
  hideHeading?: boolean
  sectionAttentionMessages?: string[]
}

const MAX_MINT_VARIANTS = 5
const ADD_ROW_BUTTON_CLASS = '!min-h-9 !px-3.5 !py-2 text-xs'

function getMintMarkCodeSelectOptions(
  currentValue: string,
  selectLabel: string,
): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [
    { value: '', label: selectLabel },
    ...MINT_MARK_CODE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ]

  const trimmed = currentValue.trim()
  const normalized = normalizeMintMarkCode(trimmed)

  if (trimmed && !isKnownMintMarkCode(normalized) && normalized === trimmed) {
    options.push({ value: trimmed, label: trimmed })
  }

  return options
}

function formatMintageDisplay(value: string): string {
  const normalized = normalizeIntegerInput(value)
  if (!normalized) {
    return ''
  }

  const parsed = Number.parseInt(normalized, 10)
  if (Number.isNaN(parsed)) {
    return normalized
  }

  return parsed.toLocaleString()
}

function buildVariantSummary(
  row: MintVariantRow,
  labels: {
    variant: string
    noMark: string
    notes: string
    empty: string
  },
): string {
  const parts = [labels.variant]
  const markCode = normalizeMintMarkCode(row.mintMarkCode)
  const markLabel = getMintMarkLabel(markCode) || markCode.trim()

  if (markLabel) {
    parts.push(markLabel)
  } else {
    parts.push(labels.noMark)
  }

  const mintage = formatMintageDisplay(row.mintMintage)
  if (mintage) {
    parts.push(mintage)
  }

  if (row.mintNotes.trim()) {
    parts.push(labels.notes)
  }

  if (parts.length === 2 && !markLabel && !mintage && !row.mintNotes.trim()) {
    return `${labels.variant} · ${labels.empty}`
  }

  return parts.join(' · ')
}

export function MintInformationFields({
  values,
  onFieldChange,
  onMintVariantsChange,
  onHasMintVariantsChange,
  disabled = false,
  hideHeading = false,
  sectionAttentionMessages = [],
}: MintInformationFieldsProps) {
  const { t } = useTranslation()
  const hasSectionAttention = sectionAttentionMessages.length > 0
  const { changeField, blurField, formatHint } = useCoinFormFieldNormalize({ onFieldChange })
  const [openVariantIndex, setOpenVariantIndex] = useState(0)
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({})

  const variantCount = values.mintVariants.length
  const atMaxVariants = variantCount >= MAX_MINT_VARIANTS

  useEffect(() => {
    if (!values.hasMintVariants) {
      return
    }

    if (openVariantIndex >= variantCount) {
      setOpenVariantIndex(Math.max(0, variantCount - 1))
    }
  }, [openVariantIndex, variantCount, values.hasMintVariants])

  function isNotesExpanded(index: number, row: MintVariantRow): boolean {
    return expandedNotes[index] ?? Boolean(row.mintNotes.trim())
  }

  function toggleNotes(index: number, row: MintVariantRow) {
    setExpandedNotes((current) => ({
      ...current,
      [index]: !isNotesExpanded(index, row),
    }))
  }

  function updateVariantRow(index: number, field: keyof MintVariantRow, value: string) {
    onMintVariantsChange(
      values.mintVariants.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    )
  }

  function blurVariantField(index: number, field: keyof MintVariantRow, value: string) {
    const normalized =
      field === 'mintMintage'
        ? normalizeIntegerInput(value)
        : field === 'mintMarkCode'
          ? normalizeMintMarkCode(value)
          : value.trim().replace(/\s+/g, ' ')

    if (normalized !== value) {
      updateVariantRow(index, field, normalized)
    }
  }

  function addVariantRow() {
    if (atMaxVariants) {
      return
    }

    const nextIndex = variantCount
    onMintVariantsChange([...values.mintVariants, { ...EMPTY_MINT_VARIANT_ROW }])
    setOpenVariantIndex(nextIndex)
  }

  function removeVariantRow(index: number) {
    const next = values.mintVariants.filter((_, rowIndex) => rowIndex !== index)
    onMintVariantsChange(next.length > 0 ? next : [{ ...EMPTY_MINT_VARIANT_ROW }])

    setOpenVariantIndex((current) => {
      if (next.length === 0) {
        return 0
      }
      if (current === index) {
        return Math.min(index, next.length - 1)
      }
      if (current > index) {
        return current - 1
      }
      return current
    })

    setExpandedNotes((current) => {
      const rebuilt: Record<number, boolean> = {}
      for (const [key, value] of Object.entries(current)) {
        const numericKey = Number(key)
        if (numericKey < index) {
          rebuilt[numericKey] = value
        } else if (numericKey > index) {
          rebuilt[numericKey - 1] = value
        }
      }
      return rebuilt
    })
  }

  function toggleVariantAccordion(index: number) {
    setOpenVariantIndex((current) => (current === index ? -1 : index))
  }

  return (
    <section
      className={[
        'flex flex-col gap-3',
        hasSectionAttention ? 'rounded-xl border border-amber-200/80 bg-amber-50/30 p-3' : '',
      ].join(' ')}
    >
      {!hideHeading ? (
        <div className="border-b border-border/60 pb-3">
          <h2 className="font-serif text-lg font-semibold text-navy">{t('mint.title')}</h2>
          <p className="mt-0.5 text-sm text-navy-muted">{t('mint.description')}</p>
        </div>
      ) : null}

      {hasSectionAttention ? (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2">
          <p className="text-[11px] font-semibold text-amber-900">{t('form.needsAttention')}</p>
          {sectionAttentionMessages.map((message) => (
            <p key={message} className="mt-0.5 text-[11px] leading-snug text-amber-800">
              {message}
            </p>
          ))}
        </div>
      ) : null}

      <label className="flex min-h-10 items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2">
        <input
          type="checkbox"
          name="has_mint_variants"
          checked={values.hasMintVariants}
          onChange={(event) => onHasMintVariantsChange(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
        />
        <span className="text-sm font-medium text-navy">{t('mint.hasVariants')}</span>
      </label>

      {!values.hasMintVariants ? (
        <TextField
          label={t('mint.singleMintMark')}
          name="single_mint_mark"
          placeholder={t('mint.singleMintMarkPlaceholder')}
          value={values.singleMintMark}
          onChange={(event) => changeField('singleMintMark', event.target.value)}
          onBlur={() => blurField('singleMintMark', values.singleMintMark)}
          autoFormatHint={formatHint('singleMintMark')}
          disabled={disabled}
          helpTooltip={FIELD_HELP.mintMark}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <TextField
            label={t('mint.marksAvailable')}
            name="mint_marks_available"
            placeholder={t('mint.marksAvailablePlaceholder')}
            value={values.mintMarksAvailable}
            onChange={(event) => changeField('mintMarksAvailable', event.target.value)}
            onBlur={() => blurField('mintMarksAvailable', values.mintMarksAvailable)}
            autoFormatHint={formatHint('mintMarksAvailable')}
            disabled={disabled}
          />

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-navy">{t('mint.variants')}</p>
                <span className="text-xs font-medium text-navy-muted">
                  {t('mint.variantCount', { count: variantCount, max: MAX_MINT_VARIANTS })}
                </span>
              </div>
              <Button
                type="button"
                variant="primary"
                disabled={disabled || atMaxVariants}
                onClick={addVariantRow}
                className={ADD_ROW_BUTTON_CLASS}
                title={atMaxVariants ? t('mint.maxVariantsReached') : undefined}
                aria-disabled={disabled || atMaxVariants}
              >
                {t('mint.addMintRow')}
              </Button>
            </div>

            {atMaxVariants ? (
              <p className="text-[11px] text-navy-muted">{t('mint.maxVariantsReached')}</p>
            ) : null}

            {values.mintVariants.map((row, index) => {
              const isOpen = openVariantIndex === index
              const notesExpanded = isNotesExpanded(index, row)
              const summary = buildVariantSummary(row, {
                variant: t('mint.variant', { number: index + 1 }),
                noMark: t('mint.summaryNoMark'),
                notes: t('mint.summaryNotes'),
                empty: t('mint.summaryEmpty'),
              })
              const panelId = `mint-variant-panel-${index}`
              const headerId = `mint-variant-header-${index}`

              return (
                <div
                  key={`mint-variant-${index}`}
                  className="overflow-hidden rounded-lg border border-border/60 bg-muted/20"
                >
                  <div className="flex items-stretch gap-1 p-2 sm:gap-2 sm:p-2.5">
                    <button
                      id={headerId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      disabled={disabled}
                      onClick={() => toggleVariantAccordion(index)}
                      className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50"
                    >
                      <ChevronDown
                        className={[
                          'h-4 w-4 shrink-0 text-navy-muted transition-transform',
                          isOpen ? 'rotate-180' : '',
                        ].join(' ')}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium text-navy">{summary}</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeVariantRow(index)}
                      aria-label={t('mint.removeVariant')}
                      className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-white text-navy-muted transition-colors hover:border-border hover:bg-page hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  {isOpen ? (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="space-y-2.5 border-t border-border/50 px-3 pb-3 pt-2.5"
                    >
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <SelectField
                          label={t('mint.markCode')}
                          name={`mint_variants_${index}_mint_mark_code`}
                          value={normalizeMintMarkCode(row.mintMarkCode)}
                          options={getMintMarkCodeSelectOptions(
                            row.mintMarkCode,
                            t('mint.selectMintMark'),
                          )}
                          onChange={(event) =>
                            updateVariantRow(index, 'mintMarkCode', event.target.value)
                          }
                          disabled={disabled}
                          helpTooltip={FIELD_HELP.mintMark}
                        />

                        <div className="flex flex-col gap-2">
                          <FieldLabelWithHelp
                            htmlFor={`mint_variants_${index}_mint_mintage`}
                            label={t('mint.mintage')}
                            helpText={FIELD_HELP.mintage}
                          />
                          <div className="relative">
                            <input
                              id={`mint_variants_${index}_mint_mintage`}
                              name={`mint_variants_${index}_mint_mintage`}
                              type="text"
                              inputMode="numeric"
                              value={row.mintMintage}
                              onChange={(event) =>
                                updateVariantRow(index, 'mintMintage', event.target.value)
                              }
                              onBlur={() =>
                                blurVariantField(index, 'mintMintage', row.mintMintage)
                              }
                              disabled={disabled}
                              className="field-control w-full pr-9"
                            />
                            {row.mintMintage.trim() ? (
                              <button
                                type="button"
                                disabled={disabled}
                                aria-label={t('mint.clearMintage')}
                                onClick={() => updateVariantRow(index, 'mintMintage', '')}
                                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-navy-muted transition-colors hover:bg-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div>
                        {notesExpanded ? (
                          <div className="space-y-1.5">
                            <TextAreaField
                              label={t('mint.notesOptional')}
                              name={`mint_variants_${index}_mint_notes`}
                              rows={2}
                              value={row.mintNotes}
                              onChange={(event) =>
                                updateVariantRow(index, 'mintNotes', event.target.value)
                              }
                              disabled={disabled}
                            />
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleNotes(index, row)}
                              className="text-xs font-medium text-navy-muted transition-colors hover:text-navy"
                            >
                              {t('mint.hideNotes')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleNotes(index, row)}
                            className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                          >
                            {t('mint.showNotes')}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
