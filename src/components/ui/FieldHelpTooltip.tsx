import { Info } from 'lucide-react'
import { useId, useState } from 'react'

type FieldHelpTooltipProps = {
  text: string
  label?: string
}

export function FieldHelpTooltip({ text, label = 'Field help' }: FieldHelpTooltipProps) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-navy-muted transition-colors hover:bg-muted hover:text-navy"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-border/70 bg-white px-3 py-2 text-xs leading-relaxed text-navy shadow-[var(--shadow-card)]"
        >
          {text}
        </span>
      ) : null}
    </span>
  )
}

export function FieldLabelWithHelp({
  htmlFor,
  label,
  helpText,
}: {
  htmlFor: string
  label: string
  helpText?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-navy">
        {label}
      </label>
      {helpText ? <FieldHelpTooltip text={helpText} label={`Help for ${label}`} /> : null}
    </span>
  )
}
