import { Check } from 'lucide-react'

type ImportReviewCheckboxProps = {
  id: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
  describedBy?: string
}

export function ImportReviewCheckbox({
  id,
  checked,
  disabled = false,
  onChange,
  ariaLabel,
  describedBy,
}: ImportReviewCheckboxProps) {
  return (
    <span className="import-review-checkbox">
      <input
        id={id}
        type="checkbox"
        className="import-review-checkbox__input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
      />
      <span className="import-review-checkbox__box" aria-hidden="true">
        {checked ? <Check className="import-review-checkbox__icon" strokeWidth={3} /> : null}
      </span>
    </span>
  )
}
