import type { TextareaHTMLAttributes } from 'react'
import { FieldLabelWithHelp } from './FieldHelpTooltip'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  helpTooltip?: string
  error?: string
  attention?: string
}

export function TextAreaField({
  label,
  hint,
  helpTooltip,
  error,
  attention,
  id,
  className = '',
  rows = 4,
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined
  const attentionId = !error && attention ? `${fieldId}-attention` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabelWithHelp htmlFor={fieldId} label={label} helpText={helpTooltip} />
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? attentionId}
        className={[
          'field-control resize-y',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
            : attention
              ? 'border-amber-300/90 ring-1 ring-amber-200/70 focus:border-amber-400 focus:ring-amber-200/80'
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
      {!error && attention ? (
        <p id={attentionId} className="text-xs text-amber-800">
          {attention}
        </p>
      ) : null}
      {!error && !attention && hint ? <p className="text-xs text-navy-muted">{hint}</p> : null}
    </div>
  )
}
