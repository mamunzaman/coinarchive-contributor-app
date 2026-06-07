import type { ChangeEvent } from 'react'
import { SelectField } from '../ui/SelectField'
import { TextField } from '../ui/TextField'
import {
  getTaxonomySelectValue,
  TAXONOMY_OTHER_VALUE,
  type TaxonomyOption,
} from '../../types/formOptions'

type TaxonomySelectWithOtherProps = {
  label: string
  name: string
  value: string
  options: TaxonomyOption[]
  onChange: (value: string) => void
  error?: string
  otherLabel: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  optionsLoading?: boolean
  optionsFailed?: boolean
  hint?: string
}

export function TaxonomySelectWithOther({
  label,
  name,
  value,
  options,
  onChange,
  error,
  otherLabel,
  disabled = false,
  required = false,
  placeholder,
  optionsLoading = false,
  optionsFailed = false,
  hint,
}: TaxonomySelectWithOtherProps) {
  const useTextFallback =
    optionsFailed || (!optionsLoading && options.length === 0)

  if (useTextFallback) {
    return (
      <TextField
        label={label}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        hint={optionsFailed ? 'Options unavailable — enter manually.' : hint}
      />
    )
  }

  const selectValue = optionsLoading ? '' : getTaxonomySelectValue(value, options)
  const showOtherInput = selectValue === TAXONOMY_OTHER_VALUE

  const selectOptions = optionsLoading
    ? [{ value: '', label: 'Loading options…' }]
    : [
        { value: '', label: placeholder ?? `Select ${label.toLowerCase()}` },
        ...options.map((option) => ({ value: option.name, label: option.name })),
        { value: TAXONOMY_OTHER_VALUE, label: 'Other' },
      ]

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value

    if (next === '') {
      onChange('')
      return
    }

    if (next === TAXONOMY_OTHER_VALUE) {
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
        disabled={disabled || optionsLoading}
        required={required && !showOtherInput}
        hint={hint}
      />
      {showOtherInput ? (
        <TextField
          label={otherLabel}
          name={`${name}_other`}
          value={value}
          onChange={handleOtherChange}
          error={error}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
        />
      ) : null}
    </div>
  )
}

function isKnownSelection(value: string, options: TaxonomyOption[]): boolean {
  return options.some((option) => option.name === value.trim())
}
