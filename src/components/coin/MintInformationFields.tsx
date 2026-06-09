import { Button } from '../ui/Button'
import { useState } from 'react'
import { SelectField } from '../ui/SelectField'
import { TextAreaField } from '../ui/TextAreaField'
import { TextField } from '../ui/TextField'
import {
  AUTO_FORMAT_HINT,
  normalizeIntegerInput,
} from '../../lib/coinFormNormalize'
import { useCoinFormFieldNormalize } from '../../hooks/useCoinFormFieldNormalize'
import { FIELD_HELP } from '../../lib/fieldHelpContent'
import {
  EMPTY_MINT_VARIANT_ROW,
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

function getMintMarkCodeSelectOptions(currentValue: string): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [
    { value: '', label: 'Select mint mark' },
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

export function MintInformationFields({
  values,
  onFieldChange,
  onMintVariantsChange,
  onHasMintVariantsChange,
  disabled = false,
  hideHeading = false,
  sectionAttentionMessages = [],
}: MintInformationFieldsProps) {
  const hasSectionAttention = sectionAttentionMessages.length > 0
  const { changeField, blurField, formatHint } = useCoinFormFieldNormalize({ onFieldChange })
  const [variantFormatHints, setVariantFormatHints] = useState<Record<number, boolean>>({})

  function updateVariantRow(index: number, field: keyof MintVariantRow, value: string) {
    setVariantFormatHints((prev) => {
      if (!prev[index]) {
        return prev
      }
      const next = { ...prev }
      delete next[index]
      return next
    })
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
      onMintVariantsChange(
        values.mintVariants.map((row, rowIndex) =>
          rowIndex === index ? { ...row, [field]: normalized } : row,
        ),
      )
      setVariantFormatHints((prev) => ({ ...prev, [index]: true }))
    }
  }

  function addVariantRow() {
    onMintVariantsChange([...values.mintVariants, { ...EMPTY_MINT_VARIANT_ROW }])
  }

  function removeVariantRow(index: number) {
    const next = values.mintVariants.filter((_, rowIndex) => rowIndex !== index)
    onMintVariantsChange(next.length > 0 ? next : [{ ...EMPTY_MINT_VARIANT_ROW }])
  }

  return (
    <section
      className={[
        'flex flex-col gap-5',
        hasSectionAttention ? 'rounded-xl border border-amber-200/80 bg-amber-50/30 p-4' : '',
      ].join(' ')}
    >
      {!hideHeading ? (
        <div className="border-b border-border/60 pb-4">
          <h2 className="font-serif text-lg font-semibold text-navy">Mint information</h2>
          <p className="mt-1 text-sm text-navy-muted">
            Optional mint mark details for single-mark coins or multi-mint variants.
          </p>
        </div>
      ) : null}

      {hasSectionAttention ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-900">Needs attention</p>
          {sectionAttentionMessages.map((message) => (
            <p key={message} className="mt-0.5 text-xs text-amber-800">
              {message}
            </p>
          ))}
        </div>
      ) : null}

      <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <input
          type="checkbox"
          name="has_mint_variants"
          checked={values.hasMintVariants}
          onChange={(event) => onHasMintVariantsChange(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
        />
        <span className="text-sm font-medium text-navy">Has mint variants?</span>
      </label>

      {!values.hasMintVariants ? (
        <TextField
          label="Single mint mark"
          name="single_mint_mark"
          placeholder="e.g. D"
          value={values.singleMintMark}
          onChange={(event) => changeField('singleMintMark', event.target.value)}
          onBlur={() => blurField('singleMintMark', values.singleMintMark)}
          autoFormatHint={formatHint('singleMintMark')}
          disabled={disabled}
          helpTooltip={FIELD_HELP.mintMark}
        />
      ) : (
        <>
          <TextField
            label="Mint marks available"
            name="mint_marks_available"
            placeholder="e.g. A, D, F, G, J"
            value={values.mintMarksAvailable}
            onChange={(event) => changeField('mintMarksAvailable', event.target.value)}
            onBlur={() => blurField('mintMarksAvailable', values.mintMarksAvailable)}
            autoFormatHint={formatHint('mintMarksAvailable')}
            disabled={disabled}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-navy">Mint variants</p>
              <Button type="button" variant="secondary" disabled={disabled} onClick={addVariantRow}>
                Add row
              </Button>
            </div>

            {values.mintVariants.map((row, index) => (
              <div
                key={`mint-variant-${index}`}
                className="rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
                    Variant {index + 1}
                  </p>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeVariantRow(index)}
                    className="text-xs font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                  >
                    Remove row
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Mint mark code"
                    name={`mint_variants_${index}_mint_mark_code`}
                    value={normalizeMintMarkCode(row.mintMarkCode)}
                    options={getMintMarkCodeSelectOptions(row.mintMarkCode)}
                    onChange={(event) =>
                      updateVariantRow(index, 'mintMarkCode', event.target.value)
                    }
                    disabled={disabled}
                    helpTooltip={FIELD_HELP.mintMark}
                  />
                  <TextField
                    label="Mint mintage"
                    name={`mint_variants_${index}_mint_mintage`}
                    value={row.mintMintage}
                    onChange={(event) => updateVariantRow(index, 'mintMintage', event.target.value)}
                    onBlur={() => blurVariantField(index, 'mintMintage', row.mintMintage)}
                    autoFormatHint={variantFormatHints[index] ? AUTO_FORMAT_HINT : undefined}
                    disabled={disabled}
                    helpTooltip={FIELD_HELP.mintage}
                  />
                </div>
                <div className="mt-4">
                  <TextAreaField
                    label="Mint notes"
                    name={`mint_variants_${index}_mint_notes`}
                    rows={3}
                    value={row.mintNotes}
                    onChange={(event) => updateVariantRow(index, 'mintNotes', event.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
