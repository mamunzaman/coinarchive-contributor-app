import type { InputHTMLAttributes } from 'react'
import { FieldLabelWithHelp } from './FieldHelpTooltip'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  helpTooltip?: string
  error?: string
}

export function TextField({
  label,
  hint,
  helpTooltip,
  error,
  id,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabelWithHelp htmlFor={fieldId} label={label} helpText={helpTooltip} />
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
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
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="text-xs text-navy-muted">{hint}</p> : null}
    </div>
  )
}
