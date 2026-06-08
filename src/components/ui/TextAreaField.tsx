import type { TextareaHTMLAttributes } from 'react'
import { FieldLabelWithHelp } from './FieldHelpTooltip'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  helpTooltip?: string
  error?: string
}

export function TextAreaField({
  label,
  hint,
  helpTooltip,
  error,
  id,
  className = '',
  rows = 4,
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabelWithHelp htmlFor={fieldId} label={label} helpText={helpTooltip} />
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          'field-control resize-y',
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
