import type { ChangeEvent } from 'react'
import { SelectField } from '../ui/SelectField'
import { TextField } from '../ui/TextField'
import {
  getTaxonomySelectValue,
  isKnownTaxonomyOption,
  TAXONOMY_OPTIONS_FAILED_MESSAGE,
  TAXONOMY_OTHER_VALUE,
  TAXONOMY_STALE_VALUE_MESSAGE,
  type TaxonomyOption,
} from '../../types/formOptions'

type TaxonomySelectWithOtherProps = {
  label: string
  name: string
  value: string
  options: TaxonomyOption[]
  onChange: (value: string) => void
  error?: string
  attention?: string
  otherLabel?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  optionsLoading?: boolean
  optionsFailed?: boolean
  hint?: string
  allowCustom?: boolean
}

export function TaxonomySelectWithOther({
  label,
  name,
  value,
  options,
  onChange,
  error,
  attention,
  otherLabel,
  disabled = false,
  required = false,
  placeholder,
  optionsLoading = false,
  optionsFailed = false,
  hint,
  allowCustom = false,
}: TaxonomySelectWithOtherProps) {
  const optionsUnavailable =
    optionsFailed || (!optionsLoading && options.length === 0)

  if (!allowCustom && optionsUnavailable) {
    return (
      <div className="flex flex-col gap-2">
        <SelectField
          label={label}
          name={name}
          value=""
          onChange={() => undefined}
          options={[
            {
              value: '',
              label: placeholder ?? `Select ${label.toLowerCase()}`,
            },
          ]}
          error={error}
          attention={attention}
          disabled
          required={required}
          hint={hint}
        />
        <p role="alert" className="text-xs leading-relaxed text-amber-900">
          {TAXONOMY_OPTIONS_FAILED_MESSAGE}
        </p>
      </div>
    )
  }

  if (allowCustom && optionsUnavailable) {
    return (
      <TextField
        label={label}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        attention={attention}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        hint={optionsFailed ? 'Options unavailable — enter manually.' : hint}
      />
    )
  }

  const selectValue = optionsLoading
    ? ''
    : allowCustom
      ? getTaxonomySelectValue(value, options)
      : isKnownTaxonomyOption(value, options)
        ? value.trim()
        : ''

  const showOtherInput = allowCustom && selectValue === TAXONOMY_OTHER_VALUE
  const showStaleValueWarning =
    !allowCustom &&
    !optionsLoading &&
    !optionsFailed &&
    Boolean(value.trim()) &&
    !isKnownTaxonomyOption(value, options)

  const selectOptions = optionsLoading
    ? [{ value: '', label: 'Loading options…' }]
    : [
        { value: '', label: placeholder ?? `Select ${label.toLowerCase()}` },
        ...options.map((option) => ({ value: option.name, label: option.name })),
        ...(allowCustom ? [{ value: TAXONOMY_OTHER_VALUE, label: 'Other' }] : []),
      ]

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value

    if (next === '') {
      onChange('')
      return
    }

    if (allowCustom && next === TAXONOMY_OTHER_VALUE) {
      onChange(isKnownSelection(value, options) ? '' : value)
      return
    }

    onChange(next)
  }

  function handleOtherChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <div className="flex flex-col gap-3">
      <SelectField
        label={label}
        name={name}
        value={selectValue}
        onChange={handleSelectChange}
        options={selectOptions}
        error={showOtherInput ? undefined : error}
        attention={showOtherInput ? undefined : attention}
        disabled={disabled || optionsLoading}
        required={required && !showOtherInput}
        hint={hint}
      />
      {showStaleValueWarning ? (
        <p role="status" className="text-xs leading-relaxed text-amber-900">
          {TAXONOMY_STALE_VALUE_MESSAGE}
          {value.trim() ? (
            <>
              {' '}
              <span className="font-medium">Saved value: {value.trim()}</span>
            </>
          ) : null}
        </p>
      ) : null}
      {showOtherInput && otherLabel ? (
        <TextField
          label={otherLabel}
          name={`${name}_other`}
          value={value}
          onChange={handleOtherChange}
          error={error}
          attention={attention}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
        />
      ) : null}
    </div>
  )
}

function isKnownSelection(value: string, options: TaxonomyOption[]): boolean {
  return isKnownTaxonomyOption(value, options)
}
