import type { SelectHTMLAttributes } from 'react'
import { FieldLabelWithHelp } from './FieldHelpTooltip'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  hint?: string
  helpTooltip?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export function SelectField({
  label,
  hint,
  helpTooltip,
  error,
  options,
  id,
  className = '',
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabelWithHelp htmlFor={fieldId} label={label} helpText={helpTooltip} />
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          'field-control',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="text-xs text-navy-muted">{hint}</p> : null}
    </div>
  )
}
